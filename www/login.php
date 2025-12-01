<?php
// by Tudor Cosmin Suciu, 40179863
session_start();
header('Content-Type: application/json');

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($input['username'] ?? '');
$pwd      = $input['password'] ?? '';

function respond($status, $payload)
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

require __DIR__ . '/db.php';

$stmt = $mysqli->prepare('SELECT MemberID, Username, Role, PrimaryEmail, Password FROM Member WHERE Username = ?');
$stmt->bind_param('s', $username);
$stmt->execute();

$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row || $row['Password'] === 'TBD' || !password_verify($pwd, $row['Password'])) {
    respond(401, [
        'success' => false,
        'error'   => 'Invalid credentials'
    ]);
}

session_regenerate_id(true);

$_SESSION['member_id'] = (int)$row['MemberID'];
$_SESSION['role']      = $row['Role'];
$_SESSION['email']     = $row['PrimaryEmail'];

$matrixInfo = null;
$matrixStmt = $mysqli->prepare('SELECT Matrix, ExpiryDate, CreationDate, recentlyUpdated FROM MFAMatrix WHERE UserID = ? ORDER BY CreationDate DESC LIMIT 1');
$mid = (int)$row['MemberID'];
$matrixStmt->bind_param('i', $mid);
if ($matrixStmt->execute()) {
    $res = $matrixStmt->get_result();
    $mr  = $res ? $res->fetch_assoc() : null;
    if ($mr) {
        $matrixInfo = [
            'matrix'  => $mr['Matrix'],
            'expiry'  => $mr['ExpiryDate'],
            'created' => $mr['CreationDate'],
            'recentlyUpdated' => (bool)$mr['recentlyUpdated']
        ];
    }
}
$matrixStmt->close();

respond(200, [
    'success' => true,
    'user'    => [
        'id'       => (int)$row['MemberID'],
        'role'     => $row['Role'],
        'email'    => $row['PrimaryEmail'],
        'username' => $row['Username']
    ],
    'matrix'  => $matrixInfo
]);
?>
