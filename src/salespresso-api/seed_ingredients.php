<?php
/**
 * seed_ingredients.php — Ingredient stock and product recipe data
 * Run once: http://localhost/salespresso-api/seed_ingredients.php
 * DELETE this file when done testing.
 */
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = getDB();

// ── Helpers ──────────────────────────────────────────────────────────────────

function insertIngredient(PDO $pdo, string $id, string $name, float $qty, string $unit, float $threshold): void
{
    $check = $pdo->prepare("SELECT COUNT(*) FROM ingredients WHERE IngredientID = ?");
    $check->execute([$id]);
    if ((int)$check->fetchColumn() > 0) {
        echo "  SKIP  $name (already exists)\n";
        return;
    }

    $pdo->prepare(
        "INSERT INTO ingredients (IngredientID, IngredientName, StockQuantity, Unit, LowStockThreshold)
         VALUES (?, ?, ?, ?, ?)"
    )->execute([$id, $name, $qty, $unit, $threshold]);

    echo "  OK    $name\n";
}

function insertRecipe(PDO $pdo, string $variantId, string $ingredientId, float $qtyUsed): void
{
    $pdo->prepare(
        "INSERT IGNORE INTO product_ingredient (VariantID, IngredientID, QuantityUsed)
         VALUES (?, ?, ?)"
    )->execute([$variantId, $ingredientId, $qtyUsed]);
}

// ── Ensure product_ingredient table exists ────────────────────────────────────

