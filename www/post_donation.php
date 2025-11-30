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
    echo json_encode(["success"=>false, "error"=>$mysqli->connect_error]);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$donatorId = isset($data['donatorId']) ? intval($data['donatorId']) : 0;
$itemId = isset($data['itemId']) ? intval($data['itemId']) : 0;
$charityId = isset($data['childrenCharityId']) ? intval($data['childrenCharityId']) : 0;
$amount = isset($data['amount']) ? intval($data['amount']) : 0;
$authorPercent = isset($data['authorPercent']) ? intval($data['authorPercent']) : null;
$childrenPercent = isset($data['childrenPercent']) ? intval($data['childrenPercent']) : null;
$cfpPercent = isset($data['cfpPercent']) ? intval($data['cfpPercent']) : null;

if ($donatorId <= 0 || $itemId <= 0 || $charityId <= 0 || $amount <= 0) {
    echo json_encode(["success"=>false, "error"=>"Missing or invalid parameters"]);
    exit;
}

if ($childrenPercent === null || $authorPercent === null || $cfpPercent === null) {
    echo json_encode(["success"=>false, "error"=>"Percentages required"]);
    exit;
}

$sum = $authorPercent + $childrenPercent + $cfpPercent;
if ($sum !== 100) {
    echo json_encode(["success"=>false, "error"=>"Percentages must sum to 100"]);
    exit;
}
if ($childrenPercent < 60) {
    echo json_encode(["success"=>false, "error"=>"Children charity percent must be at least 60"]);
    exit;
}

$stmt = $mysqli->prepare("SELECT MemberID FROM Member WHERE MemberID = ? LIMIT 1");
if (!$stmt) { echo json_encode(["success"=>false, "error"=>"prepare_member_failed"]); exit; }
$stmt->bind_param('i', $donatorId);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) { $stmt->close(); echo json_encode(["success"=>false, "error"=>"Donator not found"]); exit; }
$stmt->close();

$stmt = $mysqli->prepare("SELECT ItemID FROM Item WHERE ItemID = ? LIMIT 1");
if (!$stmt) { echo json_encode(["success"=>false, "error"=>"prepare_item_failed"]); exit; }
$stmt->bind_param('i', $itemId);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) { $stmt->close(); echo json_encode(["success"=>false, "error"=>"Item not found"]); exit; }
$stmt->close();

$stmt = $mysqli->prepare(
    "SELECT ChildrenCharityID 
    FROM ChildrenCharity 
    WHERE ChildrenCharityID = ? AND Approved = 1 
    LIMIT 1");
if (!$stmt) { echo json_encode(["success"=>false, "error"=>"prepare_charity_failed"]); exit; }
$stmt->bind_param('i', $charityId);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) { $stmt->close(); echo json_encode(["success"=>false, "error"=>"Charity not found or not approved"]); exit; }
$stmt->close();

$sql = "INSERT INTO Donation (DonatorID, ItemID, ChildrenCharityID, Amount, AuthorPercent, ChildrenCharityPercent, CFPPercent, Date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
$ins = $mysqli->prepare($sql);
if (!$ins) { echo json_encode(["success"=>false, "error"=>"prepare_insert_failed", "sql"=>$sql]); exit; }
$ins->bind_param('iiiiiii', $donatorId, $itemId, $charityId, $amount, $authorPercent, $childrenPercent, $cfpPercent);
if (!$ins->execute()) { $ins->close(); echo json_encode(["success"=>false, "error"=>"exec_insert_failed", "detail"=>$ins->error]); exit; }
$insertId = $ins->insert_id;
$ins->close();

$mysqli->close();
echo json_encode(["success"=>true, "donationId"=> $insertId]);

?>
