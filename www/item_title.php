<?php
// by Pascal Ypperciel, 40210921
header('Content-Type: application/json');

ini_set('display_errors', 0);
error_reporting(E_ALL);

$dbHost = getenv('MYSQL_HOST') ?: 'database';
$dbUser = getenv('MYSQL_USER') ?: 'root';
$dbPass = getenv('MYSQL_PASSWORD') ?: 'tiger';
$dbName = getenv('MYSQL_DATABASE') ?: 'ovc353_2';
$dbPort = getenv('MYSQL_PORT') ?: 3306;

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
if ($mysqli->connect_errno) {
    echo json_encode(["success" => false, "error" => $mysqli->connect_error]);
    exit;
}

try {
    $item = isset($_GET['item']) ? intval($_GET['item']) : 0;
    if (!$item) {
        echo json_encode(["success" => false, "error" => "missing_item"]);
        exit;
    }

    $stmt = $mysqli->prepare("SELECT Title FROM Item WHERE ItemID = ? LIMIT 1");
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('i', $item);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        echo json_encode(["success" => true, "Title" => $row['Title']]);
    } else {
        echo json_encode(["success" => false, "error" => "not_found"]);
    }
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
