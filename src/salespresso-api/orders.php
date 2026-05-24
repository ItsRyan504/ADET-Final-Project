<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';
require_once __DIR__ . '/audit_helper.php';
require_once __DIR__ . '/rate_limit.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'    => handleGet(),
    'POST'   => handlePost(),
    'PUT'    => handlePut(),
    'DELETE' => handleDelete(),
    default  => jsonError('Method not allowed', 405),
};

/* ─── Ensure orders table exists with all required columns ── */
function ensureOrdersTable(): void {
    $pdo = getDB();
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS orders (
            OrderID      VARCHAR(12)    NOT NULL PRIMARY KEY,
            CustomerID   VARCHAR(12)    NULL,
            StaffID      VARCHAR(12)    NULL,
            OrderDate    DATETIME       NOT NULL DEFAULT NOW(),
            OrderStatus  VARCHAR(20)    NOT NULL DEFAULT 'Pending',
            FinalAmount  DECIMAL(10,2)  NOT NULL DEFAULT 0,
            Note         TEXT           NULL,
            ItemsSummary LONGTEXT       NULL,
            CompletedAt  DATETIME       NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    // Add columns that may be missing from older table versions
    $cols = ['Note' => 'TEXT NULL', 'ItemsSummary' => 'LONGTEXT NULL', 'CompletedAt' => 'DATETIME NULL'];
    foreach ($cols as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS `$col` $def");
        } catch (Throwable) {}
    }
    // Ensure StaffID allows NULL (customer orders have no staff yet)
    try {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN StaffID VARCHAR(12) NULL");
    } catch (Throwable) {}
}

