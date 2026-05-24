<?php
// Prevent PHP warnings/notices from corrupting JSON output
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Convert PHP errors into exceptions so they are caught by the handler below
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    if (error_reporting() & $errno) {
        throw new \ErrorException($errstr, $errno, $errno, $errfile, $errline);
    }
    return false;
});

// Return a JSON error instead of an HTML crash page for any uncaught exception
set_exception_handler(function (\Throwable $e): void {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

function jsonOut(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $msg, int $code = 400): never {
    jsonOut(['error' => $msg], $code);
}

function bodyJson(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw ?: '{}', true) ?? [];
}
