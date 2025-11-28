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
    $orcid = isset($data['orcid']) ? trim($data['orcid']) : '';
    if (!$memberId || !$orcid) {
        echo json_encode(["success" => false, "error" => "missing_params"]);
        exit;
    }

    if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{4}$/', $orcid)) {
        echo json_encode(["success" => false, "error" => "invalid_orcid_format"]);
        exit;
    }

    $check = $mysqli->prepare(
        "SELECT MemberID 
        FROM Member 
        WHERE ORCID = ? 
        LIMIT 1"
    );
    if (!$check) throw new Exception($mysqli->error);
    $check->bind_param('s', $orcid);
    $check->execute();
    $cres = $check->get_result();
    if ($crow = $cres->fetch_assoc()) {
        $existingId = intval($crow['MemberID']);
        if ($existingId !== $memberId) {
            echo json_encode(["success" => false, "error" => "orcid_in_use"]);
            exit;
        }
    }

    $stmt = $mysqli->prepare(
        "UPDATE Member
        SET ORCID = ?, Role = 'Author'
        WHERE MemberID = ?"
    );
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('si', $orcid, $memberId);
    $stmt->execute();
    echo json_encode(["success" => true]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
