<?php
/**
 * Verifies a PayMongo checkout session and marks the order as Paid.
 * Called by the frontend when the user lands on /payment-success.
 * No webhook / ngrok needed — we ask PayMongo directly.
 */
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/paymongo-config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Method not allowed', 405);
}

$orderId = ltrim(trim($_GET['order'] ?? ''), '#');
if (!$orderId) jsonError('order is required.', 400);

$pdo = getDB();

// Get the PayMongo session ID we stored when creating the checkout
$stmt = $pdo->prepare(
    "SELECT p.TransactionReference, p.PaymentStatus
       FROM payment p
      WHERE p.OrderID = ?
      LIMIT 1"
);
$stmt->execute([$orderId]);
$row = $stmt->fetch();

if (!$row) jsonError('Order not found.', 404);

// Already marked paid (e.g. user refreshed the page)
if ($row['PaymentStatus'] === 'Paid') {
    jsonOut(['paid' => true, 'alreadyConfirmed' => true]);
}

$sessionId = $row['TransactionReference'] ?? '';
if (!$sessionId) jsonError('No payment session found for this order.', 404);

// Ask PayMongo for the session status
$ch = curl_init('https://api.paymongo.com/v1/checkout_sessions/' . urlencode($sessionId));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':'),
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) jsonError('Could not reach PayMongo: ' . $curlErr, 502);

$data = json_decode($response, true);

if ($httpCode !== 200 || !isset($data['data']['attributes'])) {
    jsonError('Could not fetch session from PayMongo.', 502);
}

$attrs         = $data['data']['attributes'];
$paymentStatus = $attrs['payment_intent']['attributes']['status'] ?? $attrs['status'] ?? '';
$isPaid        = $paymentStatus === 'paid' || $attrs['payment_intent']['attributes']['status'] === 'succeeded';

// Also check via payments array as fallback
if (!$isPaid && !empty($attrs['payments'])) {
    foreach ($attrs['payments'] as $p) {
        if (($p['attributes']['status'] ?? '') === 'paid') {
            $isPaid = true;
            break;
        }
    }
}

if ($isPaid) {
    // Get PayMongo payment ID for the transaction reference
    $pmPaymentId = $attrs['payments'][0]['id'] ?? null;

    try {
        $pdo->prepare("
            UPDATE payment
               SET PaymentStatus        = 'Paid',
                   PaidAt               = NOW(),
                   TransactionReference = COALESCE(?, TransactionReference)
             WHERE OrderID = ?
        ")->execute([$pmPaymentId ?? $sessionId, $orderId]);

        // Promote order from 'Awaiting Payment' to 'Pending' so admin can see it
        $pdo->prepare("
            UPDATE orders
               SET OrderStatus = 'Pending'
             WHERE OrderID = ? AND OrderStatus = 'Awaiting Payment'
        ")->execute([$orderId]);
    } catch (Throwable $e) {
        jsonError('Failed to update payment: ' . $e->getMessage(), 500);
    }
}

jsonOut(['paid' => $isPaid]);
