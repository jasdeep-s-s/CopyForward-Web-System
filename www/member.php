<?php
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

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(["success" => false, "error" => "Missing or invalid id"]);
    exit;
}

$sql = "SELECT MemberID, Role, Name, Username, Organization, PrimaryEmail, ORCID 
    FROM Member 
    WHERE MemberID = ? 
    LIMIT 1";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "execute", "sql" => $sql, "error" => $stmt->error]);
    $stmt->close();
    exit;
}

$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();
$mysqli->close();

if (!$row) {
    echo json_encode(["success" => false, "error" => "Member not found"]);
    exit;
}

echo json_encode($row);

?>
