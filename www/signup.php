// by Tudor Cosmin Suciu, 40179863

<?php
session_start();
header('Content-Type: application/json');

$in = json_decode(file_get_contents('php://input'), true) ?? [];
$name = trim($in['name'] ?? '');
$username = trim($in['username'] ?? '');
$email = trim($in['email'] ?? '');
$pwd = $in['password'] ?? '';
$orcid = trim($in['orcid'] ?? '');
if (!$name || !$username || !$email || strlen($pwd) < 6) {
  http_response_code(400); echo json_encode(['error'=>'Missing fields']); exit;
}
$hash = password_hash($pwd, PASSWORD_DEFAULT);

require __DIR__ . '/db.php';
// ensure unique username/email
$stmt = $mysqli->prepare('SELECT 1 FROM Member WHERE Username = ? OR PrimaryEmail = ?');
$stmt->bind_param('ss', $username, $email);
$stmt->execute();
if ($stmt->get_result()->fetch_row()) { http_response_code(409); echo json_encode(['error'=>'Username or email already exists']); exit; }

$stmt = $mysqli->prepare('INSERT INTO Member (Role, Name, Username, PrimaryEmail, Password, ORCID, Blacklisted) VALUES (?, ?, ?, ?, ?, ?, 0)');
$role = 'Regular';
$stmt->bind_param('ssssss', $role, $name, $username, $email, $hash, $orcid ?: null);
if (!$stmt->execute()) { http_response_code(500); echo json_encode(['error'=>'Create failed']); exit; }

session_regenerate_id(true);
$_SESSION['member_id'] = $stmt->insert_id;
$_SESSION['role'] = $role;
$_SESSION['email'] = $email;
echo json_encode(['success'=>true,'user'=>[
  'id'=>$stmt->insert_id,
  'role'=>$role,
  'email'=>$email,
  'username'=>$username
]]);
