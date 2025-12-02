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

    // verification if right member
    $mstmt = $mysqli->prepare(
        "SELECT ORCID 
        FROM Member 
        WHERE MemberID = ? 
        LIMIT 1"
    );
    if (!$mstmt) throw new Exception($mysqli->error);
    $mstmt->bind_param('i', $memberId);
    $mstmt->execute();
    $mres = $mstmt->get_result();
    $mrow = $mres->fetch_assoc();
    $memberOrcid = $mrow ? $mrow['ORCID'] : null;
    if (!$memberOrcid) {
        echo json_encode(["success" => false, "error" => "member_orcid_missing"]);
        exit;
    }

    $istmt = $mysqli->prepare(
        "SELECT AuthorID, Status 
        FROM Item 
        WHERE ItemID = ? 
        LIMIT 1"
    );
    if (!$istmt) throw new Exception($mysqli->error);
    $istmt->bind_param('i', $itemId);
    $istmt->execute();
    $ires = $istmt->get_result();
    $irow = $ires->fetch_assoc();
    if (!$irow) {
        echo json_encode(["success" => false, "error" => "item_not_found"]);
        exit;
    }

    $authorOrcid = isset($irow['AuthorID']) ? $irow['AuthorID'] : null;
    if ($authorOrcid !== $memberOrcid) {
        echo json_encode(["success" => false, "error" => "not_author"]);
        exit;
    }

    $upd = $mysqli->prepare(
        "UPDATE Item 
        SET Status = 'Deleted (Author)' 
        WHERE ItemID = ?"
    );
    if (!$upd) throw new Exception($mysqli->error);
    $upd->bind_param('i', $itemId);
    $ok = $upd->execute();
    if (!$ok) throw new Exception($mysqli->error ?: $upd->error);

    echo json_encode(["success" => true]);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
