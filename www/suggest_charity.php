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
    echo json_encode(["success"=>false, "error"=>$mysqli->connect_error]);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$name = isset($data['name']) ? trim($data['name']) : '';
$suggestedBy = isset($data['suggestedBy']) ? intval($data['suggestedBy']) : 0;

if (!$name || $suggestedBy <= 0) {
    echo json_encode(["success"=>false, "error"=>"Missing name or suggestedBy"]);
    exit;
}

$sql = "INSERT INTO ChildrenCharity (Name, Approved, SuggestedBy) VALUES (?, 0, ?)";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success"=>false, "error"=>$mysqli->error]);
    exit;
}

$stmt->bind_param('si', $name, $suggestedBy);
if (!$stmt->execute()) {
    echo json_encode(["success"=>false, "error"=>$stmt->error]);
    $stmt->close();
    exit;
}

$insertId = $stmt->insert_id;
$stmt->close();
$mysqli->close();

echo json_encode(["success"=>true, "suggestedId"=>$insertId]);

?>
