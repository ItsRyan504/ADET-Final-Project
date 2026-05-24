<?php
/**
 * token.php — Admin token helpers
 *
 * Auto-creates the admin_tokens table on first use.
 * Include this file in any endpoint that needs admin protection.
 */

/* ── Ensure the tokens table exists ── */
function ensureTokenTable(): void {
    $pdo = getDB();
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_tokens (
            TokenID   INT          AUTO_INCREMENT PRIMARY KEY,
            StaffID   VARCHAR(12)  NOT NULL,
            Token     VARCHAR(64)  NOT NULL UNIQUE,
            CreatedAt DATETIME     NOT NULL DEFAULT NOW(),
            ExpiresAt DATETIME     NOT NULL,
            FOREIGN KEY (StaffID) REFERENCES staff(StaffID) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

/* ── Issue a new token for a staff member (8-hour expiry) ── */
function issueAdminToken(string $staffId): string {
    ensureTokenTable();
    $pdo   = getDB();
    $token = bin2hex(random_bytes(32)); // 64-char hex token

    // Remove any old tokens for this staff member
    $pdo->prepare("DELETE FROM admin_tokens WHERE StaffID = ?")
        ->execute([$staffId]);

    $pdo->prepare(
        "INSERT INTO admin_tokens (StaffID, Token, ExpiresAt)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))"
    )->execute([$staffId, $token]);

    return $token;
}

/* ── Validate the Bearer token from the Authorization header ── */
function requireAdminAuth(): array {
    ensureTokenTable();

    // Apache may strip the header — check multiple sources
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';

    // Final fallback: getallheaders() (works on some Apache configs)
    if (!$header && function_exists('getallheaders')) {
        $all = getallheaders();
        $header = $all['Authorization'] ?? $all['authorization'] ?? '';
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        jsonOut(['error' => 'Unauthorized — admin token required.'], 401);
    }

    $token = trim($m[1]);
    $pdo   = getDB();

    $stmt = $pdo->prepare(
        "SELECT at.StaffID, s.S_FirstName, s.S_LastName, s.Role
           FROM admin_tokens at
           JOIN staff s ON s.StaffID = at.StaffID
          WHERE at.Token = ?
            AND at.ExpiresAt > NOW()
          LIMIT 1"
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonOut(['error' => 'Unauthorized — invalid or expired token.'], 401);
    }

    return $row;
}

/* ── Invalidate a token (logout) ── */
function revokeAdminToken(string $token): void {
    ensureTokenTable();
    getDB()->prepare("DELETE FROM admin_tokens WHERE Token = ?")
           ->execute([$token]);
}
