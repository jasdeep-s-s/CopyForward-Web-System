<?php
// by Tudor Cosmin Suciu, 40179863

session_start();
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($input['username'] ?? '');
$pwd = $input['password'] ?? '';

require __DIR__ . '/db.php';

$stmt = $mysqli->prepare('SELECT MemberID, Username, Role, PrimaryEmail, Password FROM Member WHERE Username = ?');
$stmt->bind_param('s', $username);
$stmt->execute();

$row = $stmt->get_result()->fetch_assoc();

if (!$row || !password_verify($pwd, $row['Password'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error'   => 'Invalid credentials'
    ]);
    exit;
}

session_regenerate_id(true);

$_SESSION['member_id'] = (int)$row['MemberID'];
$_SESSION['role']      = $row['Role'];
$_SESSION['email']     = $row['PrimaryEmail'];

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int)$row['MemberID'],
        'role'     => $row['Role'],
        'email'    => $row['PrimaryEmail'],
        'username' => $row['Username']
    ]
]);
?>
