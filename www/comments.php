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
    echo json_encode(["error" => "DB connection failed", "errno" => $mysqli->connect_errno]);
    exit;
}

$item = isset($_GET['item']) ? intval($_GET['item']) : 0;
if ($item <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing item"]);
    $mysqli->close();
    exit;
}

$sql = "SELECT c.CommentID, m.Name AS CommentorName, c.Comment, c.Date, c.ParentCommentID
        FROM Comment c
        LEFT JOIN Member m ON c.CommentorID = m.MemberID
        WHERE c.ItemID = ?
        ORDER BY c.Date ASC";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('i', $item);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Execute failed", "stmt_error" => $stmt->error]);
    $stmt->close();
    exit;
}

$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = $r;
}
$stmt->close();

echo json_encode($rows);
$mysqli->close();
