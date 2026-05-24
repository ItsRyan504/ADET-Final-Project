<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/rate_limit.php';

/* Ensure ProfilePicture column exists (safe to run on every request) */
function ensureProfilePictureColumn(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        getDB()->exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS ProfilePicture MEDIUMTEXT DEFAULT NULL");
    } catch (Throwable) {}
}

/* Ensure ActiveRewardID column exists */
function ensureActiveRewardColumn(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        getDB()->exec("ALTER TABLE customer ADD COLUMN IF NOT EXISTS ActiveRewardID VARCHAR(12) DEFAULT NULL");
    } catch (Throwable) {}
}

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'    => handleGet(),
    'POST'   => handlePost(),
    'PUT'    => handlePut(),
    default  => jsonError('Method not allowed', 405),
};

/* ─── GET: single customer or all registered customers ────── */
function handleGet(): never {
    ensureProfilePictureColumn();
    ensureActiveRewardColumn();
    $pdo = getDB();
    $id  = trim($_GET['id'] ?? '');

    if ($id) {
        $stmt = $pdo->prepare(
            "SELECT CustomerID, C_FirstName, C_LastName, C_Email, C_PhoneNumber,
                    LoyaltyPoints, Tier, IsRegistered, ProfilePicture, ActiveRewardID
               FROM customer WHERE CustomerID = ? LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Customer not found.', 404);
        jsonOut(mapCustomer($row));
    }

    // Return all registered customers (for admin)
    $rows = $pdo->query(
        "SELECT CustomerID, C_FirstName, C_LastName, C_Email, C_PhoneNumber,
                LoyaltyPoints, Tier, IsRegistered, ProfilePicture, ActiveRewardID
           FROM customer
          WHERE IsRegistered = 'Y'
          ORDER BY C_FirstName ASC"
    )->fetchAll();

    jsonOut(array_map('mapCustomer', $rows));
}

/* ─── POST: register or login ────────────────────────────── */
function handlePost(): never {
    $body   = bodyJson();
    $action = $body['action'] ?? 'register';

    if ($action === 'login') {
        handleLogin($body);
    } else {
        handleRegister($body);
    }
}

function handleRegister(array $body): never {
    checkRateLimit('register:' . clientIp(), 5, 3600); // 5 registrations per hour per IP
    $pdo       = getDB();
    $firstName = trim($body['firstName'] ?? '');
    $lastName  = trim($body['lastName']  ?? '');
    $email     = strtolower(trim($body['email']    ?? ''));
    $phone     = trim($body['phone']     ?? '');
    $password  = $body['password']       ?? '';

    if (!$firstName || !$lastName || !$email || !$password) {
        jsonError('First name, last name, email, and password are required.');
    }

    // Check duplicate email
    $check = $pdo->prepare("SELECT COUNT(*) FROM customer WHERE LOWER(C_Email) = ?");
    $check->execute([$email]);
    if ((int)$check->fetchColumn() > 0) {
        jsonOut(['success' => false, 'error' => 'An account with this email already exists.']);
    }

    $id   = genId('C');
    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $pdo->prepare(
            "INSERT INTO customer
               (CustomerID, IsRegistered, C_Username, C_Password,
                C_FirstName, C_LastName, C_PhoneNumber, C_Email, LoyaltyPoints, Tier)
             VALUES (?, 'Y', ?, ?, ?, ?, ?, ?, 0, 'Bronze')"
        )->execute([$id, $email, $hash, $firstName, $lastName, $phone, $email]);
    } catch (Throwable $e) {
        jsonError('Registration failed: ' . $e->getMessage(), 500);
    }

    jsonOut([
        'success' => true,
        'user'    => [
            'id'        => $id,
            'name'      => "$firstName $lastName",
            'firstName' => $firstName,
            'lastName'  => $lastName,
            'email'     => $email,
            'phone'     => $phone,
            'points'    => 0,
            'tier'      => 'Bronze',
        ],
    ], 201);
}

