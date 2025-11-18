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
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "DB connection failed", "errno" => $mysqli->connect_errno]);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$itemId = isset($data['itemId']) ? intval($data['itemId']) : 0;
$commentorId = isset($data['commentorId']) ? intval($data['commentorId']) : 0;
$comment = isset($data['comment']) ? trim($data['comment']) : '';
$parentId = isset($data['parentId']) ? intval($data['parentId']) : 0;

if ($itemId <= 0 || $commentorId <= 0 || $comment === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing required fields"]);
    $mysqli->close();
    exit;
}

$now = date('Y-m-d H:i:s');
try {
    if ($parentId > 0) {
        $sql = "INSERT INTO Comment (ItemID, CommentorID, Comment, Date, ParentCommentID) VALUES (?, ?, ?, ?, ?)";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) throw new Exception($mysqli->error);
        $stmt->bind_param('iissi', $itemId, $commentorId, $comment, $now, $parentId);
    } else {
        $sql = "INSERT INTO Comment (ItemID, CommentorID, Comment, Date) VALUES (?, ?, ?, ?)";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) throw new Exception($mysqli->error);
        $stmt->bind_param('iiss', $itemId, $commentorId, $comment, $now);
    }

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    $insertId = $mysqli->insert_id;
    $stmt->close();

    echo json_encode(["success" => true, "insertId" => $insertId, "date" => $now]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Insert failed", "detail" => $e->getMessage()]);
}

$mysqli->close();
