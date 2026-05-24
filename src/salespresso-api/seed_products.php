<?php
/**
 * seed_products.php — Test product data
 * Run once: http://localhost/salespresso-api/seed_products.php
 * DELETE this file when done testing.
 */
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = getDB();

// ── Helpers ──────────────────────────────────────────────────────────────────

function insertProduct(PDO $pdo, string $id, string $name, string $category,
                       ?string $foodType, ?string $beverageType, ?string $beverageSubtype,
                       array $variants): void
{
    $dbCategory = ($category === 'Food') ? 'Food' : 'Beverage';

    // Check if product already exists
    $check = $pdo->prepare("SELECT COUNT(*) FROM product WHERE ProductID = ?");
    $check->execute([$id]);
    if ((int)$check->fetchColumn() > 0) {
        echo "  SKIP  $name (already exists)\n";
        return;
    }

    $pdo->prepare(
        "INSERT INTO product (ProductID, ProductName, Category, IsAvailable, ImageURL)
         VALUES (?, ?, ?, 1, '')"
    )->execute([$id, $name, $dbCategory]);

    if ($dbCategory === 'Beverage') {
        $pdo->prepare(
            "INSERT INTO beverage (ProductID, BeverageType, BeverageSubtype)
             VALUES (?, ?, ?)"
        )->execute([$id, $beverageType, $beverageSubtype]);
    } else {
        $pdo->prepare(
            "INSERT INTO food (ProductID, FoodType)
             VALUES (?, ?)"
        )->execute([$id, $foodType]);
    }

    $vStmt = $pdo->prepare(
        "INSERT INTO product_variant (VariantID, ProductID, SizeLabel, SizeOz, Price, IsAvailable)
         VALUES (?, ?, ?, NULL, ?, 1)"
    );
    foreach ($variants as [$vId, $sizeLabel, $price]) {
        $vStmt->execute([$vId, $id, $sizeLabel, $price]);
    }

    echo "  OK    $name\n";
}

// ── Product data ──────────────────────────────────────────────────────────────

