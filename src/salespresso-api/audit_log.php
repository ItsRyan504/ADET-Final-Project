<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';
require_once __DIR__ . '/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'    => handleGet(),
    'DELETE' => handleClear(),
    default  => jsonError('Method not allowed', 405),
};

/* ─── GET: fetch audit logs ─────────────────────────── */
function handleGet(): never {
    requireAdminAuth();
    ensureAuditTable();

    $limit  = min((int)($_GET['limit']  ?? 200), 500);
    $offset = max((int)($_GET['offset'] ?? 0),   0);

    $rows = getDB()->prepare(
        "SELECT LogID, StaffID, StaffName, Action, Target, Details, CreatedAt
           FROM audit_log
          ORDER BY CreatedAt DESC
          LIMIT ? OFFSET ?"
    );
    $rows->execute([$limit, $offset]);

    $total = (int)getDB()->query("SELECT COUNT(*) FROM audit_log")->fetchColumn();

    jsonOut([
        'total' => $total,
        'logs'  => array_map(fn($r) => [
            'id'        => $r['LogID'],
            'staffId'   => $r['StaffID'],
            'staffName' => $r['StaffName'] ?? 'System',
            'action'    => $r['Action'],
            'target'    => $r['Target'],
            'details'   => $r['Details'],
            'createdAt' => $r['CreatedAt'],
        ], $rows->fetchAll()),
    ]);
}

/* ─── DELETE: clear all logs (admin only) ───────────── */
function handleClear(): never {
    requireAdminAuth();
    if (($_GET['confirm'] ?? '') !== 'yes') {
        jsonError('Pass ?confirm=yes to clear all logs.', 400);
    }
    getDB()->exec("DELETE FROM audit_log");
    jsonOut(['cleared' => true]);
}
