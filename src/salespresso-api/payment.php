<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';
require_once __DIR__ . '/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'PUT'   => handlePut(),
    default => jsonError('Method not allowed', 405),
};

/* ─── PUT: mark payment as paid (admin only) ─────────────── */
function handlePut(): never {
    $staff  = requireAdminAuth();
    $pdo    = getDB();
    $body   = bodyJson();
    $orderId = trim($body['orderId'] ?? '');

    if (!$orderId) jsonError('orderId is required.', 400);

    $dbId = ltrim($orderId, '#');

    try {
        $stmt = $pdo->prepare(
            "UPDATE payment
                SET PaymentStatus = 'Paid', PaidAt = NOW()
              WHERE OrderID = ?"
        );
        $stmt->execute([$dbId]);

        if ($stmt->rowCount() === 0) {
            jsonError('Payment record not found for order: ' . $dbId, 404);
        }
    } catch (Throwable $e) {
        jsonError('Failed to update payment: ' . $e->getMessage(), 500);
    }

    $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
    logAudit('Payment Collected', '#' . $dbId, 'PaymentStatus → Paid', $staff['StaffID'], $staffName);

    jsonOut(['success' => true, 'orderId' => $orderId, 'paymentStatus' => 'Paid']);
}
