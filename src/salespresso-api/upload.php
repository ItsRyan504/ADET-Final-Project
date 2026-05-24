<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    jsonError('Method not allowed', 405);
}

handleUpload();

function detectMime(string $tmpPath, string $originalName): string {
    // Layer 1: finfo (guarded — finfo_open can return false on some XAMPP installs)
    try {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $tmpPath);
                finfo_close($finfo);
                if (is_string($mime) && $mime !== '' && $mime !== 'application/octet-stream') {
                    return $mime;
                }
            }
        }
    } catch (Throwable) {}

    // Layer 2: magic bytes — works on every platform without extensions
    try {
        $fp = fopen($tmpPath, 'rb');
        if ($fp !== false) {
            $bytes = (string) fread($fp, 12);
            fclose($fp);
            if (strlen($bytes) >= 12
                && substr($bytes, 0, 4) === 'RIFF'
                && substr($bytes, 8, 4) === 'WEBP') {
                return 'image/webp';
            }
            if (substr($bytes, 0, 2) === "\xFF\xD8") return 'image/jpeg';
            if (substr($bytes, 0, 4) === "\x89PNG")  return 'image/png';
            if (substr($bytes, 0, 3) === 'GIF')      return 'image/gif';
        }
    } catch (Throwable) {}

    // Layer 3: file extension as last resort
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    return match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png'         => 'image/png',
        'gif'         => 'image/gif',
        'webp'        => 'image/webp',
        default       => 'application/octet-stream',
    };
}

function handleUpload(): never {
    requireAdminAuth();

    if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        jsonError('No valid image file provided.');
    }

    $file = $_FILES['image'];
    $mime = detectMime($file['tmp_name'], $file['name']);

    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mime, $allowed, true)) {
        jsonError('Only JPEG, PNG, GIF, or WebP images are allowed.');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        jsonError('Image must be under 5 MB.');
    }

    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    $uploadsDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $dest     = $uploadsDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        jsonError('Failed to save image on server.', 500);
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $url      = $protocol . '://' . $host . '/salespresso-api/uploads/' . $filename;

    jsonOut(['url' => $url]);
}
