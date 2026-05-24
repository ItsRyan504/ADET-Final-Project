<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';
require_once __DIR__ . '/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'    => handleGet(),
    'POST'   => handlePost(),
    'PUT'    => handlePut(),
    'DELETE' => handleDelete(),
    default  => jsonError('Method not allowed', 405),
};

/* ─── Helpers ─────────────────────────────────────────────── */

/**
 * Maps the frontend "category" label to DB fields.
 * Returns ['dbCategory'=>'Beverage'|'Food', 'beverageType'=>…, 'beverageSubtype'=>…, 'foodType'=>…]
 */
function frontendCategoryToDb(string $cat, array $temps): array {
    $beverageType    = !empty($temps) ? $temps[0] : 'Hot';
    $beverageSubtype = null;
    $foodType        = null;
    $dbCategory      = 'Beverage';

    switch ($cat) {
        case 'Coffee':    $beverageSubtype = 'Coffee';     break;
        case 'Milktea':   $beverageSubtype = 'Milk-based'; break;
        case 'Matcha':    $beverageSubtype = 'Matcha';     break;
        case 'Soda':      $beverageSubtype = 'Fruit Soda'; break;
        case 'Mocktail':
        case 'Mocktails': $beverageSubtype = 'Mocktails';  break;
        case 'Lemonade':  $beverageSubtype = 'Lemonade';   break;
        case 'Sides':
            $dbCategory = 'Food';
            $foodType   = 'Snacks';
            $beverageType    = null;
            $beverageSubtype = null;
            break;
        case 'Meals':
            $dbCategory = 'Food';
            $foodType   = 'Meals';
            $beverageType    = null;
            $beverageSubtype = null;
            break;
        default:
            // Unknown → treat as Beverage / Coffee fallback
            $beverageSubtype = 'Coffee';
    }

    return compact('dbCategory', 'beverageType', 'beverageSubtype', 'foodType');
}

/** Maps DB beverage/food subtype back to frontend category label */
function dbCategoryToFrontend(string $dbCategory, ?string $beverageSubtype, ?string $foodType): string {
    if ($dbCategory === 'Food') {
        return $foodType === 'Meals' ? 'Meals' : 'Sides';
    }
    return match ($beverageSubtype) {
        'Coffee'     => 'Coffee',
        'Milk-based' => 'Milktea',
        'Matcha'     => 'Matcha',
        'Fruit Soda' => 'Soda',
        'Mocktails'  => 'Mocktails',
        'Lemonade'   => 'Lemonade',
        default      => 'Coffee',
    };
}

/** Fetch all variants for a product and derive sizes/temps arrays */
function fetchVariants(PDO $pdo, string $productId): array {
    $stmt = $pdo->prepare(
        "SELECT VariantID, SizeLabel, SizeOz, Price, IsAvailable
           FROM product_variant
          WHERE ProductID = ?
          ORDER BY Price ASC"
    );
    $stmt->execute([$productId]);
    return $stmt->fetchAll();
}

/* ─── GET ──────────────────────────────────────────────────── */
function handleGet(): never {
    $pdo = getDB();

    $rows = $pdo->query(
        "SELECT p.ProductID, p.ProductName, p.Category AS DBCategory,
                p.IsAvailable, p.ImageURL,
                b.BeverageType, b.BeverageSubtype,
                f.FoodType
           FROM product p
           LEFT JOIN beverage b ON b.ProductID = p.ProductID
           LEFT JOIN food     f ON f.ProductID = p.ProductID
          ORDER BY p.ProductName ASC"
    )->fetchAll();

    $products = [];
    foreach ($rows as $r) {
        $variants = fetchVariants($pdo, $r['ProductID']);

        $sizes = [];
        $basePrice = 0;
        $variantList = [];
        foreach ($variants as $v) {
            $sizeLabel = $v['SizeLabel'] ?? $v['SizeOz'] ?? '';
            if ($sizeLabel && !in_array($sizeLabel, $sizes)) {
                $sizes[] = $sizeLabel;
            }
            if ($basePrice === 0) $basePrice = (float)$v['Price'];
            $variantList[] = [
                'variantId' => $v['VariantID'],
                'size'      => $sizeLabel,
                'price'     => (float)$v['Price'],
            ];
        }

        $temps = [];
        if ($r['BeverageType']) {
            $temps = [$r['BeverageType']];
        }

        $category = dbCategoryToFrontend(
            $r['DBCategory'],
            $r['BeverageSubtype'],
            $r['FoodType']
        );

        $products[] = [
            'id'       => $r['ProductID'],
            'name'     => $r['ProductName'],
            'category' => $category,
            'price'    => $basePrice,
            'sizes'    => $sizes,
            'temps'    => $temps,
            'status'   => $r['IsAvailable'] ? 'available' : 'unavailable',
            'image'    => $r['ImageURL'],
            'variants' => $variantList,
        ];
    }

    jsonOut($products);
}

