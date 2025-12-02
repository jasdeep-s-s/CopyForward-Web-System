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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "error" => "unsupported_method"]);
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $authorOrcid = isset($body['authorOrcid']) ? trim($body['authorOrcid']) : '';
    $title = isset($body['title']) ? trim($body['title']) : '';
    $publicationDate = isset($body['publicationDate']) && $body['publicationDate'] !== '' ? trim($body['publicationDate']) : null;
    $topic = isset($body['topic']) ? trim($body['topic']) : '';
    $type = isset($body['type']) ? trim($body['type']) : '';
    $parentId = isset($body['parentId']) && $body['parentId'] !== '' ? intval($body['parentId']) : null;
    $content = isset($body['content']) ? trim($body['content']) : '';

    if (!$authorOrcid || !$title || !$type) {
        echo json_encode(["success" => false, "error" => "missing_parameters"]);
        exit;
    }

    if (strlen($content) > 5000) {
        echo json_encode(["success" => false, "error" => "content_too_long"]);
        exit;
    }

    $mstmt = $mysqli->prepare(
        "SELECT MemberID, Blacklisted 
        FROM Member 
        WHERE ORCID = ? 
        LIMIT 1"
    );
    if (!$mstmt) throw new Exception($mysqli->error);
    $mstmt->bind_param('s', $authorOrcid);
    $mstmt->execute();
    $mres = $mstmt->get_result();
    $mrow = $mres->fetch_assoc();
    if (!$mrow) {
        echo json_encode(["success" => false, "error" => "author_not_found"]);
        exit;
    }
    if (isset($mrow['Blacklisted']) && intval($mrow['Blacklisted']) === 1) {
        echo json_encode(["success" => false, "error" => "blacklisted"]);
        exit;
    }

    $sql = "INSERT INTO Item (AuthorID, Title, PublicationDate, UploadDate, ApprovedBy, Topic, Type, Status, ParentTitleID, Content, UpdatedAt) 
    VALUES (?, ?, ?, NOW(), NULL, ?, ?, 'Under Review (Upload)', ?, ?, NOW())";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('sssssis', $authorOrcid, $title, $publicationDate, $topic, $type, $parentId, $content);
    $ok = $stmt->execute();
    if (!$ok) throw new Exception($stmt->error ?: $mysqli->error);

    $newId = $mysqli->insert_id;
    echo json_encode(["success" => true, "ItemID" => $newId]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
