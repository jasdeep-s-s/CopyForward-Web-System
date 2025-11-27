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
        echo json_encode([]);
        exit;
    }

    $sql = "SELECT COALESCE(m.Username, 'Unknown') AS Username, dm.Message, dm.Date
        FROM DiscussionMessage dm
        LEFT JOIN Member m ON dm.SenderID = m.MemberID
        WHERE dm.DiscussionID = $discussionId
        ORDER BY dm.Date ASC";

    $res = $mysqli->query($sql);
    if (!$res) throw new Exception($mysqli->error);

    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $r['Message'] = isset($r['Message']) ? $r['Message'] : '';
        $r['Date'] = isset($r['Date']) ? $r['Date'] : null;
        $r['Username'] = isset($r['Username']) ? $r['Username'] : 'Unknown';
        $rows[] = $r;
    }

    echo json_encode($rows);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
