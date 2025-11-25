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
    echo json_encode(["success" => false, "step" => "db_connect", "error" => $mysqli->connect_error]);
    exit;
}

$discussionId = isset($_GET['discussion']) ? intval($_GET['discussion']) : 0;

try {
    if (!$discussionId) {
        echo json_encode(["success" => false, "error" => "missing_discussion_id"]);
        exit;
    }

    $sql = "SELECT d.DiscussionID, d.CommitteeID, d.VotingDeadline, COALESCE(c.Name, '') AS CommitteeName 
        FROM Discussion d 
        LEFT JOIN Committee c ON d.CommitteeID = c.CommitteeID 
        WHERE d.DiscussionID = ?";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i', $discussionId);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();

    if (!$row) {
        echo json_encode(["success" => false, "error" => "not_found"]);
    } else {
        $row['VotingDeadline'] = $row['VotingDeadline'] ? $row['VotingDeadline'] : null;
        echo json_encode($row);
    }
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