function handleLogin(array $body): never {
    ensureProfilePictureColumn();
    ensureActiveRewardColumn();
    checkRateLimit('login:' . clientIp(), 10, 300); // 10 attempts per 5 minutes per IP
    $pdo      = getDB();
    $email    = strtolower(trim($body['email']    ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        jsonError('Email and password are required.');
    }

    $stmt = $pdo->prepare(
        "SELECT CustomerID, C_FirstName, C_LastName, C_Email, C_PhoneNumber,
                C_Password, LoyaltyPoints, Tier, ProfilePicture, ActiveRewardID
           FROM customer
          WHERE LOWER(C_Email) = ? AND IsRegistered = 'Y'
          LIMIT 1"
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonOut(['success' => false, 'error' => 'No account found with this email.']);
    }

    if (!password_verify($password, $row['C_Password'])) {
        jsonOut(['success' => false, 'error' => 'Incorrect password. Please try again.']);
    }

    jsonOut([
        'success' => true,
        'user'    => mapCustomer($row),
    ]);
}

/* ─── PUT: update profile or points ─────────────────────── */
function handlePut(): never {
    ensureProfilePictureColumn();
    ensureActiveRewardColumn();
    require_once __DIR__ . '/token.php';

    $pdo  = getDB();
    $body = bodyJson();
    $id   = trim($body['id'] ?? '');

    if (!$id) jsonError('Customer ID is required.');

    // Check if request carries a valid admin token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
               ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
               ?? '';
    if (!$authHeader && function_exists('getallheaders')) {
        $all = getallheaders();
        $authHeader = $all['Authorization'] ?? $all['authorization'] ?? '';
    }
    $isAdmin = false;
    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
        try { requireAdminAuth(); $isAdmin = true; } catch (Throwable) {}
    }

    $sets   = [];
    $params = [];

    if (isset($body['firstName'])) {
        $sets[]   = 'C_FirstName = ?';
        $params[] = trim($body['firstName']);
    }
    if (isset($body['lastName'])) {
        $sets[]   = 'C_LastName = ?';
        $params[] = trim($body['lastName']);
    }
    if (isset($body['phone'])) {
        $sets[]   = 'C_PhoneNumber = ?';
        $params[] = trim($body['phone']);
    }
    // Only admins may directly set loyalty points or tier
    if (isset($body['points']) && $isAdmin) {
        $sets[]   = 'LoyaltyPoints = ?';
        $params[] = max(0, (int)$body['points']);
    }
    if (isset($body['tier']) && $isAdmin) {
        $allowed  = ['Bronze', 'Silver', 'Gold'];
        $tier     = in_array($body['tier'], $allowed) ? $body['tier'] : 'Bronze';
        $sets[]   = 'Tier = ?';
        $params[] = $tier;
    }
    // Points earned from orders (non-admin path)
    if (isset($body['addPoints']) && !$isAdmin) {
        $pts = max(0, (int)$body['addPoints']);
        $sets[]   = 'LoyaltyPoints = LoyaltyPoints + ?';
        $params[] = $pts;
    }
    // Points spent when redeeming a reward
    if (isset($body['redeemPoints']) && !$isAdmin) {
        $pts = max(0, (int)$body['redeemPoints']);
        $sets[]   = 'LoyaltyPoints = GREATEST(0, LoyaltyPoints - ?)';
        $params[] = $pts;
    }
    if (isset($body['profilePicture'])) {
        $sets[]   = 'ProfilePicture = ?';
        $params[] = $body['profilePicture'];
    }
    // Customer sets or clears their active voucher
    if (array_key_exists('activeRewardId', $body) && !$isAdmin) {
        $sets[]   = 'ActiveRewardID = ?';
        $params[] = trim($body['activeRewardId']) ?: null;
    }
    if (isset($body['password'])) {
        $sets[]   = 'C_Password = ?';
        $params[] = password_hash($body['password'], PASSWORD_DEFAULT);
    }

    if (empty($sets)) jsonError('Nothing to update.');

    $params[] = $id;
    $pdo->prepare("UPDATE customer SET " . implode(', ', $sets) . " WHERE CustomerID = ?")
        ->execute($params);

    // Re-fetch and return updated profile
    $stmt = $pdo->prepare(
        "SELECT CustomerID, C_FirstName, C_LastName, C_Email, C_PhoneNumber,
                LoyaltyPoints, Tier, ProfilePicture, ActiveRewardID
           FROM customer WHERE CustomerID = ? LIMIT 1"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    jsonOut(['success' => true, 'user' => mapCustomer($row)]);
}

/* ─── Helper ─────────────────────────────────────────────── */
function mapCustomer(array $row): array {
    return [
        'id'             => $row['CustomerID'],
        'name'           => trim(($row['C_FirstName'] ?? '') . ' ' . ($row['C_LastName'] ?? '')),
        'firstName'      => $row['C_FirstName'] ?? '',
        'lastName'       => $row['C_LastName']  ?? '',
        'email'          => $row['C_Email']      ?? '',
        'phone'          => $row['C_PhoneNumber'] ?? '',
        'points'         => (int)($row['LoyaltyPoints'] ?? 0),
        'tier'           => $row['Tier'] ?? 'Bronze',
        'profilePicture' => $row['ProfilePicture'] ?? null,
        'activeRewardId' => $row['ActiveRewardID'] ?? null,
    ];
}
