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
    echo json_encode(["success" => false, "error" => $mysqli->connect_error]);
    exit;
}

try {
    $itemId = isset($_GET['item']) ? intval($_GET['item']) : 0;
    if (!$itemId) {
        echo json_encode(["success" => false, "error" => "missing_item"]);
        exit;
    }

    $stmt = $mysqli->prepare(
        "SELECT 1 
        FROM Discussion d 
        WHERE d.ItemID = ? AND d.CommitteeID = 1 AND d.VoteActive = 1 
        LIMIT 1"
    );
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('i', $itemId);
    $stmt->execute();
    $res = $stmt->get_result();
    $exists = $res && $res->fetch_assoc() ? true : false;

    echo json_encode(["success" => true, "active" => $exists]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
