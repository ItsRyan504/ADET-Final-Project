<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/token.php';
require_once __DIR__ . '/audit_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

match ($method) {
    'GET'    => handleGet(),
    'POST'   => handlePost(),
    'PUT'    => handlePut(),
    'DELETE' => handleDelete(),
    default  => jsonError('Method not allowed', 405),
};

function ensureStatusColumn(): void {
    try {
        getDB()->exec("ALTER TABLE staff ADD COLUMN IF NOT EXISTS Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'");
    } catch (Throwable) {}
}

function rowToFrontend(array $r): array {
    return [
        'id'       => $r['StaffID'],
        'empId'    => $r['StaffID'],
        'name'     => $r['S_FirstName'] . ' ' . $r['S_LastName'],
        'position' => $r['Role'],
        'status'   => $r['Status'] ?? 'Active',
        'username' => $r['S_Username'],
        'email'    => $r['S_Email'],
        'phone'    => (string)$r['S_PhoneNumber'],
    ];
}

/* ─── GET ─── */
function handleGet(): never {
    ensureStatusColumn();
    $pdo  = getDB();
    $rows = $pdo->query(
        "SELECT StaffID, S_FirstName, S_LastName, Role, S_PhoneNumber, S_Username, S_Email, Status
           FROM staff
          ORDER BY S_FirstName ASC"
    )->fetchAll();

    jsonOut(array_map('rowToFrontend', $rows));
}

/* ─── POST ─── */
function handlePost(): never {
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $data = bodyJson();

    $id        = trim($data['id'] ?? '') ?: genId('S');
    $firstName = trim($data['firstName'] ?? '');
    $lastName  = trim($data['lastName']  ?? '');
    $position  = trim($data['position']  ?? 'Cashier');
    $username  = trim($data['username']  ?? '');
    $email     = trim($data['email']     ?? '');
    $phone     = trim($data['phone']     ?? '0');
    $password  = $data['password'] ?? '';

    if (!$firstName) jsonError('First name is required.');
    if (!$username)  jsonError('Username is required.');
    if (!$email)     jsonError('Email is required.');
    if (!$password)  jsonError('Password is required.');

    $validRoles = ['Cashier', 'Barista', 'Admin'];
    if (!in_array($position, $validRoles)) $position = 'Cashier';

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    try {
        $pdo->prepare(
            "INSERT INTO staff (StaffID, S_FirstName, S_LastName, Role, S_PhoneNumber, S_Username, S_Password, S_Email)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )->execute([$id, $firstName, $lastName, $position, (int)$phone, $username, $hashed, $email]);

        $staffName = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        logAudit('Employee Created', "$firstName $lastName", "Role: $position | Email: $email", $staff['StaffID'], $staffName);

        jsonOut(['id' => $id], 201);
    } catch (Throwable $e) {
        jsonError('Failed to add employee: ' . $e->getMessage(), 500);
    }
}

/* ─── PUT ─── */
function handlePut(): never {
    ensureStatusColumn();
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $data = bodyJson();

    $id        = trim($data['id'] ?? '');
    $firstName = trim($data['firstName'] ?? '');
    $lastName  = trim($data['lastName']  ?? '');
    $position  = trim($data['position']  ?? '');
    $username  = trim($data['username']  ?? '');
    $email     = trim($data['email']     ?? '');
    $phone     = trim($data['phone']     ?? '');
    $password  = $data['password'] ?? '';
    $status    = isset($data['status']) ? trim($data['status']) : null;

    if (!$id) jsonError('Employee ID is required.');

    $validRoles = ['Cashier', 'Barista', 'Admin'];
    if ($position && !in_array($position, $validRoles)) $position = 'Cashier';

    try {
        $sets   = [];
        $params = [];

        if ($firstName) { $sets[] = 'S_FirstName = ?';   $params[] = $firstName; }
        if ($lastName)  { $sets[] = 'S_LastName = ?';    $params[] = $lastName; }
        if ($position)  { $sets[] = 'Role = ?';          $params[] = $position; }
        if ($username)  { $sets[] = 'S_Username = ?';    $params[] = $username; }
        if ($email)     { $sets[] = 'S_Email = ?';       $params[] = $email; }
        if ($phone)     { $sets[] = 'S_PhoneNumber = ?'; $params[] = (int)$phone; }
        if ($password)  {
            $sets[]   = 'S_Password = ?';
            $params[] = password_hash($password, PASSWORD_DEFAULT);
        }
        if ($status !== null && in_array($status, ['Active', 'Inactive'])) {
            $sets[]   = 'Status = ?';
            $params[] = $status;
        }

        if (empty($sets)) jsonError('Nothing to update.');

        $params[] = $id;
        $pdo->prepare(
            "UPDATE staff SET " . implode(', ', $sets) . " WHERE StaffID = ?"
        )->execute($params);

        $stmt = $pdo->prepare(
            "SELECT StaffID, S_FirstName, S_LastName, Role, S_PhoneNumber, S_Username, S_Email, Status
               FROM staff WHERE StaffID = ?"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Employee not found.', 404);

        $staffName  = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        $targetName = $row['S_FirstName'] . ' ' . $row['S_LastName'];
        if ($password) {
            $action = 'Employee Password Changed';
        } elseif ($status !== null) {
            $action = "Employee Status Changed to $status";
        } else {
            $action = 'Employee Updated';
        }
        logAudit($action, $targetName, "ID: $id", $staff['StaffID'], $staffName);

        jsonOut(rowToFrontend($row));
    } catch (Throwable $e) {
        jsonError('Failed to update employee: ' . $e->getMessage(), 500);
    }
}

/* ─── DELETE ─── */
function handleDelete(): never {
    $staff = requireAdminAuth();
    $pdo   = getDB();
    $id    = trim($_GET['id'] ?? '');

    if (!$id) jsonError('Employee ID is required.');

    try {
        $nameRow = $pdo->prepare("SELECT S_FirstName, S_LastName FROM staff WHERE StaffID = ?");
        $nameRow->execute([$id]);
        $target = $nameRow->fetch();

        $stmt = $pdo->prepare("DELETE FROM staff WHERE StaffID = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError('Employee not found.', 404);

        $staffName  = trim(($staff['S_FirstName'] ?? '') . ' ' . ($staff['S_LastName'] ?? ''));
        $targetName = $target ? $target['S_FirstName'] . ' ' . $target['S_LastName'] : $id;
        logAudit('Employee Deleted', $targetName, "ID: $id", $staff['StaffID'], $staffName);

        jsonOut(['deleted' => $id]);
    } catch (Throwable $e) {
        jsonError('Failed to delete employee: ' . $e->getMessage(), 500);
    }
}