$pdo->exec("
    CREATE TABLE IF NOT EXISTS product_ingredient (
        VariantID    VARCHAR(12)   NOT NULL,
        IngredientID VARCHAR(12)   NOT NULL,
        QuantityUsed DECIMAL(10,3) NOT NULL DEFAULT 0,
        PRIMARY KEY (VariantID, IngredientID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// ── Ingredient data ───────────────────────────────────────────────────────────
// [id, name, startingStock, unit, lowStockThreshold]

$ingredients = [

    // ── Shared / General ──────────────────────────────────────────────────────
    ['I-ESP', 'Espresso Shots',    10000.00, 'ml',  1000.00],
    ['I-MLK', 'Whole Milk',        20000.00, 'ml',  2000.00],
    ['I-SYR', 'Simple Syrup',       8000.00, 'ml',   800.00],
    ['I-ICE', 'Ice',               50000.00, 'g',   5000.00],
    ['I-TEA', 'Tea Base',          15000.00, 'ml',  1500.00],
    ['I-SOD', 'Soda Water',        20000.00, 'ml',  2000.00],

    // ── Coffee ────────────────────────────────────────────────────────────────
    ['I-CAR', 'Caramel Sauce',      3000.00, 'ml',   300.00],
    ['I-CHC', 'Chocolate Sauce',    3000.00, 'ml',   300.00],

    // ── Milktea ───────────────────────────────────────────────────────────────
    ['I-TAR', 'Taro Powder',        2000.00, 'g',    200.00],
    ['I-BSY', 'Brown Sugar Syrup',  4000.00, 'ml',   400.00],

    // ── Fruit / Purees ────────────────────────────────────────────────────────
    ['I-STR', 'Strawberry Puree',   3000.00, 'ml',   300.00],
    ['I-MGO', 'Mango Puree',        3000.00, 'ml',   300.00],
    ['I-BLU', 'Blueberry Puree',    3000.00, 'ml',   300.00],
    ['I-MXB', 'Mixed Berry Puree',  3000.00, 'ml',   300.00],

    // ── Juices ────────────────────────────────────────────────────────────────
    ['I-LEM', 'Lemon Juice',        4000.00, 'ml',   400.00],
    ['I-LIM', 'Lime Juice',         3000.00, 'ml',   300.00],
    ['I-OJC', 'Orange Juice',       5000.00, 'ml',   500.00],
    ['I-PJC', 'Pineapple Juice',    5000.00, 'ml',   500.00],

    // ── Flavoring ─────────────────────────────────────────────────────────────
    ['I-MNT', 'Mint Leaves',         500.00, 'g',     50.00],
    ['I-LAV', 'Lavender Syrup',     2000.00, 'ml',   200.00],
    ['I-HON', 'Honey',              3000.00, 'ml',   300.00],

    // ── Food ──────────────────────────────────────────────────────────────────
    ['I-BRD', 'Bread Slices',        200.00, 'pcs',   20.00],
    ['I-CHE', 'Cheese',             5000.00, 'g',    500.00],
    ['I-CHK', 'Chicken',            8000.00, 'g',    800.00],
    ['I-POT', 'Potato',            10000.00, 'g',   1000.00],
    ['I-ONI', 'Onion',              5000.00, 'g',    500.00],
    ['I-NCH', 'Nachos Chips',       3000.00, 'g',    300.00],
    ['I-SLS', 'Salsa Sauce',        2000.00, 'ml',   200.00],
];

// ── Recipe data ───────────────────────────────────────────────────────────────
// Each entry: [variantId, [[ingredientId, qtyUsed], ...]]
// Sizes: Small = base | Medium ≈ 1.33x | Large ≈ 1.67x (rounded to nice numbers)
// Hot drinks: no ice. Iced drinks: always include ice.

$recipes = [

    // ════════════════════════════════════════════════════
    // COFFEE — Hot, no ice
    // ════════════════════════════════════════════════════

    // Americano — espresso + water, light syrup
    'V-CF001S' => [['I-ESP', 60],  ['I-SYR', 10]],
    'V-CF001M' => [['I-ESP', 90],  ['I-SYR', 15]],
    'V-CF001L' => [['I-ESP', 120], ['I-SYR', 20]],

    // Cappuccino — espresso + equal steamed milk
    'V-CF002S' => [['I-ESP', 60],  ['I-MLK', 100]],
    'V-CF002M' => [['I-ESP', 90],  ['I-MLK', 130]],
    'V-CF002L' => [['I-ESP', 120], ['I-MLK', 160]],

    // Caffe Latte — espresso + lots of milk
    'V-CF003S' => [['I-ESP', 60],  ['I-MLK', 150]],
    'V-CF003M' => [['I-ESP', 90],  ['I-MLK', 200]],
    'V-CF003L' => [['I-ESP', 120], ['I-MLK', 250]],

    // Espresso — pure shots
    'V-CF004S' => [['I-ESP', 60]],
    'V-CF004M' => [['I-ESP', 90]],
    'V-CF004L' => [['I-ESP', 120]],

    // Caramel Macchiato — espresso + milk + caramel
    'V-CF005S' => [['I-ESP', 60],  ['I-MLK', 150], ['I-CAR', 20]],
    'V-CF005M' => [['I-ESP', 90],  ['I-MLK', 200], ['I-CAR', 25]],
    'V-CF005L' => [['I-ESP', 120], ['I-MLK', 250], ['I-CAR', 35]],

    // Mocha — espresso + milk + chocolate
    'V-CF006S' => [['I-ESP', 60],  ['I-MLK', 120], ['I-CHC', 30]],
    'V-CF006M' => [['I-ESP', 90],  ['I-MLK', 160], ['I-CHC', 40]],
    'V-CF006L' => [['I-ESP', 120], ['I-MLK', 200], ['I-CHC', 50]],

    // ════════════════════════════════════════════════════
    // MILKTEA — Iced
    // ════════════════════════════════════════════════════

    // Classic Milk Tea
    'V-MT001S' => [['I-TEA', 100], ['I-MLK', 80],  ['I-SYR', 20], ['I-ICE', 100]],
    'V-MT001M' => [['I-TEA', 130], ['I-MLK', 110], ['I-SYR', 25], ['I-ICE', 150]],
    'V-MT001L' => [['I-TEA', 160], ['I-MLK', 140], ['I-SYR', 30], ['I-ICE', 200]],

    // Taro Milk Tea
    'V-MT002S' => [['I-TEA', 80],  ['I-MLK', 80],  ['I-TAR', 20], ['I-SYR', 20], ['I-ICE', 100]],
    'V-MT002M' => [['I-TEA', 100], ['I-MLK', 110], ['I-TAR', 25], ['I-SYR', 25], ['I-ICE', 150]],
    'V-MT002L' => [['I-TEA', 120], ['I-MLK', 140], ['I-TAR', 30], ['I-SYR', 30], ['I-ICE', 200]],

    // Brown Sugar Milk Tea
    'V-MT003S' => [['I-TEA', 100], ['I-MLK', 80],  ['I-BSY', 30], ['I-ICE', 100]],
    'V-MT003M' => [['I-TEA', 130], ['I-MLK', 110], ['I-BSY', 40], ['I-ICE', 150]],
    'V-MT003L' => [['I-TEA', 160], ['I-MLK', 140], ['I-BSY', 50], ['I-ICE', 200]],

    // Wintermelon Milk Tea (wintermelon-flavored syrup = Simple Syrup here)
    'V-MT004S' => [['I-TEA', 100], ['I-MLK', 80],  ['I-SYR', 30], ['I-ICE', 100]],
    'V-MT004M' => [['I-TEA', 130], ['I-MLK', 110], ['I-SYR', 40], ['I-ICE', 150]],
    'V-MT004L' => [['I-TEA', 160], ['I-MLK', 140], ['I-SYR', 50], ['I-ICE', 200]],

    // Jasmine Milk Tea — more tea, less milk
    'V-MT005S' => [['I-TEA', 120], ['I-MLK', 60],  ['I-SYR', 20], ['I-ICE', 100]],
    'V-MT005M' => [['I-TEA', 160], ['I-MLK', 80],  ['I-SYR', 25], ['I-ICE', 150]],
    'V-MT005L' => [['I-TEA', 200], ['I-MLK', 100], ['I-SYR', 30], ['I-ICE', 200]],

    // Strawberry Milk Tea
    'V-MT006S' => [['I-TEA', 80],  ['I-MLK', 80],  ['I-STR', 40], ['I-SYR', 15], ['I-ICE', 100]],
    'V-MT006M' => [['I-TEA', 100], ['I-MLK', 110], ['I-STR', 55], ['I-SYR', 20], ['I-ICE', 150]],
    'V-MT006L' => [['I-TEA', 120], ['I-MLK', 140], ['I-STR', 70], ['I-SYR', 25], ['I-ICE', 200]],

    // ════════════════════════════════════════════════════
    // SODA — Iced, Fruit Soda
    // ════════════════════════════════════════════════════

    // Strawberry Soda
    'V-SD001S' => [['I-SOD', 150], ['I-STR', 50], ['I-SYR', 20], ['I-ICE', 100]],
    'V-SD001M' => [['I-SOD', 200], ['I-STR', 65], ['I-SYR', 25], ['I-ICE', 150]],
    'V-SD001L' => [['I-SOD', 250], ['I-STR', 80], ['I-SYR', 30], ['I-ICE', 200]],

    // Blueberry Soda
    'V-SD002S' => [['I-SOD', 150], ['I-BLU', 50], ['I-SYR', 20], ['I-ICE', 100]],
    'V-SD002M' => [['I-SOD', 200], ['I-BLU', 65], ['I-SYR', 25], ['I-ICE', 150]],
    'V-SD002L' => [['I-SOD', 250], ['I-BLU', 80], ['I-SYR', 30], ['I-ICE', 200]],

    // Green Apple Soda (flavored syrup = Simple Syrup)
    'V-SD003S' => [['I-SOD', 150], ['I-SYR', 40], ['I-ICE', 100]],
    'V-SD003M' => [['I-SOD', 200], ['I-SYR', 55], ['I-ICE', 150]],
    'V-SD003L' => [['I-SOD', 250], ['I-SYR', 70], ['I-ICE', 200]],

    // Lychee Soda (flavored syrup = Simple Syrup)
    'V-SD004S' => [['I-SOD', 150], ['I-SYR', 40], ['I-ICE', 100]],
    'V-SD004M' => [['I-SOD', 200], ['I-SYR', 55], ['I-ICE', 150]],
    'V-SD004L' => [['I-SOD', 250], ['I-SYR', 70], ['I-ICE', 200]],

    // Passion Fruit Soda
    'V-SD005S' => [['I-SOD', 150], ['I-SYR', 35], ['I-LEM', 20], ['I-ICE', 100]],
    'V-SD005M' => [['I-SOD', 200], ['I-SYR', 45], ['I-LEM', 25], ['I-ICE', 150]],
    'V-SD005L' => [['I-SOD', 250], ['I-SYR', 60], ['I-LEM', 30], ['I-ICE', 200]],

    // Mango Soda
    'V-SD006S' => [['I-SOD', 150], ['I-MGO', 60], ['I-SYR', 15], ['I-ICE', 100]],
    'V-SD006M' => [['I-SOD', 200], ['I-MGO', 80], ['I-SYR', 20], ['I-ICE', 150]],
    'V-SD006L' => [['I-SOD', 250], ['I-MGO', 100],['I-SYR', 25], ['I-ICE', 200]],

    // ════════════════════════════════════════════════════
    // MOCKTAILS — Iced
    // ════════════════════════════════════════════════════

    // Sunrise Mocktail — orange juice + strawberry (grenadine)
    'V-MK001S' => [['I-OJC', 100], ['I-STR', 30], ['I-SYR', 15], ['I-ICE', 100]],
    'V-MK001M' => [['I-OJC', 130], ['I-STR', 40], ['I-SYR', 20], ['I-ICE', 150]],
    'V-MK001L' => [['I-OJC', 160], ['I-STR', 50], ['I-SYR', 25], ['I-ICE', 200]],

    // Blue Lagoon — pineapple + blueberry
    'V-MK002S' => [['I-PJC', 100], ['I-BLU', 30], ['I-SYR', 20], ['I-ICE', 100]],
    'V-MK002M' => [['I-PJC', 130], ['I-BLU', 40], ['I-SYR', 25], ['I-ICE', 150]],
    'V-MK002L' => [['I-PJC', 160], ['I-BLU', 50], ['I-SYR', 30], ['I-ICE', 200]],

    // Virgin Mojito — lime + mint + soda
    'V-MK003S' => [['I-SOD', 120], ['I-LIM', 30], ['I-SYR', 20], ['I-MNT', 5],  ['I-ICE', 100]],
    'V-MK003M' => [['I-SOD', 160], ['I-LIM', 40], ['I-SYR', 25], ['I-MNT', 7],  ['I-ICE', 150]],
    'V-MK003L' => [['I-SOD', 200], ['I-LIM', 50], ['I-SYR', 30], ['I-MNT', 10], ['I-ICE', 200]],

    // Tropical Breeze — pineapple + mango + orange
    'V-MK004S' => [['I-PJC', 80],  ['I-MGO', 60], ['I-OJC', 30], ['I-ICE', 100]],
    'V-MK004M' => [['I-PJC', 100], ['I-MGO', 80], ['I-OJC', 40], ['I-ICE', 150]],
    'V-MK004L' => [['I-PJC', 120], ['I-MGO', 100],['I-OJC', 50], ['I-ICE', 200]],

    // Berry Blast — mixed berry + soda
    'V-MK005S' => [['I-MXB', 80],  ['I-SOD', 100], ['I-SYR', 20], ['I-ICE', 100]],
    'V-MK005M' => [['I-MXB', 110], ['I-SOD', 130], ['I-SYR', 25], ['I-ICE', 150]],
    'V-MK005L' => [['I-MXB', 140], ['I-SOD', 160], ['I-SYR', 30], ['I-ICE', 200]],

    // Cucumber Mint Cooler — soda + lime + mint
    'V-MK006S' => [['I-SOD', 120], ['I-LIM', 20], ['I-SYR', 20], ['I-MNT', 5],  ['I-ICE', 100]],
    'V-MK006M' => [['I-SOD', 160], ['I-LIM', 25], ['I-SYR', 25], ['I-MNT', 7],  ['I-ICE', 150]],
    'V-MK006L' => [['I-SOD', 200], ['I-LIM', 30], ['I-SYR', 30], ['I-MNT', 10], ['I-ICE', 200]],

    // ════════════════════════════════════════════════════
    // LEMONADE — Iced
    // ════════════════════════════════════════════════════

    // Classic Lemonade
    'V-LM001S' => [['I-LEM', 60],  ['I-SYR', 30], ['I-SOD', 80],  ['I-ICE', 100]],
    'V-LM001M' => [['I-LEM', 80],  ['I-SYR', 40], ['I-SOD', 110], ['I-ICE', 150]],
    'V-LM001L' => [['I-LEM', 100], ['I-SYR', 50], ['I-SOD', 140], ['I-ICE', 200]],

    // Strawberry Lemonade
    'V-LM002S' => [['I-LEM', 50],  ['I-STR', 50],  ['I-SYR', 25], ['I-ICE', 100]],
    'V-LM002M' => [['I-LEM', 65],  ['I-STR', 65],  ['I-SYR', 30], ['I-ICE', 150]],
    'V-LM002L' => [['I-LEM', 80],  ['I-STR', 80],  ['I-SYR', 40], ['I-ICE', 200]],

    // Blueberry Lemonade
    'V-LM003S' => [['I-LEM', 50],  ['I-BLU', 50],  ['I-SYR', 25], ['I-ICE', 100]],
    'V-LM003M' => [['I-LEM', 65],  ['I-BLU', 65],  ['I-SYR', 30], ['I-ICE', 150]],
    'V-LM003L' => [['I-LEM', 80],  ['I-BLU', 80],  ['I-SYR', 40], ['I-ICE', 200]],

    // Mint Lemonade
    'V-LM004S' => [['I-LEM', 60],  ['I-SYR', 30], ['I-MNT', 5],  ['I-SOD', 80],  ['I-ICE', 100]],
    'V-LM004M' => [['I-LEM', 80],  ['I-SYR', 40], ['I-MNT', 7],  ['I-SOD', 110], ['I-ICE', 150]],
    'V-LM004L' => [['I-LEM', 100], ['I-SYR', 50], ['I-MNT', 10], ['I-SOD', 140], ['I-ICE', 200]],

    // Lavender Lemonade
    'V-LM005S' => [['I-LEM', 60],  ['I-LAV', 30], ['I-SOD', 80],  ['I-ICE', 100]],
    'V-LM005M' => [['I-LEM', 80],  ['I-LAV', 40], ['I-SOD', 110], ['I-ICE', 150]],
    'V-LM005L' => [['I-LEM', 100], ['I-LAV', 50], ['I-SOD', 140], ['I-ICE', 200]],

    // Honey Lemonade
    'V-LM006S' => [['I-LEM', 60],  ['I-HON', 30], ['I-SOD', 80],  ['I-ICE', 100]],
    'V-LM006M' => [['I-LEM', 80],  ['I-HON', 40], ['I-SOD', 110], ['I-ICE', 150]],
    'V-LM006L' => [['I-LEM', 100], ['I-HON', 50], ['I-SOD', 140], ['I-ICE', 200]],

    // ════════════════════════════════════════════════════
    // SIDES — Food, Snacks (one size each)
    // ════════════════════════════════════════════════════

    'V-SI001' => [['I-BRD', 3],   ['I-CHE', 50],  ['I-CHK', 120]],  // Club Sandwich
    'V-SI002' => [['I-POT', 150], ['I-CHE', 40]],                   // Cheese Fries
    'V-SI003' => [['I-ONI', 120]],                                   // Onion Rings
    'V-SI004' => [['I-CHK', 150]],                                   // Chicken Nuggets
    'V-SI005' => [['I-NCH', 100], ['I-SLS', 50],  ['I-CHE', 30]],   // Nachos
    'V-SI006' => [['I-POT', 150]],                                   // Waffle Fries
];

// ── Insert ────────────────────────────────────────────────────────────────────

try {
    $pdo->beginTransaction();

    echo "\n── Ingredients ──\n";
    foreach ($ingredients as [$id, $name, $qty, $unit, $threshold]) {
        insertIngredient($pdo, $id, $name, $qty, $unit, $threshold);
    }

    echo "\n── Recipes ──\n";
    $recipeCount = 0;
    foreach ($recipes as $variantId => $ingList) {
        foreach ($ingList as [$ingId, $qty]) {
            insertRecipe($pdo, $variantId, $ingId, (float)$qty);
            $recipeCount++;
        }
        echo "  OK    $variantId (" . count($ingList) . " ingredient" . (count($ingList) > 1 ? 's' : '') . ")\n";
    }

    $pdo->commit();

    $variantCount = count($recipes);
    $ingCount     = count($ingredients);
    echo "\nDone! $ingCount ingredients and $recipeCount recipe entries across $variantCount variants seeded.\n";
    echo "Delete seed_ingredients.php when finished testing.\n";

} catch (Throwable $e) {
    $pdo->rollBack();
    echo "\nError: " . $e->getMessage() . "\n";
}
