<?php
/**
 * Run this ONCE in your browser: http://localhost/salespresso-api/seed.php
 * Creates the default Admin account so you can log in.
 *
 * Default credentials:
 *   Email   : admin@jazsam.com
 *   Password: admin123
 *
 * DELETE this file after first login for security.
 */
require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = getDB();

    // Check if admin already exists
    $check = $pdo->prepare("SELECT COUNT(*) FROM staff WHERE S_Email = ?");
    $check->execute(['admin@jazsam.com']);
    if ((int)$check->fetchColumn() > 0) {
        echo "Admin account already exists. Nothing was changed.\n";
        echo "Email: admin@jazsam.com | Password: (unchanged)\n";
        exit;
    }

    $id       = 'ADMIN000001';
    $password = password_hash('admin123', PASSWORD_DEFAULT);

    $pdo->prepare(
        "INSERT INTO staff (StaffID, S_FirstName, S_LastName, Role, S_PhoneNumber, S_Username, S_Password, S_Email)
         VALUES (?, 'Admin', 'Jazsam', 'Admin', 0, 'admin.jazsam', ?, 'admin@jazsam.com')"
    )->execute([$id, $password]);

    echo "✅ Admin account created successfully!\n\n";
    echo "Email    : admin@jazsam.com\n";
    echo "Password : admin123\n\n";
    echo "⚠️  Please delete seed.php after logging in.\n";
} catch (Throwable $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
