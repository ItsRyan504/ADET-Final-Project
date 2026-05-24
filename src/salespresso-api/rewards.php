<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';

$method = $_SERVER['REQUEST_METHOD'];

/* ─── Type-resolution helpers ─── */

/**
 * Returns DB-compatible RewardType ('Free Item','Percentage','Fixed Amount')
 * from either rawType (already DB format) or type (admin dashboard display format).
 */
function resolveRawType(array $data): string {
    // DB format takes priority
    if (!empty($data['rawType'])) {
        $t = trim($data['rawType']);
        $valid = ['Free Item', 'Percentage', 'Fixed Amount'];
        return in_array($t, $valid) ? $t : 'Free Item';
    }

    // Admin dashboard formats: 'Discount (%)', 'Discount (₱)', 'Free Item', 'Birthday reward'
    $type = trim($data['type'] ?? '');
    if (str_contains($type, '%') || str_contains($type, 'Percentage')) return 'Percentage';
    if (str_contains($type, '₱') || str_contains($type, 'Fixed'))       return 'Fixed Amount';
    return 'Free Item';
}

/**
 * Returns numeric reward value from either rawValue (numeric) or value (display string).
 */
function resolveRawValue(array $data): float {
    if (isset($data['rawValue']) && is_numeric($data['rawValue'])) {
        return (float)$data['rawValue'];
    }
    if (isset($data['value'])) {
        // Strip everything except digits and dot
        return (float)preg_replace('/[^0-9.]/', '', (string)$data['value']);
    }
    if (isset($data['discountAmt']) && is_numeric($data['discountAmt'])) {
        return (float)$data['discountAmt'];
    }
    return 0.0;
}

match ($method) {
    'GET'    => handleGet(),
    'POST'   => handlePost(),
    'PUT'    => handlePut(),
    'DELETE' => handleDelete(),
    default  => jsonError('Method not allowed', 405),
};

function rowToFrontend(array $r): array {
    $rawType  = $r['RewardType'];
    $rawValue = (float)$r['RewardValue'];
    $stamps   = (int)$r['StampsRequired'];

    $type = match ($rawType) {
        'Fixed Amount' => 'Discount – Fixed Amount',
        'Percentage'   => 'Discount – Percentage',
        default        => 'Free Item',
    };

    $value = match ($rawType) {
        'Fixed Amount' => '₱' . number_format($rawValue, 2) . ' Off',
        'Percentage'   => $rawValue . '% Off',
        default        => 'Free Item',
    };

    return [
        'id'       => $r['RewardID'],
        'name'     => $r['RewardName'],
        'type'     => $type,
        'value'    => $value,
        'stamps'   => $stamps,
        'rawType'  => $rawType,
        'rawValue' => $rawValue,
    ];
}

/* ─── GET ─── */
function handleGet(): never {
    $pdo  = getDB();
    $rows = $pdo->query(
        "SELECT RewardID, RewardName, RewardType, RewardValue, StampsRequired
           FROM stamp_reward
          ORDER BY StampsRequired ASC"
    )->fetchAll();

    jsonOut(array_map('rowToFrontend', $rows));
}

/* ─── POST ─── */
function handlePost(): never {
    requireAdminAuth();
    $pdo  = getDB();
    $data = bodyJson();

    $id     = trim($data['id'] ?? '') ?: genId('R');
    $name   = trim($data['name'] ?? '');
    $stamps = (int)($data['stamps'] ?? 10);

    if (!$name) jsonError('Reward name is required.');

    // Accept both rawType (DB format) and type (admin dashboard format)
    $rawType = resolveRawType($data);

    // Accept both rawValue (numeric) and value (display string)
    $rawValue = resolveRawValue($data);

    try {
        $pdo->prepare(
            "INSERT INTO stamp_reward (RewardID, RewardName, RewardType, RewardValue, StampsRequired)
             VALUES (?, ?, ?, ?, ?)"
        )->execute([$id, $name, $rawType, $rawValue, $stamps]);

        jsonOut(['id' => $id], 201);
    } catch (Throwable $e) {
        jsonError('Failed to add reward: ' . $e->getMessage(), 500);
    }
}

/* ─── PUT ─── */
function handlePut(): never {
    requireAdminAuth();
    $pdo  = getDB();
    $data = bodyJson();

    $id       = trim($data['id'] ?? '');
    $name     = trim($data['name'] ?? '');
    $stamps   = isset($data['stamps']) ? (int)$data['stamps'] : null;

    if (!$id) jsonError('Reward ID is required.');

    // Accept both rawType (DB format) and type (admin dashboard format)
    $rawType  = (isset($data['rawType']) || isset($data['type'])) ? resolveRawType($data) : null;
    $rawValue = (isset($data['rawValue']) || isset($data['value'])) ? resolveRawValue($data) : null;

    try {
        $sets   = [];
        $params = [];

        if ($name)              { $sets[] = 'RewardName = ?';       $params[] = $name; }
        if ($rawType)           { $sets[] = 'RewardType = ?';       $params[] = $rawType; }
        if ($rawValue !== null) { $sets[] = 'RewardValue = ?';      $params[] = $rawValue; }
        if ($stamps !== null)   { $sets[] = 'StampsRequired = ?';   $params[] = $stamps; }

        if (empty($sets)) jsonError('Nothing to update.');

        $params[] = $id;
        $pdo->prepare(
            "UPDATE stamp_reward SET " . implode(', ', $sets) . " WHERE RewardID = ?"
        )->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM stamp_reward WHERE RewardID = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Reward not found.', 404);

        jsonOut(rowToFrontend($row));
    } catch (Throwable $e) {
        jsonError('Failed to update reward: ' . $e->getMessage(), 500);
    }
}

/* ─── DELETE ─── */
function handleDelete(): never {
    requireAdminAuth();
    $pdo = getDB();
    $id  = trim($_GET['id'] ?? '');

    if (!$id) jsonError('Reward ID is required.');

    try {
        $stmt = $pdo->prepare("DELETE FROM stamp_reward WHERE RewardID = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError('Reward not found.', 404);
        jsonOut(['deleted' => $id]);
    } catch (Throwable $e) {
        jsonError('Failed to delete reward: ' . $e->getMessage(), 500);
    }
}

