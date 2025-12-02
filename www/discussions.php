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
    echo json_encode(["success" => false, "step" => "db_connect", "error" => $mysqli->connect_error]);
    exit;
}

$itemId = isset($_GET['item']) ? intval($_GET['item']) : 0;
$memberId = isset($_GET['member']) ? intval($_GET['member']) : 0;

try {
    if (!$itemId || !$memberId) {
        echo json_encode([]);
        exit;
    }

    $sql = "SELECT DISTINCT d.DiscussionID, COALESCE(c.Name, 'Unknown') AS Name, COALESCE(c.Description, '') AS Description, d.Subject, d.VoteActive, d.VotingDeadline, d.Status, COALESCE(c.CommitteeID, 0) AS CommitteeID
        FROM Discussion d
        LEFT JOIN Committee c ON d.CommitteeID = c.CommitteeID
        LEFT JOIN MemberCommittee mc ON c.CommitteeID = mc.CommitteeID
        WHERE d.ItemID = ? AND
        ((c.CommitteeID = 2 AND mc.MemberID = ? AND mc.Approved = 1) OR
        (c.CommitteeID = 1 AND EXISTS(SELECT 1 FROM `Download` dd WHERE dd.DownloaderID = ? AND dd.ItemID = ?) OR (c.CommitteeID = 1 AND mc.MemberID = ? AND mc.Approved = 1)) OR
        (c.CommitteeID NOT IN (1,2) AND mc.MemberID = ? AND mc.Approved = 1))";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('iiiii', $itemId, $memberId, $memberId, $itemId, $memberId);
    if (!$stmt->execute()) throw new Exception($stmt->error ?: $mysqli->error);
    $res = $stmt->get_result();

    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $r['VoteActive'] = isset($r['VoteActive']) ? intval($r['VoteActive']) : 0;
        $r['VotingDeadline'] = isset($r['VotingDeadline']) ? $r['VotingDeadline'] : null;
        $r['Subject'] = isset($r['Subject']) ? $r['Subject'] : '';
        $r['Status'] = isset($r['Status']) ? $r['Status'] : '';
        $rows[] = $r;
    }

    echo json_encode($rows);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
