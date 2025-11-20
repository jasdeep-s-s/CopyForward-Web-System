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
    echo json_encode([
        "success" => false,
        "step"    => "db_connect",
        "error"   => $mysqli->connect_error,
        "errno"   => $mysqli->connect_errno
    ]);
    exit;
}

$itemId = 0;
$memberId = 0;

$raw = file_get_contents('php://input');
$json = json_decode($raw, true);
if ($json) {
    if (isset($json['itemId'])) $itemId = intval($json['itemId']);
    if (isset($json['member'])) $memberId = intval($json['member']);
}

if ($itemId <= 0 && isset($_GET['item'])) $itemId = intval($_GET['item']);
if ($memberId <= 0 && isset($_GET['member'])) $memberId = intval($_GET['member']);

if ($itemId <= 0 || $memberId <= 0) {
    echo json_encode(["success" => false, "step" => "validate", "error" => "Missing itemId or member" ]);
    exit;
}

$sql = "INSERT INTO Download (ItemID, DownloaderID, Date) VALUES (?, ?, NOW())";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare_insert", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('ii', $itemId, $memberId);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "exec_insert", "error" => $stmt->error]);
    $stmt->close();
    exit;
}

$insertId = $stmt->insert_id;
$stmt->close();

echo json_encode([
    "success" => true,
    "downloadId" => $insertId,
    "itemId" => $itemId,
    "memberId" => $memberId
]);

$mysqli->close();

?>
