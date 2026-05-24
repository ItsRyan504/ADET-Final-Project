<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/rate_limit.php';
require_once __DIR__ . '/token.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'POST'   => handleLogin(),
    'PUT'    => handleUpdateProfile(),
    'DELETE' => handleLogout(),
    default  => jsonError('Method not allowed', 405),
};

function ensureStaffProfileColumn(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        getDB()->exec("ALTER TABLE staff ADD COLUMN IF NOT EXISTS ProfilePicture MEDIUMTEXT DEFAULT NULL");
    } catch (Throwable) {}
}

/* ─── POST: admin login — returns a signed token ──────────── */
function handleLogin(): never {
    checkRateLimit('admin_login:' . clientIp(), 5, 300);
    ensureStaffProfileColumn();

    $body     = bodyJson();
    $email    = trim(strtolower($body['email']    ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        jsonError('Email and password are required.');
    }

    try {
        $pdo  = getDB();
        // Ensure Status column exists before querying it
        try { $pdo->exec("ALTER TABLE staff ADD COLUMN IF NOT EXISTS Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'"); } catch (Throwable) {}

        $stmt = $pdo->prepare(
            "SELECT StaffID, S_FirstName, S_LastName, S_Email, S_Password, Role, Status, ProfilePicture
               FROM staff
              WHERE LOWER(S_Email) = ?
              LIMIT 1"
        );
        $stmt->execute([$email]);
        $staff = $stmt->fetch();

        if (!$staff || !password_verify($password, $staff['S_Password'])) {
            jsonOut(['success' => false, 'error' => 'Invalid credentials. Please try again.']);
        }

        if (($staff['Status'] ?? 'Active') === 'Inactive') {
            jsonOut(['success' => false, 'error' => 'This account has been deactivated. Contact your administrator.']);
        }

        $token = issueAdminToken($staff['StaffID']);

        jsonOut([
            'success'        => true,
            'token'          => $token,
            'id'             => $staff['StaffID'],
            'name'           => $staff['S_FirstName'] . ' ' . $staff['S_LastName'],
            'email'          => $staff['S_Email'],
            'role'           => $staff['Role'],
            'profilePicture' => $staff['ProfilePicture'] ?? null,
        ]);
    } catch (Throwable $e) {
        jsonError('Login failed. Please try again.', 500);
    }
}

/* ─── PUT: update admin profile picture ───────────────────── */
function handleUpdateProfile(): never {
    try {
        ensureStaffProfileColumn();
        $staff = requireAdminAuth();
        $body  = bodyJson();

        if (!isset($body['profilePicture'])) jsonError('Nothing to update.');

        $pdo = getDB();
        $pdo->prepare("UPDATE staff SET ProfilePicture = ? WHERE StaffID = ?")
            ->execute([$body['profilePicture'], $staff['StaffID']]);

        $row = $pdo->prepare("SELECT ProfilePicture FROM staff WHERE StaffID = ? LIMIT 1");
        $row->execute([$staff['StaffID']]);
        $updated = $row->fetch();

        jsonOut(['success' => true, 'profilePicture' => $updated['ProfilePicture'] ?? null]);
    } catch (Throwable $e) {
        jsonError('Failed to save profile picture: ' . $e->getMessage(), 500);
    }
}

/* ─── DELETE: admin logout — invalidates the token ────────── */
function handleLogout(): never {
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';
    if (!$header && function_exists('getallheaders')) {
        $all = getallheaders();
        $header = $all['Authorization'] ?? $all['authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        revokeAdminToken(trim($m[1]));
    }
    jsonOut(['success' => true]);
}
