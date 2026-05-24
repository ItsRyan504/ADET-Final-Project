<?php
/**
 * Public endpoint: cancels an order that is still in 'Awaiting Payment'.
 * Only affects unpaid online orders — paid or in-progress orders are ignored.
 */
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body    = bodyJson();
$orderId = ltrim(trim($body['order'] ?? ''), '#');

if (!$orderId) jsonError('order is required.', 400);

$pdo = getDB();

$stmt = $pdo->prepare("
    UPDATE orders
       SET OrderStatus = 'Cancelled'
     WHERE OrderID = ? AND OrderStatus = 'Awaiting Payment'
");
$stmt->execute([$orderId]);

jsonOut(['cancelled' => $stmt->rowCount() > 0]);
