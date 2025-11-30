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
    echo json_encode(["success" => false, "error" => $mysqli->connect_error]);
    exit;
}

try {
    $discussion = isset($_GET['discussion']) ? intval($_GET['discussion']) : 0;
    if (!$discussion) {
        echo json_encode(["success" => false, "error" => "missing_discussion"]);
        exit;
    }

    $stmt = $mysqli->prepare(
        "SELECT Subject 
        FROM Discussion 
        WHERE DiscussionID = ? 
        LIMIT 1"
    );
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('i', $discussion);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        echo json_encode(["success" => true, "Subject" => $row['Subject']]);
    } else {
        echo json_encode(["success" => false, "error" => "not_found"]);
    }
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
