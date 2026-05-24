<?php
/**
 * PayMongo Webhook Handler
 *
 * Register this URL with PayMongo:
 *   POST https://api.paymongo.com/v1/webhooks
 *   { "data": { "attributes": {
 *       "url": "https://<your-ngrok-url>/salespresso-api/paymongo-webhook.php",
 *       "events": ["checkout_session.payment.paid"]
 *   }}}
 *
 * Then copy the returned "secret" into paymongo-config.php → PAYMONGO_WEBHOOK_SECRET
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/paymongo-config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawBody  = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_PAYMONGO_SIGNATURE'] ?? '';

// Verify webhook signature when secret is configured
if (PAYMONGO_WEBHOOK_SECRET !== '' && $sigHeader !== '') {
    $parts = [];
    foreach (explode(',', $sigHeader) as $part) {
        [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
        $parts[trim($k)] = trim($v);
    }

    $timestamp = $parts['t']  ?? '';
    $teHash    = $parts['te'] ?? '';
    $expected  = hash_hmac('sha256', $timestamp . '.' . $rawBody, PAYMONGO_WEBHOOK_SECRET);

    if (!hash_equals($expected, $teHash)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid webhook signature']);
        exit;
    }
}

$event = json_decode($rawBody, true);
$type  = $event['data']['attributes']['type'] ?? '';

if ($type === 'checkout_session.payment.paid') {
    $sessionAttrs = $event['data']['attributes']['data']['attributes'] ?? [];
    $orderId      = $sessionAttrs['reference_number'] ?? '';

    if ($orderId) {
        $pdo = getDB();
        // Grab the PayMongo payment ID from the first payment in the session
        $pmPaymentId = $sessionAttrs['payments'][0]['id'] ?? null;

        try {
            // Upsert payment record — creates one if it was missing due to a prior bug
            $existing = $pdo->prepare("SELECT PaymentID FROM payment WHERE OrderID = ? LIMIT 1");
            $existing->execute([$orderId]);
            if ($existing->fetchColumn()) {
                $pdo->prepare("
                    UPDATE payment
                       SET PaymentStatus        = 'Paid',
                           PaidAt               = NOW(),
                           TransactionReference = COALESCE(?, TransactionReference)
                     WHERE OrderID = ?
                ")->execute([$pmPaymentId, $orderId]);
            } else {
                // Payment row was never created — insert it now
                require_once __DIR__ . '/db.php';
                $pid = substr('P' . strtoupper(bin2hex(random_bytes(5))), 0, 12);
                $amtRow = $pdo->prepare("SELECT FinalAmount FROM orders WHERE OrderID = ? LIMIT 1");
                $amtRow->execute([$orderId]);
                $amount = (float)($amtRow->fetchColumn() ?: 0);
                $pdo->prepare("
                    INSERT INTO payment (PaymentID, OrderID, PaymentMethod, PaymentStatus, AmountPaid, PaidAt, TransactionReference)
                    VALUES (?, ?, 'GCash', 'Paid', ?, NOW(), ?)
                ")->execute([$pid, $orderId, $amount, $pmPaymentId]);
            }

            $pdo->prepare("
                UPDATE orders
                   SET OrderStatus = 'Pending'
                 WHERE OrderID = ? AND OrderStatus = 'Awaiting Payment'
            ")->execute([$orderId]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }
    }
}

http_response_code(200);
echo json_encode(['received' => true]);
