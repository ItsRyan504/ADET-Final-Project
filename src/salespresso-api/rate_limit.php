<?php
/**
 * Simple DB-backed rate limiter.
 * Usage: checkRateLimit('action_name', 10, 300)
 *   → max 10 hits per 5-minute window per IP.
 * Responds with HTTP 429 and exits if the limit is exceeded.
 */
require_once __DIR__ . '/db.php';

function clientIp(): string {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? 'unknown';
    return trim(explode(',', $ip)[0]);
}

function checkRateLimit(string $action, int $maxRequests = 10, int $windowSeconds = 300): void {
    $ip = clientIp();

    // Exempt localhost so automated tests and local dev are never rate-limited
    if (in_array($ip, ['127.0.0.1', '::1', 'localhost'], true)) return;

    $pdo = getDB();

    // Ensure the table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS rate_limits (
            id     INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(50) NOT NULL,
            ip     VARCHAR(45) NOT NULL,
            hit_at DATETIME    NOT NULL DEFAULT NOW(),
            INDEX idx_action_ip_hit (action, ip, hit_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Purge expired entries to keep the table small
    $pdo->prepare("
        DELETE FROM rate_limits
        WHERE hit_at < DATE_SUB(NOW(), INTERVAL ? SECOND)
    ")->execute([$windowSeconds]);

    // Count hits in the current window
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM rate_limits
        WHERE action = ? AND ip = ?
          AND hit_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    $stmt->execute([$action, $ip, $windowSeconds]);
    $count = (int) $stmt->fetchColumn();

    if ($count >= $maxRequests) {
        $minutes = (int) ceil($windowSeconds / 60);
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        header("Retry-After: $windowSeconds");
        echo json_encode([
            'error'      => "Too many requests. Please wait $minutes minute(s) before trying again.",
            'retryAfter' => $windowSeconds,
        ]);
        exit;
    }

    // Log this hit
    $pdo->prepare("
        INSERT INTO rate_limits (action, ip, hit_at) VALUES (?, ?, NOW())
    ")->execute([$action, $ip]);
}
