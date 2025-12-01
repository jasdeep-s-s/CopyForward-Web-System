<?php
// by Pascal Ypperciel, 40210921
// Jasdeep S. Sandhu, 40266557
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

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $discussionId = isset($_GET['discussion']) ? intval($_GET['discussion']) : 0;
        $voterId = isset($_GET['voter']) ? intval($_GET['voter']) : 0;

        if (!$discussionId) {
            echo json_encode(["success" => false, "error" => "missing_discussion_id"]);
            exit;
        }

        $sql = "SELECT SUM(dv.Vote = TRUE) AS TrueCount, SUM(dv.Vote = FALSE) AS FalseCount 
            FROM DiscussionVote dv 
            WHERE dv.DiscussionID = ?";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param('i', $discussionId);
        $stmt->execute();
        $res = $stmt->get_result();
        $counts = $res->fetch_assoc();
        $counts['TrueCount'] = isset($counts['TrueCount']) ? intval($counts['TrueCount']) : 0;
        $counts['FalseCount'] = isset($counts['FalseCount']) ? intval($counts['FalseCount']) : 0;

        $hasVoted = false;
        if ($voterId) {
            $sql2 = "SELECT 1 
                FROM DiscussionVote dv 
                WHERE dv.VoterID = ? AND dv.DiscussionID = ? 
                LIMIT 1";
            $stmt2 = $mysqli->prepare($sql2);
            $stmt2->bind_param('ii', $voterId, $discussionId);
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            $hasVoted = $res2 && $res2->fetch_assoc() ? true : false;
        }

        echo json_encode(['success' => true, 'counts' => $counts, 'hasVoted' => $hasVoted]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true);
        $voterId = isset($body['voterId']) ? intval($body['voterId']) : 0;
        $discussionId = isset($body['discussionId']) ? intval($body['discussionId']) : 0;
        $vote = isset($body['vote']) ? ($body['vote'] ? 1 : 0) : null;

        if (!$voterId || !$discussionId || $vote === null) {
            echo json_encode(["success" => false, "error" => "missing_parameters"]);
            exit;
        }

        // Check if user has downloaded the item
        $itemCheck = $mysqli->prepare(
            "SELECT i.ItemID FROM Discussion d 
            JOIN Item i ON d.ItemID = i.ItemID 
            WHERE d.DiscussionID = ?"
        );
        $itemCheck->bind_param('i', $discussionId);
        $itemCheck->execute();
        $itemResult = $itemCheck->get_result();
        $itemRow = $itemResult->fetch_assoc();
        
        if ($itemRow) {
            $downloadCheck = $mysqli->prepare(
                "SELECT 1 FROM Download WHERE DownloaderID = ? AND ItemID = ? LIMIT 1"
            );
            $downloadCheck->bind_param('ii', $voterId, $itemRow['ItemID']);
            $downloadCheck->execute();
            $downloadResult = $downloadCheck->get_result();
            
            if (!$downloadResult || !$downloadResult->fetch_assoc()) {
                echo json_encode(["success" => false, "error" => "must_download_item"]);
                exit;
            }
        }

        $check = $mysqli->prepare(
            "SELECT 1 
            FROM DiscussionVote dv 
            WHERE dv.VoterID = ? AND dv.DiscussionID = ? 
            LIMIT 1"
        );
        $check->bind_param('ii', $voterId, $discussionId);
        $check->execute();
        $resCheck = $check->get_result();
        if ($resCheck && $resCheck->fetch_assoc()) {
            echo json_encode(["success" => false, "error" => "already_voted"]);
            exit;
        }

        $ins = $mysqli->prepare(
            "INSERT INTO DiscussionVote (VoterID, DiscussionID, Vote, Date) 
            VALUES (?, ?, ?, NOW())"
        );
        $ins->bind_param('iii', $voterId, $discussionId, $vote);
        $ok = $ins->execute();
        if (!$ok) throw new Exception($mysqli->error);

        echo json_encode(["success" => true]);
        exit;
    }

    echo json_encode(["success" => false, "error" => "unsupported_method"]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
