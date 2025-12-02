<?php
// by Pascal Ypperciel, 40210921
header('Content-Type: application/json');

ini_set('display_errors', 0);
error_reporting(E_ALL);

$dbHost = 'database';
$dbUser = 'docker';
$dbPass = 'docker';
$dbName = 'ovc353_2';
$dbPort = 3306;

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed", "errno" => $mysqli->connect_errno]);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(["ParentTitleID" => null]);
    $mysqli->close();
    exit;
}

$sql = "SELECT i.ParentTitleID 
    FROM Item i 
    WHERE i.ItemID = ? 
    LIMIT 1";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Execute failed", "stmt_error" => $stmt->error]);
    $stmt->close();
    exit;
}

$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) {
    echo json_encode(["ParentTitleID" => null]);
    $mysqli->close();
    exit;
}

echo json_encode($row);
$mysqli->close();