$products = [

    // ── Coffee (Hot, BeverageSubtype: Coffee) ─────────────────────────────────
    ['P-CF001', 'Americano',         'Beverage', null,     'Hot', 'Coffee',     [['V-CF001S','Small',90],  ['V-CF001M','Medium',110], ['V-CF001L','Large',130]]],
    ['P-CF002', 'Cappuccino',        'Beverage', null,     'Hot', 'Coffee',     [['V-CF002S','Small',95],  ['V-CF002M','Medium',115], ['V-CF002L','Large',135]]],
    ['P-CF003', 'Caffe Latte',       'Beverage', null,     'Hot', 'Coffee',     [['V-CF003S','Small',100], ['V-CF003M','Medium',120], ['V-CF003L','Large',140]]],
    ['P-CF004', 'Espresso',          'Beverage', null,     'Hot', 'Coffee',     [['V-CF004S','Small',75],  ['V-CF004M','Medium',90],  ['V-CF004L','Large',105]]],
    ['P-CF005', 'Caramel Macchiato', 'Beverage', null,     'Hot', 'Coffee',     [['V-CF005S','Small',110], ['V-CF005M','Medium',130], ['V-CF005L','Large',150]]],
    ['P-CF006', 'Mocha',             'Beverage', null,     'Hot', 'Coffee',     [['V-CF006S','Small',105], ['V-CF006M','Medium',125], ['V-CF006L','Large',145]]],

    // ── Milktea (Iced, BeverageSubtype: Milk-based) ───────────────────────────
    ['P-MT001', 'Classic Milk Tea',       'Beverage', null, 'Iced', 'Milk-based', [['V-MT001S','Small',85],  ['V-MT001M','Medium',100], ['V-MT001L','Large',115]]],
    ['P-MT002', 'Taro Milk Tea',          'Beverage', null, 'Iced', 'Milk-based', [['V-MT002S','Small',90],  ['V-MT002M','Medium',105], ['V-MT002L','Large',120]]],
    ['P-MT003', 'Brown Sugar Milk Tea',   'Beverage', null, 'Iced', 'Milk-based', [['V-MT003S','Small',95],  ['V-MT003M','Medium',110], ['V-MT003L','Large',125]]],
    ['P-MT004', 'Wintermelon Milk Tea',   'Beverage', null, 'Iced', 'Milk-based', [['V-MT004S','Small',90],  ['V-MT004M','Medium',105], ['V-MT004L','Large',120]]],
    ['P-MT005', 'Jasmine Milk Tea',       'Beverage', null, 'Iced', 'Milk-based', [['V-MT005S','Small',85],  ['V-MT005M','Medium',100], ['V-MT005L','Large',115]]],
    ['P-MT006', 'Strawberry Milk Tea',    'Beverage', null, 'Iced', 'Milk-based', [['V-MT006S','Small',95],  ['V-MT006M','Medium',110], ['V-MT006L','Large',125]]],

    // ── Soda (Iced, BeverageSubtype: Fruit Soda) ──────────────────────────────
    ['P-SD001', 'Strawberry Soda',    'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD001S','Small',75],  ['V-SD001M','Medium',90],  ['V-SD001L','Large',105]]],
    ['P-SD002', 'Blueberry Soda',     'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD002S','Small',75],  ['V-SD002M','Medium',90],  ['V-SD002L','Large',105]]],
    ['P-SD003', 'Green Apple Soda',   'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD003S','Small',75],  ['V-SD003M','Medium',90],  ['V-SD003L','Large',105]]],
    ['P-SD004', 'Lychee Soda',        'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD004S','Small',80],  ['V-SD004M','Medium',95],  ['V-SD004L','Large',110]]],
    ['P-SD005', 'Passion Fruit Soda', 'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD005S','Small',80],  ['V-SD005M','Medium',95],  ['V-SD005L','Large',110]]],
    ['P-SD006', 'Mango Soda',         'Beverage', null, 'Iced', 'Fruit Soda', [['V-SD006S','Small',75],  ['V-SD006M','Medium',90],  ['V-SD006L','Large',105]]],

    // ── Mocktails (Iced, BeverageSubtype: Mocktails) ──────────────────────────
    ['P-MK001', 'Sunrise Mocktail',     'Beverage', null, 'Iced', 'Mocktails', [['V-MK001S','Small',95],  ['V-MK001M','Medium',110], ['V-MK001L','Large',125]]],
    ['P-MK002', 'Blue Lagoon',          'Beverage', null, 'Iced', 'Mocktails', [['V-MK002S','Small',95],  ['V-MK002M','Medium',110], ['V-MK002L','Large',125]]],
    ['P-MK003', 'Virgin Mojito',        'Beverage', null, 'Iced', 'Mocktails', [['V-MK003S','Small',90],  ['V-MK003M','Medium',105], ['V-MK003L','Large',120]]],
    ['P-MK004', 'Tropical Breeze',      'Beverage', null, 'Iced', 'Mocktails', [['V-MK004S','Small',95],  ['V-MK004M','Medium',110], ['V-MK004L','Large',125]]],
    ['P-MK005', 'Berry Blast',          'Beverage', null, 'Iced', 'Mocktails', [['V-MK005S','Small',95],  ['V-MK005M','Medium',110], ['V-MK005L','Large',125]]],
    ['P-MK006', 'Cucumber Mint Cooler', 'Beverage', null, 'Iced', 'Mocktails', [['V-MK006S','Small',90],  ['V-MK006M','Medium',105], ['V-MK006L','Large',120]]],

    // ── Lemonade (Iced, BeverageSubtype: Lemonade) ────────────────────────────
    ['P-LM001', 'Classic Lemonade',    'Beverage', null, 'Iced', 'Lemonade', [['V-LM001S','Small',75],  ['V-LM001M','Medium',90],  ['V-LM001L','Large',105]]],
    ['P-LM002', 'Strawberry Lemonade', 'Beverage', null, 'Iced', 'Lemonade', [['V-LM002S','Small',85],  ['V-LM002M','Medium',100], ['V-LM002L','Large',115]]],
    ['P-LM003', 'Blueberry Lemonade',  'Beverage', null, 'Iced', 'Lemonade', [['V-LM003S','Small',85],  ['V-LM003M','Medium',100], ['V-LM003L','Large',115]]],
    ['P-LM004', 'Mint Lemonade',       'Beverage', null, 'Iced', 'Lemonade', [['V-LM004S','Small',80],  ['V-LM004M','Medium',95],  ['V-LM004L','Large',110]]],
    ['P-LM005', 'Lavender Lemonade',   'Beverage', null, 'Iced', 'Lemonade', [['V-LM005S','Small',90],  ['V-LM005M','Medium',105], ['V-LM005L','Large',120]]],
    ['P-LM006', 'Honey Lemonade',      'Beverage', null, 'Iced', 'Lemonade', [['V-LM006S','Small',80],  ['V-LM006M','Medium',95],  ['V-LM006L','Large',110]]],

    // ── Sides (Food, FoodType: Snacks) ────────────────────────────────────────
    ['P-SI001', 'Club Sandwich',    'Food', 'Snacks', null, null, [['V-SI001','Medium',120]]],
    ['P-SI002', 'Cheese Fries',     'Food', 'Snacks', null, null, [['V-SI002','Medium',95]]],
    ['P-SI003', 'Onion Rings',      'Food', 'Snacks', null, null, [['V-SI003','Medium',85]]],
    ['P-SI004', 'Chicken Nuggets',  'Food', 'Snacks', null, null, [['V-SI004','Medium',110]]],
    ['P-SI005', 'Nachos',           'Food', 'Snacks', null, null, [['V-SI005','Medium',100]]],
    ['P-SI006', 'Waffle Fries',     'Food', 'Snacks', null, null, [['V-SI006','Medium',90]]],
];

// ── Insert ────────────────────────────────────────────────────────────────────

$categories = [
    'P-CF' => 'Coffee',
    'P-MT' => 'Milktea',
    'P-SD' => 'Soda',
    'P-MK' => 'Mocktails',
    'P-LM' => 'Lemonade',
    'P-SI' => 'Sides',
];

$currentGroup = '';

try {
    $pdo->beginTransaction();

    foreach ($products as [$id, $name, $category, $foodType, $beverageType, $beverageSubtype, $variants]) {
        $prefix = substr($id, 0, 5);
        if (isset($categories[$prefix]) && $categories[$prefix] !== $currentGroup) {
            $currentGroup = $categories[$prefix];
            echo "\n── $currentGroup ──\n";
        }
        insertProduct($pdo, $id, $name, $category, $foodType, $beverageType, $beverageSubtype, $variants);
    }

    $pdo->commit();
    echo "\nDone! 36 products seeded (6 per category).\n";
    echo "Delete seed_products.php when finished testing.\n";

} catch (Throwable $e) {
    $pdo->rollBack();
    echo "\nError: " . $e->getMessage() . "\n";
}
