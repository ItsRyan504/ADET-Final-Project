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

function computeStatus(float $qty, float $threshold): string {
    if ($qty <= 0)          return 'Out of Stock';
    if ($qty <= $threshold) return 'Low Stock';
    return 'In Stock';
}

function rowToFrontend(array $r): array {
    $qty       = (float)$r['StockQuantity'];
    $threshold = (float)$r['LowStockThreshold'];
    return [
        'id'        => $r['IngredientID'],
        'name'      => $r['IngredientName'],
        'qty'       => $qty,
        'unit'      => $r['Unit'],
        'threshold' => $threshold,
        'status'    => computeStatus($qty, $threshold),
    ];
}

/* ─── GET ─── */
function handleGet(): never {
    $pdo  = getDB();
    $rows = $pdo->query(
        "SELECT IngredientID, IngredientName, StockQuantity, Unit, LowStockThreshold
           FROM ingredients
          ORDER BY IngredientName ASC"
    )->fetchAll();

    jsonOut(array_map('rowToFrontend', $rows));
}

/* ─── POST ─── */
function handlePost(): never {
    requireAdminAuth();
    $pdo  = getDB();
    $data = bodyJson();

    $id        = trim($data['id'] ?? '') ?: genId('I');
    $name      = trim($data['name'] ?? '');
    $qty       = (float)($data['qty'] ?? 0);
    $unit      = trim($data['unit'] ?? 'g');
    $threshold = (float)($data['threshold'] ?? 0);

    if (!$name) jsonError('Ingredient name is required.');

    try {
        $pdo->prepare(
            "INSERT INTO ingredients (IngredientID, IngredientName, StockQuantity, Unit, LowStockThreshold)
             VALUES (?, ?, ?, ?, ?)"
        )->execute([$id, $name, $qty, $unit, $threshold]);

        jsonOut(['id' => $id], 201);
    } catch (Throwable $e) {
        jsonError('Failed to add ingredient: ' . $e->getMessage(), 500);
    }
}

/* ─── PUT ─── */
function handlePut(): never {
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $data = bodyJson();

    $id        = trim($data['id'] ?? '');
    $name      = trim($data['name'] ?? '');
    $qty       = isset($data['qty']) ? (float)$data['qty'] : null;
    $unit      = trim($data['unit'] ?? '');
    $threshold = isset($data['threshold']) ? (float)$data['threshold'] : null;

    if (!$id) jsonError('Ingredient ID is required.');

    try {
        // Build partial update — only set fields that were sent
        $sets   = [];
        $params = [];

        if ($name)              { $sets[] = 'IngredientName = ?';     $params[] = $name; }
        if ($qty !== null)      { $sets[] = 'StockQuantity = ?';      $params[] = $qty; }
        if ($unit)              { $sets[] = 'Unit = ?';               $params[] = $unit; }
        if ($threshold !== null){ $sets[] = 'LowStockThreshold = ?';  $params[] = $threshold; }

        if (empty($sets)) jsonError('Nothing to update.');

        $params[] = $id;
        $pdo->prepare(
            "UPDATE ingredients SET " . implode(', ', $sets) . " WHERE IngredientID = ?"
        )->execute($params);

        // Return updated row
        $stmt = $pdo->prepare("SELECT * FROM ingredients WHERE IngredientID = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Ingredient not found.', 404);

        $staffName   = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        $targetName  = $row['IngredientName'];
        $action      = ($qty !== null && empty(array_filter($sets, fn($s) => !str_contains($s, 'StockQuantity'))))
                         ? 'Inventory Restocked' : 'Inventory Updated';
        logAudit($action, $targetName, "ID: $id" . ($qty !== null ? " | Qty: $qty {$row['Unit']}" : ''), $staff['StaffID'], $staffName);

        jsonOut(rowToFrontend($row));
    } catch (Throwable $e) {
        jsonError('Failed to update ingredient: ' . $e->getMessage(), 500);
    }
}

/* ─── DELETE ─── */
function handleDelete(): never {
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $id    = trim($_GET['id'] ?? '');

    if (!$id) jsonError('Ingredient ID is required.');

    try {
        $nameRow = $pdo->prepare("SELECT IngredientName FROM ingredients WHERE IngredientID = ?");
        $nameRow->execute([$id]);
        $ingName = $nameRow->fetchColumn() ?: $id;

        $stmt = $pdo->prepare("DELETE FROM ingredients WHERE IngredientID = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError('Ingredient not found.', 404);

        $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        logAudit('Inventory Item Deleted', (string)$ingName, "ID: $id", $staff['StaffID'], $staffName);
        jsonOut(['deleted' => $id]);
    } catch (Throwable $e) {
        jsonError('Failed to delete ingredient: ' . $e->getMessage(), 500);
    }
}

