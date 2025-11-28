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
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        echo json_encode(["success" => false, "error" => "invalid_json"]);
        exit;
    }

    $memberId = isset($data['memberId']) ? intval($data['memberId']) : 0;
    $itemId = isset($data['itemId']) ? intval($data['itemId']) : 0;
    if (!$memberId || !$itemId) {
        echo json_encode(["success" => false, "error" => "missing_params"]);
        exit;
    }

    $check = $mysqli->prepare(
        "SELECT DiscussionID 
        FROM Discussion d 
        WHERE d.CommitteeID = 2 AND d.ItemID = ? AND d.Status = 'Open' 
        LIMIT 1"
    );
    if (!$check) throw new Exception($mysqli->error);
    $check->bind_param('i', $itemId);
    $check->execute();
    $cres = $check->get_result();
    $existing = $cres->fetch_assoc();
    if ($existing && !empty($existing['DiscussionID'])) {
        echo json_encode(["success" => true, "discussionId" => (int)$existing['DiscussionID'], "note" => "existing"]);
        exit;
    }

    $authCheck = $mysqli->prepare(
        "SELECT i.ItemID 
        FROM Item i 
        LEFT JOIN Member m ON i.AuthorID = m.ORCID 
        WHERE i.ItemID = ? AND m.MemberID = ? 
        LIMIT 1"
    );
    if (!$authCheck) throw new Exception($mysqli->error);
    $authCheck->bind_param('ii', $itemId, $memberId);
    $authCheck->execute();
    $r = $authCheck->get_result();
    $row = $r->fetch_assoc();
    if (!$row) {
        echo json_encode(["success" => false, "error" => "not_author"]);
        exit;
    }

    $subject = 'Author Appealed. Do We Agree?';
    $voteActive = 1;
    $statusField = 'Open';

    $ins = $mysqli->prepare(
        "INSERT INTO Discussion (CommitteeID, ItemID, Subject, VoteActive, VotingDeadline, Status)
         VALUES (2, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 WEEK), ? )"
    );
    if (!$ins) throw new Exception($mysqli->error);
    $ins->bind_param('isss', $itemId, $subject, $voteActive, $statusField);
    $ins->execute();
    $did = $ins->insert_id;

    echo json_encode(["success" => true, "discussionId" => $did]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
