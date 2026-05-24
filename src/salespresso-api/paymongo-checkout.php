<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/paymongo-config.php';
require_once __DIR__ . '/rate_limit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

checkRateLimit('payment_init', 5, 300); // 5 payment attempts per 5 min per IP

$body    = bodyJson();
$orderId = ltrim(trim($body['orderId'] ?? ''), '#');

if (!$orderId) jsonError('orderId is required.', 400);

$pdo = getDB();

// Fetch the real total from DB — never trust the client-sent amount
$stmt = $pdo->prepare(
    "SELECT o.FinalAmount FROM orders o WHERE o.OrderID = ? LIMIT 1"
);
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) jsonError('Order not found.', 404);

$amountCentavos = (int) round($order['FinalAmount'] * 100);

// PayMongo minimum transaction is ₱20 (2000 centavos)
if ($amountCentavos < 2000) {
    jsonError('Order total must be at least ₱20 to pay online.', 400);
}

$payload = [
    'data' => [
        'attributes' => [
            'line_items' => [[
                'name'     => 'JazSam Order #' . $orderId,
                'quantity' => 1,
                'amount'   => $amountCentavos,
                'currency' => 'PHP',
            ]],
            'payment_method_types' => ['gcash'],
            'success_url'      => FRONTEND_URL . '/payment-success?order=' . $orderId,
            'cancel_url'       => FRONTEND_URL . '/payment-cancel?order='  . $orderId,
            'reference_number' => $orderId,
            'description'      => 'JazSam Order #' . $orderId,
        ],
    ],
];

$ch = curl_init('https://api.paymongo.com/v1/checkout_sessions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':'),
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    jsonError('Could not reach PayMongo: ' . $curlErr, 502);
}

$data = json_decode($response, true);

if ($httpCode !== 200 || empty($data['data']['attributes']['checkout_url'])) {
    $detail = $data['errors'][0]['detail'] ?? ('PayMongo error (HTTP ' . $httpCode . ')');
    jsonError($detail, 502);
}

$sessionId   = $data['data']['id'];
$checkoutUrl = $data['data']['attributes']['checkout_url'];

// Store the PayMongo session ID so the webhook can match it later
try {
    $pdo->prepare(
        "UPDATE payment SET TransactionReference = ? WHERE OrderID = ?"
    )->execute([$sessionId, $orderId]);
} catch (Throwable) {}

jsonOut(['checkoutUrl' => $checkoutUrl]);
