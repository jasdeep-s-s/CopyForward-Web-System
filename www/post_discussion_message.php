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
    echo json_encode(["success" => false, "step" => "db_connect", "error" => $mysqli->connect_error]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "error" => "unsupported_method"]);
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $discussionId = isset($body['discussionId']) ? intval($body['discussionId']) : 0;
    $senderId = isset($body['senderId']) ? intval($body['senderId']) : 0;
    $message = isset($body['message']) ? trim($body['message']) : '';

    if (!$discussionId || !$senderId || $message === '') {
        echo json_encode(["success" => false, "error" => "missing_parameters"]);
        exit;
    }

    $stmt = $mysqli->prepare("INSERT INTO DiscussionMessage (DiscussionID, SenderID, Message, Date) 
        VALUES (?, ?, ?, NOW())");
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('iis', $discussionId, $senderId, $message);
    $ok = $stmt->execute();
    if (!$ok) throw new Exception($stmt->error ?: $mysqli->error);

    echo json_encode(["success" => true]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