/* ─── Ensure payment table exists ───────────────────────── */
function ensurePaymentTable(): void {
    $pdo = getDB();
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payment (
            PaymentID            VARCHAR(12)   NOT NULL PRIMARY KEY,
            OrderID              VARCHAR(12)   NOT NULL,
            PaymentMethod        VARCHAR(20)   NOT NULL DEFAULT 'In-store',
            PaymentStatus        VARCHAR(20)   NOT NULL DEFAULT 'Pending',
            AmountPaid           DECIMAL(10,2) NOT NULL DEFAULT 0,
            TransactionReference VARCHAR(100)  NULL,
            PaidAt               DATETIME      NULL,
            UNIQUE KEY uq_payment_order (OrderID),
            CONSTRAINT fk_payment_order FOREIGN KEY (OrderID)
                REFERENCES orders (OrderID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

/* ─── Ensure product_ingredient table and seed recipes ─── */
function ensureProductIngredientTable(): void {
    $pdo = getDB();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS product_ingredient (
            VariantID    VARCHAR(12)   NOT NULL,
            IngredientID VARCHAR(12)   NOT NULL,
            QuantityUsed DECIMAL(10,3) NOT NULL DEFAULT 0,
            PRIMARY KEY (VariantID, IngredientID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Also ensure ingredients table exists before seeding
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ingredients (
            IngredientID     VARCHAR(12)    NOT NULL PRIMARY KEY,
            IngredientName   VARCHAR(100)   NOT NULL,
            StockQuantity    DECIMAL(10,2)  NOT NULL DEFAULT 0,
            Unit             VARCHAR(20)    NOT NULL DEFAULT 'g',
            LowStockThreshold DECIMAL(10,2) NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $count = (int)$pdo->query("SELECT COUNT(*) FROM product_ingredient")->fetchColumn();
    if ($count > 0) return;

    seedDefaultRecipes($pdo);
}

function seedDefaultRecipes(PDO $pdo): void {
    // Helper: find VariantID by product name + size (matches SizeLabel or SizeOz)
    $findVariant = $pdo->prepare("
        SELECT pv.VariantID
          FROM product_variant pv
          JOIN product p ON p.ProductID = pv.ProductID
         WHERE p.ProductName = ?
           AND (? = '' OR pv.SizeLabel = ? OR pv.SizeOz = ?)
         ORDER BY pv.Price ASC
         LIMIT 1
    ");

    // Helper: find IngredientID by name
    $findIng = $pdo->prepare("
        SELECT IngredientID FROM ingredients WHERE IngredientName = ? LIMIT 1
    ");

    $insert = $pdo->prepare("
        INSERT IGNORE INTO product_ingredient (VariantID, IngredientID, QuantityUsed)
        VALUES (?, ?, ?)
    ");

    // Recipes: [productName, size (''/null = any), [[ingredientName, qty], ...]]
    // Quantities are in the ingredient's own unit (ml for liquids, g for solids, pcs for pieces)
    $recipes = [
        // Classic Americano
        ['Classic Americano', '8oz',  [['Espresso Shots', 60],  ['Simple Syrup', 15]]],
        ['Classic Americano', '12oz', [['Espresso Shots', 90],  ['Simple Syrup', 20]]],

        // Iced Caramel Latte
        ['Iced Caramel Latte', '12oz', [['Espresso Shots', 60],  ['Whole Milk', 150], ['Caramel Sauce', 20], ['Ice', 100]]],
        ['Iced Caramel Latte', '16oz', [['Espresso Shots', 90],  ['Whole Milk', 200], ['Caramel Sauce', 30], ['Ice', 150]]],
        ['Iced Caramel Latte', '22oz', [['Espresso Shots', 120], ['Whole Milk', 270], ['Caramel Sauce', 40], ['Ice', 200]]],

        // Matcha Milk Tea
        ['Matcha Milk Tea', '12oz', [['Matcha Powder', 15], ['Whole Milk', 150], ['Simple Syrup', 20], ['Ice', 100]]],
        ['Matcha Milk Tea', '16oz', [['Matcha Powder', 20], ['Whole Milk', 200], ['Simple Syrup', 25], ['Ice', 150]]],
        ['Matcha Milk Tea', '22oz', [['Matcha Powder', 25], ['Whole Milk', 270], ['Simple Syrup', 35], ['Ice', 200]]],

        // Strawberry Lemonade
        ['Strawberry Lemonade', '16oz', [['Lemon Juice', 60],  ['Strawberry Puree', 80],  ['Simple Syrup', 30], ['Ice', 150]]],
        ['Strawberry Lemonade', '22oz', [['Lemon Juice', 80],  ['Strawberry Puree', 110], ['Simple Syrup', 40], ['Ice', 200]]],

        // Mango Shake
        ['Mango Shake', '16oz', [['Mango Puree', 150], ['Whole Milk', 100], ['Ice', 150]]],
        ['Mango Shake', '22oz', [['Mango Puree', 200], ['Whole Milk', 130], ['Ice', 200]]],

        // Cheesecake Slice
        ['Cheesecake Slice', 'Small', [['Cheese', 80]]],
        ['Cheesecake Slice', 'Large', [['Cheese', 140]]],

        // Club Sandwich
        ['Club Sandwich', 'Medium', [['Bread Slices', 3], ['Cheese', 50], ['Chicken', 120]]],
    ];

    foreach ($recipes as [$productName, $size, $ingredients]) {
        $findVariant->execute([$productName, $size, $size, $size]);
        $variantId = $findVariant->fetchColumn();
        if (!$variantId) continue;

        foreach ($ingredients as [$ingName, $qty]) {
            $findIng->execute([$ingName]);
            $ingId = $findIng->fetchColumn();
            if (!$ingId) continue;
            $insert->execute([$variantId, $ingId, $qty]);
        }
    }
}

/* ─── Deduct ingredients when an order is placed ─────── */
function deductIngredients(PDO $pdo, array $cartItems): void {
    if (empty($cartItems)) return;

    // Silently skip if product_ingredient table doesn't exist yet
    try {
        $pdo->query("SELECT 1 FROM product_ingredient LIMIT 1");
    } catch (Throwable) { return; }

    $findVariant = $pdo->prepare("
        SELECT VariantID FROM product_variant
         WHERE ProductID = ?
           AND (? = '' OR SizeLabel = ? OR SizeOz = ?)
         ORDER BY Price ASC
         LIMIT 1
    ");

    $getIngredients = $pdo->prepare("
        SELECT IngredientID, QuantityUsed
          FROM product_ingredient
         WHERE VariantID = ?
    ");

    $deduct = $pdo->prepare("
        UPDATE ingredients
           SET StockQuantity = GREATEST(0, StockQuantity - ?)
         WHERE IngredientID = ?
    ");

    foreach ($cartItems as $item) {
        $productId = trim($item['id'] ?? '');
        $size      = trim($item['selectedSize'] ?? '');
        $qty       = max(1, (int)($item['qty'] ?? 1));

        if (!$productId) continue;

        // Find the exact variant by product + size
        $findVariant->execute([$productId, $size, $size, $size]);
        $variantId = $findVariant->fetchColumn();

        // Fallback: cheapest variant for this product
        if (!$variantId) {
            $stmt = $pdo->prepare("SELECT VariantID FROM product_variant WHERE ProductID = ? ORDER BY Price ASC LIMIT 1");
            $stmt->execute([$productId]);
            $variantId = $stmt->fetchColumn();
        }
        if (!$variantId) continue;

        $getIngredients->execute([$variantId]);
        foreach ($getIngredients->fetchAll() as $ing) {
            $deduct->execute([$qty * (float)$ing['QuantityUsed'], $ing['IngredientID']]);
        }
    }
}

/* ─── GET: all orders or filtered by userId ─────────────── */
function handleGet(): never {
    ensureOrdersTable();
    ensurePaymentTable();
    $pdo    = getDB();
    $userId = trim($_GET['userId'] ?? '');

    try {
        if ($userId) {
            $stmt = $pdo->prepare(
                "SELECT o.OrderID, o.CustomerID, o.OrderDate, o.OrderStatus,
                        o.FinalAmount, o.Note, o.ItemsSummary, o.CompletedAt,
                        o.OrderType, o.DeliveryAddress, o.DeliveryLatLng, o.DeliveryFee, o.PhoneNumber,
                        p.PaymentMethod, p.PaymentStatus
                   FROM orders o
                   LEFT JOIN payment p ON p.OrderID = o.OrderID
                  WHERE o.CustomerID = ?
                  ORDER BY o.OrderDate DESC"
            );
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->query(
                "SELECT o.OrderID, o.CustomerID,
                        CONCAT(c.C_FirstName, ' ', c.C_LastName) AS CustomerName,
                        o.OrderDate, o.OrderStatus, o.FinalAmount, o.Note, o.ItemsSummary,
                        o.CompletedAt, o.StaffID,
                        CONCAT(s.S_FirstName, ' ', s.S_LastName) AS EmployeeName,
                        o.OrderType, o.DeliveryAddress, o.DeliveryLatLng, o.DeliveryFee, o.PhoneNumber,
                        p.PaymentMethod, p.PaymentStatus
                   FROM orders o
                   LEFT JOIN customer c ON c.CustomerID = o.CustomerID
                   LEFT JOIN staff    s ON s.StaffID    = o.StaffID
                   LEFT JOIN payment  p ON p.OrderID    = o.OrderID
                  ORDER BY o.OrderDate DESC"
            );
        }
    } catch (Throwable) {
        // JOIN failed — fall back to simple query without payment info
        $stmt = $pdo->query(
            "SELECT OrderID, CustomerID, NULL AS CustomerName,
                    OrderDate, OrderStatus, FinalAmount, Note, ItemsSummary,
                    CompletedAt, StaffID, NULL AS EmployeeName,
                    NULL AS OrderType, NULL AS DeliveryAddress, NULL AS DeliveryLatLng,
                    0 AS DeliveryFee, NULL AS PhoneNumber,
                    NULL AS PaymentMethod, NULL AS PaymentStatus
               FROM orders
              ORDER BY OrderDate DESC"
        );
    }

    $rows   = $stmt->fetchAll();
    $orders = array_map('mapOrder', $rows);
    jsonOut($orders);
}

/* ─── POST: place a new order ───────────────────────────── */
function handlePost(): never {
    checkRateLimit('place_order', 10, 300); // 10 orders per 5 min per IP
    ensureOrdersTable();
    ensurePaymentTable();
    ensureProductIngredientTable();
    $pdo  = getDB();
    $body = bodyJson();

    $userId          = trim($body['userId']          ?? '');
    $customer        = trim($body['customer']        ?? 'Guest');
    $items           = $body['items']                 ?? [];
    $subtotal        = (float)($body['subtotal']     ?? $body['total'] ?? 0);
    $note            = trim($body['note']            ?? '');
    $cartItems       = $body['cartItems']             ?? [];
    $paymentMethod   = trim($body['paymentMethod']   ?? 'cash');
    $rewardId        = trim($body['rewardId']        ?? '');
    $orderType       = trim($body['orderType']       ?? 'Pickup');
    $deliveryAddress = trim($body['deliveryAddress'] ?? '');
    $deliveryLatLng  = trim($body['deliveryLatLng']  ?? '');
    $deliveryFee     = (float)($body['deliveryFee']  ?? 0);
    $phoneNumber     = trim($body['phoneNumber']     ?? '');

    $dbPaymentMethod = $paymentMethod === 'online' ? 'GCash' : 'In-store';

    $id     = genId('O');
    $cid    = $userId ?: null;

    // Validate reward against DB and compute server-side discount
    $validRewardId = null;
    $finalTotal    = $subtotal;
    if ($rewardId && $cid) {
        try {
            $activeStmt = $pdo->prepare("SELECT ActiveRewardID FROM customer WHERE CustomerID = ?");
            $activeStmt->execute([$cid]);
            $activeRewardId = $activeStmt->fetchColumn();

            if ($activeRewardId === $rewardId) {
                $rewStmt = $pdo->prepare(
                    "SELECT RewardType, RewardValue FROM stamp_reward WHERE RewardID = ? LIMIT 1"
                );
                $rewStmt->execute([$rewardId]);
                $reward = $rewStmt->fetch();
                if ($reward) {
                    $validRewardId = $rewardId;
                    if ($reward['RewardType'] === 'Percentage') {
                        $finalTotal = $subtotal * (1 - (float)$reward['RewardValue'] / 100);
                    } elseif ($reward['RewardType'] === 'Fixed Amount') {
                        $finalTotal = max(0, $subtotal - (float)$reward['RewardValue']);
                    }
                }
            }
        } catch (Throwable) {}
    }

    // Online orders wait in 'Awaiting Payment' until PayMongo confirms payment
    $status = ($paymentMethod === 'online') ? 'Awaiting Payment' : 'Pending';

    // Migrate OrderStatus column to support 'Awaiting Payment' before inserting
    try {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN OrderStatus
            ENUM('Awaiting Payment','Pending','Preparing','Completed','Cancelled','Refunded') NOT NULL DEFAULT 'Pending'");
    } catch (Throwable) {}

    // Ensure RewardID column exists on orders table
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS RewardID VARCHAR(12) DEFAULT NULL");
    } catch (Throwable) {}

    // Ensure delivery columns exist
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS OrderType ENUM('Pickup','Dine-in','Delivery') NOT NULL DEFAULT 'Pickup'");
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS DeliveryAddress TEXT DEFAULT NULL");
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS DeliveryLatLng VARCHAR(60) DEFAULT NULL");
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS DeliveryFee DECIMAL(10,2) DEFAULT 0");
        $pdo->exec("ALTER TABLE orders ADD COLUMN IF NOT EXISTS PhoneNumber VARCHAR(30) DEFAULT NULL");
    } catch (Throwable) {}

    // Add delivery fee to total
    if ($orderType === 'Delivery') {
        $finalTotal += $deliveryFee;
    }

    try {
        $pdo->prepare(
            "INSERT INTO orders
               (OrderID, CustomerID, StaffID, RewardID, OrderDate, OrderStatus, FinalAmount, Note, ItemsSummary,
                OrderType, DeliveryAddress, DeliveryLatLng, DeliveryFee, PhoneNumber)
             VALUES (?, ?, NULL, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $id,
            $cid,
            $validRewardId,
            $status,
            $finalTotal,
            $note ?: null,
            $cartItems ? json_encode($cartItems, JSON_UNESCAPED_UNICODE) : json_encode($items),
            $orderType,
            $deliveryAddress ?: null,
            $deliveryLatLng ?: null,
            $deliveryFee ?: 0,
            $phoneNumber ?: null,
        ]);
    } catch (Throwable $e) {
        jsonError('Failed to place order: ' . $e->getMessage(), 500);
    }

    // Clear the customer's active reward now that it has been used
    if ($validRewardId && $cid) {
        try {
            $pdo->prepare("UPDATE customer SET ActiveRewardID = NULL WHERE CustomerID = ?")
                ->execute([$cid]);
        } catch (Throwable) {}
    }

    // Deduct ingredients from inventory for each ordered item
    try {
        deductIngredients($pdo, $cartItems);
    } catch (Throwable) {}

    // Create corresponding payment record
    try {
        $pid = genId('P');
        $pdo->prepare(
            "INSERT INTO payment (PaymentID, OrderID, PaymentMethod, PaymentStatus, AmountPaid)
             VALUES (?, ?, ?, 'Pending', ?)"
        )->execute([$pid, $id, $dbPaymentMethod, $finalTotal]);
    } catch (Throwable $e) {
        jsonError('Failed to create payment record: ' . $e->getMessage(), 500);
    }

    $now      = new DateTime();
    $dateStr  = $now->format('M j, Y');
    $timeStr  = $now->format('g:i A');

    jsonOut([
        'id'              => '#' . $id,
        'dbId'            => $id,
        'userId'          => $userId ?: 'guest',
        'customer'        => $customer,
        'date'            => "$dateStr · $timeStr",
        'items'           => $items,
        'total'           => $finalTotal,
        'note'            => $note,
        'status'          => $status,
        'paymentMethod'   => $paymentMethod,
        'paymentStatus'   => 'Pending',
        'rewardId'        => $validRewardId,
        'orderType'       => $orderType,
        'deliveryAddress' => $deliveryAddress ?: null,
        'deliveryLatLng'  => $deliveryLatLng ?: null,
        'deliveryFee'     => $deliveryFee,
        'phoneNumber'     => $phoneNumber ?: null,
    ], 201);
}

/* ─── PUT: update order status ──────────────────────────── */
function handlePut(): never {
    $staff  = requireAdminAuth();
    $pdo    = getDB();
    $body   = bodyJson();
    $id     = trim($body['id']     ?? '');
    $status = trim($body['status'] ?? '');

    if (!$id || !$status) jsonError('Order ID and status are required.');

    $allowed = ['Pending', 'Preparing', 'Completed', 'Cancelled', 'Refunded'];
    if (!in_array($status, $allowed)) jsonError("Invalid status: $status", 400);

    $dbId = ltrim($id, '#');

    try {
        // Ensure OrderStatus column accepts all needed values
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN OrderStatus
            ENUM('Awaiting Payment','Pending','Preparing','Completed','Cancelled','Refunded') NOT NULL DEFAULT 'Pending'");
    } catch (Throwable) {}

    try {
        $completedAt = $status === 'Completed' ? date('Y-m-d H:i:s') : null;
        $stmt = $pdo->prepare(
            "UPDATE orders SET OrderStatus = ?, StaffID = ?,
             CompletedAt = IF(? = 'Completed', NOW(), CompletedAt)
             WHERE OrderID = ?"
        );
        $stmt->execute([$status, $staff['StaffID'], $status, $dbId]);

        if ($stmt->rowCount() === 0) {
            jsonError('Order not found. ID: ' . $dbId, 404);
        }
    } catch (Throwable $e) {
        jsonError('Failed to update order: ' . $e->getMessage(), 500);
    }

    // Award loyalty points when order is completed
    if ($status === 'Completed') {
        try {
            $orderRow = $pdo->prepare("SELECT CustomerID, ItemsSummary FROM orders WHERE OrderID = ?");
            $orderRow->execute([$dbId]);
            $order = $orderRow->fetch();

            if ($order && $order['CustomerID']) {
                $points = 0;
                $summary = json_decode($order['ItemsSummary'] ?? '[]', true);
                if (is_array($summary)) {
                    foreach ($summary as $item) {
                        // ItemsSummary may be full cart objects or "Nx Name" strings
                        if (isset($item['qty'])) {
                            $points += (int)$item['qty'];
                        } elseif (is_string($item)) {
                            preg_match('/^(\d+)x/', $item, $m);
                            $points += isset($m[1]) ? (int)$m[1] : 1;
                        } else {
                            $points += 1;
                        }
                    }
                }
                if ($points > 0) {
                    // Increment points and update tier
                    $pdo->prepare("
                        UPDATE customer
                           SET LoyaltyPoints = LoyaltyPoints + ?,
                               Tier = CASE
                                 WHEN LoyaltyPoints + ? >= 1500 THEN 'Gold'
                                 WHEN LoyaltyPoints + ? >= 500  THEN 'Silver'
                                 ELSE 'Bronze'
                               END
                         WHERE CustomerID = ?
                    ")->execute([$points, $points, $points, $order['CustomerID']]);
                }
            }
        } catch (Throwable) {}
    }

    $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
    logAudit('Order Status Changed', '#' . $dbId, "Status → $status", $staff['StaffID'], $staffName);

    jsonOut(['success' => true, 'id' => $id, 'status' => $status]);
}

/* ─── DELETE: clear all orders (dev/reset only) ─────────── */
function handleDelete(): never {
    requireAdminAuth();
    $pdo = getDB();
    // Safety: only allow if ?confirm=yes
    if (($_GET['confirm'] ?? '') !== 'yes') {
        jsonError('Pass ?confirm=yes to clear all orders.', 400);
    }
    $pdo->exec("DELETE FROM orders");
    jsonOut(['cleared' => true]);
}

/* ─── Helper ─────────────────────────────────────────────── */
function mapOrder(array $row): array {
    $itemsSummary = $row['ItemsSummary'] ?? null;
    $items = [];
    if ($itemsSummary) {
        $decoded = json_decode($itemsSummary, true);
        if (is_array($decoded)) {
            // Could be full cartItems or string array
            if (isset($decoded[0]) && is_string($decoded[0])) {
                $items = $decoded;
            } else {
                $items = array_map(fn($i) => ($i['qty'] ?? 1) . 'x ' . ($i['name'] ?? ''), $decoded);
            }
        }
    }

    $rawPaymentMethod = $row['PaymentMethod'] ?? null;
    $paymentMethod    = $rawPaymentMethod === 'GCash' ? 'online' : 'cash';

    return [
        'id'              => '#' . $row['OrderID'],
        'dbId'            => $row['OrderID'],
        'userId'          => $row['CustomerID'] ?? 'guest',
        'customer'        => isset($row['CustomerName'])
                               ? $row['CustomerName']
                               : ($row['CustomerID'] ?? 'Guest'),
        'date'            => (new DateTime($row['OrderDate']))->format('M j, Y · g:i A'),
        'completedAt'     => !empty($row['CompletedAt'])
                               ? (new DateTime($row['CompletedAt']))->format('M j, Y · g:i A')
                               : null,
        'items'           => $items,
        'total'           => (float)$row['FinalAmount'],
        'note'            => $row['Note'] ?? '',
        'status'          => $row['OrderStatus'],
        'employee'        => isset($row['EmployeeName']) && trim($row['EmployeeName']) !== ' '
                               ? trim($row['EmployeeName']) : null,
        'paymentMethod'   => $rawPaymentMethod ? $paymentMethod : 'cash',
        'paymentStatus'   => $row['PaymentStatus'] ?? 'Pending',
        'orderType'       => $row['OrderType'] ?? 'Pickup',
        'deliveryAddress' => $row['DeliveryAddress'] ?? null,
        'deliveryLatLng'  => $row['DeliveryLatLng'] ?? null,
        'deliveryFee'     => (float)($row['DeliveryFee'] ?? 0),
        'phoneNumber'     => $row['PhoneNumber'] ?? null,
    ];
}

