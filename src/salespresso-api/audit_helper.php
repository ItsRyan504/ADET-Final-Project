<?php
require_once __DIR__ . '/db.php';

function ensureAuditTable(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    getDB()->exec("
        CREATE TABLE IF NOT EXISTS audit_log (
            LogID     INT          AUTO_INCREMENT PRIMARY KEY,
            StaffID   VARCHAR(12)  NULL,
            StaffName VARCHAR(100) NULL,
            Action    VARCHAR(100) NOT NULL,
            Target    VARCHAR(200) NULL,
            Details   TEXT         NULL,
            CreatedAt DATETIME     NOT NULL DEFAULT NOW()
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function logAudit(string $action, ?string $target = null, ?string $details = null, ?string $staffId = null, ?string $staffName = null): void {
    try {
        ensureAuditTable();
        getDB()->prepare(
            "INSERT INTO audit_log (StaffID, StaffName, Action, Target, Details)
             VALUES (?, ?, ?, ?, ?)"
        )->execute([$staffId, $staffName, $action, $target, $details]);
    } catch (Throwable $e) {
        // Never let audit logging break the main operation
    }
}
