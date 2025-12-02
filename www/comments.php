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

$item = isset($_GET['item']) ? intval($_GET['item']) : 0;
if ($item <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing item"]);
    $mysqli->close();
    exit;
}

$sql = "SELECT c.CommentID, m.Username AS CommentorName, c.Comment, c.Date, c.ParentCommentID, c.CommentorID, c.private
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
    $r['CommentID'] = isset($r['CommentID']) ? intval($r['CommentID']) : 0;
    $r['ParentCommentID'] = isset($r['ParentCommentID']) ? intval($r['ParentCommentID']) : 0;
    $r['CommentorID'] = isset($r['CommentorID']) ? intval($r['CommentorID']) : 0;
    $r['private'] = isset($r['private']) ? (bool)$r['private'] : false;
    $rows[] = $r;
}
$stmt->close();

$viewer = isset($_GET['viewer']) ? intval($_GET['viewer']) : 0;

if ($viewer > 0) {
    $commentorMap = [];
    foreach ($rows as $r) {
        $commentorMap[$r['CommentID']] = $r['CommentorID'];
    }

    $filtered = [];
    foreach ($rows as $r) {
        if (!$r['private']) {
            $filtered[] = $r;
            continue;
        }
        
        if ($viewer === $r['CommentorID']) {
            $filtered[] = $r;
            continue;
        }
        if ($r['ParentCommentID'] && isset($commentorMap[$r['ParentCommentID']]) && $viewer === $commentorMap[$r['ParentCommentID']]) {
            $filtered[] = $r;
            continue;
        }
    }
    echo json_encode($filtered);
} else {
    $publicOnly = array_filter($rows, function($r){ return !$r['private']; });
    echo json_encode(array_values($publicOnly));
}
$mysqli->close();
