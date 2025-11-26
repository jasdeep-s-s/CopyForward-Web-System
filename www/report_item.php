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

    $stmt = $mysqli->prepare(
        "SELECT 1 
        FROM MemberCommittee mc 
        WHERE mc.MemberID = ? AND mc.CommitteeID = 1 AND mc.Approved = 1
        LIMIT 1"
    );
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('i', $memberId);
    $stmt->execute();
    $cres = $stmt->get_result();
    $isCommittee = (bool)$cres->fetch_assoc();

    if (!$isCommittee) {
        $s2 = $mysqli->prepare(
            "SELECT Status 
            FROM Item 
            WHERE ItemID = ? 
            LIMIT 1"
        );
        if (!$s2) throw new Exception($mysqli->error);
        $s2->bind_param('i', $itemId);
        $s2->execute();
        $r2 = $s2->get_result();
        $row = $r2->fetch_assoc();
        $status = $row ? $row['Status'] : null;
        if ($status !== 'Under Review (Plagiarism)') {
            echo json_encode(["success" => false, "error" => "not_allowed"]);
            exit;
        }
    }

    $check = $mysqli->prepare(
        "SELECT DiscussionID 
        FROM Discussion d 
        WHERE d.CommitteeID = 1 AND d.ItemID = ? AND d.Status = 'Open' 
        LIMIT 1"
    );
    if (!$check) throw new Exception($mysqli->error);
    $check->bind_param('i', $itemId);
    $check->execute();
    $cres2 = $check->get_result();
    $existing = $cres2->fetch_assoc();
    if ($existing && !empty($existing['DiscussionID'])) {
        echo json_encode(["success" => true, "discussionId" => (int)$existing['DiscussionID'], "note" => "existing" ]);
        exit;
    }

    $subject = 'Plagiarism Suspected, Do We Remove?';
    $voteActive = 1;
    $statusField = 'Open';

    $ins = $mysqli->prepare(
        "INSERT INTO Discussion (CommitteeID, ItemID, Subject, VoteActive, VotingDeadline, Status)
         VALUES (1, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 WEEK), ? )"
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
