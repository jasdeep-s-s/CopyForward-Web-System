<?php
// by Pascal Ypperciel, 40210921
header('Content-Type: application/json');

ini_set('display_errors', 0);
error_reporting(E_ALL);

$dbHost = 'database';
$dbUser = getenv('MYSQL_USER') ?: 'docker';
$dbPass = getenv('MYSQL_PASSWORD') ?: 'docker';
$dbName = 'CFP';
$dbPort = 3306;

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);

if ($mysqli->connect_errno) {
    echo json_encode([
        "success" => false,
        "step"    => "db_connect",
        "error"   => $mysqli->connect_error,
        "errno"   => $mysqli->connect_errno
    ]);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$email = isset($data['email']) ? trim($data['email']) : '';

if (!$email) {
    echo json_encode(["success" => false, "step" => "validate_input", "error" => "Missing email"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "step" => "validate_email", "error" => "Invalid email"]);
    exit;
}

// check if already exists
$sql = "SELECT MemberID FROM Member WHERE PrimaryEmail = ? LIMIT 1";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare_check", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}
$stmt->bind_param('s', $email);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "exec_check", "sql" => $sql, "error" => $stmt->error]);
    $stmt->close();
    exit;
}
$stmt->bind_result($memberId);
if ($stmt->fetch()) {
    $stmt->close();
    echo json_encode(["success" => false, "step" => "exists", "error" => "Member with that email already exists"]);
    exit;
}
$stmt->close();

$sql = "INSERT INTO Member (Role, Name, Username, Organization, AddressID, PrimaryEmail, RecoveryEmail, Password, ORCID, Blacklisted)
    VALUES ('Regular', 'TBD', 'TBD', NULL, NULL, ?, NULL, 'TBD', NULL, FALSE)";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare_insert", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('s', $email);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "exec_insert", "sql" => $sql, "error" => $stmt->error]);
    $stmt->close();
    exit;
}

$insertId = $stmt->insert_id;
$stmt->close();
$mysqli->close();

echo json_encode(["success" => true, "insertId" => $insertId]);

?>
