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
    $data = $raw ? json_decode($raw, true) : [];
    $memberId = isset($data['memberId']) ? intval($data['memberId']) : 0;
    $committeeId = isset($data['committeeId']) ? intval($data['committeeId']) : 0;

    if (!$memberId || !$committeeId) {
        echo json_encode(["success" => false, "error" => "missing_params"]);
        exit;
    }

    $check = $mysqli->prepare(
        "SELECT Approved 
        FROM MemberCommittee 
        WHERE MemberID = ? AND CommitteeID = ? 
        LIMIT 1"
    );
    if (!$check) throw new Exception($mysqli->error);
    $check->bind_param('ii', $memberId, $committeeId);
    $check->execute();
    $cres = $check->get_result();
    if ($row = $cres->fetch_assoc()) {
        echo json_encode(["success" => true, "note" => ($row['Approved'] ? 'already_member' : 'already_requested')]);
        exit;
    }

    $ins = $mysqli->prepare(
        "INSERT INTO MemberCommittee (MemberID, CommitteeID, Approved) 
        VALUES (?, ?, 0)"
    );
    if (!$ins) throw new Exception($mysqli->error);
    $ins->bind_param('ii', $memberId, $committeeId);
    if (!$ins->execute()) throw new Exception($ins->error);

    echo json_encode(["success" => true, "note" => "requested"]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