/* ─── POST ─────────────────────────────────────────────────── */
function handlePost(): never {
    $staff = requireAdminAuth();
    $pdo  = getDB();
    $data = bodyJson();

    $id       = trim($data['id'] ?? '') ?: genId('P');
    $name     = trim($data['name'] ?? '');
    $category = trim($data['category'] ?? 'Coffee');
    $price    = (float)($data['price'] ?? 0);
    $sizes    = $data['sizes'] ?? [];
    $temps    = $data['temps'] ?? [];
    $status   = ($data['status'] ?? 'available') === 'available' ? 1 : 0;
    $image    = trim($data['image'] ?? '');
    $variants = $data['variants'] ?? [];

    if (!$name) jsonError('Product name is required.');

    $map             = frontendCategoryToDb($category, $temps);
    $dbCategory      = $map['dbCategory'];
    $beverageType    = $map['beverageType'];
    $beverageSubtype = $map['beverageSubtype'];
    $foodType        = $map['foodType'];

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
            "CALL sp_add_product(?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $id, $name, $dbCategory, $status, $image,
            $foodType, $beverageType, $beverageSubtype,
        ]);
        $stmt->closeCursor();

        upsertVariants($pdo, $id, $variants, $sizes, $price, $temps);

        $pdo->commit();
        $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        logAudit('Product Added', $name, "Category: $category | ID: $id", $staff['StaffID'], $staffName);
        jsonOut(['id' => $id], 201);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonError('Failed to add product: ' . $e->getMessage(), 500);
    }
}

/* ─── PUT ──────────────────────────────────────────────────── */
function handlePut(): never {
    $staff = requireAdminAuth();
    $pdo  = getDB();
    $data = bodyJson();

    $id       = trim($data['id'] ?? '');
    $name     = trim($data['name'] ?? '');
    $category = trim($data['category'] ?? 'Coffee');
    $price    = (float)($data['price'] ?? 0);
    $sizes    = $data['sizes'] ?? [];
    $temps    = $data['temps'] ?? [];
    $status   = ($data['status'] ?? 'available') === 'available' ? 1 : 0;
    $image    = trim($data['image'] ?? '');
    $variants = $data['variants'] ?? [];

    if (!$id)   jsonError('Product ID is required.');
    if (!$name) jsonError('Product name is required.');

    $map             = frontendCategoryToDb($category, $temps);
    $dbCategory      = $map['dbCategory'];
    $beverageType    = $map['beverageType'];
    $beverageSubtype = $map['beverageSubtype'];
    $foodType        = $map['foodType'];

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("CALL sp_update_product(?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $id, $name, $dbCategory, $status, $image,
            $foodType, $beverageType, $beverageSubtype,
        ]);
        $stmt->closeCursor();

        upsertVariants($pdo, $id, $variants, $sizes, $price, $temps);

        $pdo->commit();
        $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        logAudit('Product Updated', $name, "Category: $category | ID: $id", $staff['StaffID'], $staffName);
        jsonOut(['id' => $id]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonError('Failed to update product: ' . $e->getMessage(), 500);
    }
}

/* ─── DELETE ───────────────────────────────────────────────── */
function handleDelete(): never {
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $id    = trim($_GET['id'] ?? '');

    if (!$id) jsonError('Product ID is required.');

    try {
        $pdo->beginTransaction();
        $nameRow = $pdo->prepare("SELECT ProductName FROM product WHERE ProductID = ?");
        $nameRow->execute([$id]);
        $productName = $nameRow->fetchColumn() ?: $id;

        // Remove variants first (FK prevents direct product delete)
        $pdo->prepare("DELETE FROM product_variant WHERE ProductID = ?")->execute([$id]);
        $stmt = $pdo->prepare("DELETE FROM product WHERE ProductID = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonError('Product not found.', 404);
        }
        $pdo->commit();
        $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        logAudit('Product Deleted', (string)$productName, "ID: $id", $staff['StaffID'], $staffName);
        jsonOut(['deleted' => $id]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        jsonError('Failed to delete product: ' . $e->getMessage(), 500);
    }
}

/* ─── Variant upsert helper ────────────────────────────────── */
function upsertVariants(PDO $pdo, string $productId, array $variants, array $sizes, float $basePrice, array $temps): void {
    $labelSizes = ['Small', 'Medium', 'Large', 'XXL'];
    $ozSizes    = ['8oz', '12oz', '16oz', '22oz'];

    if (!empty($variants)) {
        $upsert = $pdo->prepare(
            "INSERT INTO product_variant (VariantID, ProductID, SizeLabel, SizeOz, Price, IsAvailable)
             VALUES (?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE Price = VALUES(Price)"
        );
        foreach ($variants as $v) {
            $vid       = trim($v['variantId'] ?? '') ?: genId('V');
            $size      = trim($v['size'] ?? '');
            $price     = (float)($v['price'] ?? $basePrice);
            $sizeLabel = in_array($size, $labelSizes) ? $size : null;
            $sizeOz    = in_array($size, $ozSizes)    ? $size : null;
            $upsert->execute([$vid, $productId, $sizeLabel, $sizeOz, $price]);
        }
    } elseif (!empty($sizes)) {
        $upsert = $pdo->prepare(
            "INSERT INTO product_variant (VariantID, ProductID, SizeLabel, SizeOz, Price, IsAvailable)
             VALUES (?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE Price = VALUES(Price)"
        );
        foreach ($sizes as $size) {
            $sizeLabel = in_array($size, $labelSizes) ? $size : null;
            $sizeOz    = in_array($size, $ozSizes)    ? $size : null;
            $upsert->execute([genId('V'), $productId, $sizeLabel, $sizeOz, $basePrice]);
        }
    } else {
        // No sizes/variants — single default variant (both size columns null, allowed after dropping size_exclusive)
        $existing = $pdo->prepare("SELECT COUNT(*) FROM product_variant WHERE ProductID = ?");
        $existing->execute([$productId]);
        if ((int)$existing->fetchColumn() === 0) {
            $pdo->prepare(
                "INSERT INTO product_variant (VariantID, ProductID, SizeLabel, SizeOz, Price, IsAvailable)
                 VALUES (?, ?, NULL, NULL, ?, 1)"
            )->execute([genId('V'), $productId, $basePrice]);
        }
    }
}

