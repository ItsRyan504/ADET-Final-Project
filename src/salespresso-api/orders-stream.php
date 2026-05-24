<?php
/**
 * Server-Sent Events stream for real-time order updates.
 * The browser opens one persistent connection; this script pushes the full
 * orders array whenever the DB data changes (checked every 2 seconds).
 */
set_time_limit(0);
ignore_user_abort(false);

// SSE-specific headers — do NOT include cors.php (it sets Content-Type: application/json)
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');   // prevent nginx / Apache mod_proxy from buffering
header('Access-Control-Allow-Origin: *');

// Flush all output buffers so data reaches the browser immediately
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
while (ob_get_level() > 0) ob_end_clean();
ob_implicit_flush(true);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/paymongo-config.php';

/* ── PayMongo sync ── */
function syncPendingPayments(PDO $pdo): void {
    $stmt = $pdo->query("
        SELECT o.OrderID, p.TransactionReference
          FROM orders o
          JOIN payment p ON p.OrderID = o.OrderID
         WHERE o.OrderStatus = 'Awaiting Payment'
           AND p.TransactionReference IS NOT NULL
           AND p.PaymentStatus != 'Paid'
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
        $orderId   = $row['OrderID'];
        $sessionId = $row['TransactionReference'];

        $ch = curl_init('https://api.paymongo.com/v1/checkout_sessions/' . urlencode($sessionId));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':'),
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 10,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) continue;

        $data  = json_decode($response, true);
        $attrs = $data['data']['attributes'] ?? [];
        $paymentStatus = $attrs['payment_intent']['attributes']['status'] ?? $attrs['status'] ?? '';
        $isPaid = $paymentStatus === 'paid' || $paymentStatus === 'succeeded';

        if (!$isPaid && !empty($attrs['payments'])) {
            foreach ($attrs['payments'] as $p) {
                if (($p['attributes']['status'] ?? '') === 'paid') {
                    $isPaid = true;
                    break;
                }
            }
        }

        if ($isPaid) {
            $pmPaymentId = $attrs['payments'][0]['id'] ?? null;
            $pdo->prepare("
                UPDATE payment
                   SET PaymentStatus = 'Paid', PaidAt = NOW(),
                       TransactionReference = COALESCE(?, TransactionReference)
                 WHERE OrderID = ?
            ")->execute([$pmPaymentId ?? $sessionId, $orderId]);

            $pdo->prepare("
                UPDATE orders SET OrderStatus = 'Pending'
                 WHERE OrderID = ? AND OrderStatus = 'Awaiting Payment'
            ")->execute([$orderId]);
        }
    }
}

/* ── SSE helpers ── */
function sseEvent(string $event, mixed $data): void {
    echo "event: $event\n";
    echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
    flush();
}

function sseHeartbeat(): void {
    // SSE comment line — keeps proxies/browsers from closing an idle connection
    echo ": heartbeat\n\n";
    flush();
}

/* ── DB query ── */
function fetchOrders(PDO $pdo): array {
    try {
        $stmt = $pdo->query(
            "SELECT o.OrderID, o.CustomerID,
                    CONCAT(c.C_FirstName, ' ', c.C_LastName) AS CustomerName,
                    o.OrderDate, o.OrderStatus, o.FinalAmount, o.Note, o.ItemsSummary,
                    o.CompletedAt, o.StaffID,
                    CONCAT(s.S_FirstName, ' ', s.S_LastName) AS EmployeeName,
                    p.PaymentMethod, p.PaymentStatus
               FROM orders o
               LEFT JOIN customer c ON c.CustomerID = o.CustomerID
               LEFT JOIN staff    s ON s.StaffID    = o.StaffID
               LEFT JOIN payment  p ON p.OrderID    = o.OrderID
              ORDER BY o.OrderDate DESC"
        );
        return array_map('mapStreamOrder', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Throwable) {
        return [];
    }
}

function mapStreamOrder(array $row): array {
    $itemsSummary = $row['ItemsSummary'] ?? null;
    $items = [];
    if ($itemsSummary) {
        $decoded = json_decode($itemsSummary, true);
        if (is_array($decoded)) {
            if (isset($decoded[0]) && is_string($decoded[0])) {
                $items = $decoded;
            } else {
                $items = array_map(fn($i) => ($i['qty'] ?? 1) . 'x ' . ($i['name'] ?? ''), $decoded);
            }
        }
    }

    $rawPaymentMethod = $row['PaymentMethod'] ?? null;
    $paymentMethod    = $rawPaymentMethod === 'GCash' ? 'online' : 'cash';

    return [
        'id'            => '#' . $row['OrderID'],
        'dbId'          => $row['OrderID'],
        'userId'        => $row['CustomerID'] ?? 'guest',
        'customer'      => isset($row['CustomerName']) && trim($row['CustomerName']) !== ' '
                             ? trim($row['CustomerName'])
                             : ($row['CustomerID'] ?? 'Guest'),
        'date'          => (new DateTime($row['OrderDate']))->format('M j, Y · g:i A'),
        'completedAt'   => !empty($row['CompletedAt'])
                             ? (new DateTime($row['CompletedAt']))->format('M j, Y · g:i A')
                             : null,
        'items'         => $items,
        'total'         => (float)$row['FinalAmount'],
        'note'          => $row['Note'] ?? '',
        'status'        => $row['OrderStatus'],
        'employee'      => isset($row['EmployeeName']) && trim($row['EmployeeName']) !== ' '
                             ? trim($row['EmployeeName']) : null,
        'paymentMethod' => $rawPaymentMethod ? $paymentMethod : 'cash',
        'paymentStatus' => $row['PaymentStatus'] ?? 'Pending',
    ];
}

/* ── Main loop ── */
sseEvent('connected', ['status' => 'ok']);

$pdo         = getDB();
$lastHash    = '';
$heartbeatAt = time();
$lastSyncAt  = 0;

while (true) {
    if (connection_aborted()) break;

    // Sync paid-but-unregistered online orders every 30 seconds
    if (time() - $lastSyncAt >= 30) {
        try { syncPendingPayments($pdo); } catch (Throwable) {}
        $lastSyncAt = time();
    }

    try {
        $orders = fetchOrders($pdo);
        $hash   = md5(json_encode($orders));

        if ($hash !== $lastHash) {
            sseEvent('orders', $orders);
            $lastHash = $hash;
        }
    } catch (Throwable) {
        // DB dropped — try to reconnect on next tick
        try { $pdo = getDB(); } catch (Throwable) {}
    }

    // Keep the connection alive for proxies that close idle streams
    if (time() - $heartbeatAt >= 25) {
        sseHeartbeat();
        $heartbeatAt = time();
    }

    sleep(2);
}
