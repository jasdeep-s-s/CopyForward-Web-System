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
    echo json_encode([
        "success" => false,
        "step"    => "db_connect",
        "error"   => $mysqli->connect_error,
        "errno"   => $mysqli->connect_errno
    ]);
    exit;
}

$memberId = 0;
if (isset($_GET['member'])) {
    $memberId = intval($_GET['member']);
} else {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (isset($json['member'])) $memberId = intval($json['member']);
}

if ($memberId <= 0) {
    echo json_encode(["success" => false, "step" => "validate", "error" => "Missing member id"]);
    exit;
}

$sql = "SELECT ORCID FROM Member WHERE MemberID = ? LIMIT 1";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare_fetch_orcid", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('i', $memberId);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "exec_fetch_orcid", "error" => $stmt->error]);
    $stmt->close();
    exit;
}

$stmt->bind_result($orcid);
$foundOrcid = $stmt->fetch();
$stmt->close();

$hasRecentAuthorUpload = false;
if ($foundOrcid && $orcid) {
    $sql = "SELECT 1 FROM Item WHERE AuthorID = ? AND UploadDate >= NOW() - INTERVAL 1 YEAR LIMIT 1";
    $stmt2 = $mysqli->prepare($sql);
    if ($stmt2) {
        $stmt2->bind_param('s', $orcid);
        if ($stmt2->execute()) {
            $stmt2->store_result();
            $hasRecentAuthorUpload = $stmt2->num_rows > 0;
        }
        $stmt2->close();
    }
}

$windowDays = $hasRecentAuthorUpload ? 1 : 7;

$cutoff = date('Y-m-d H:i:s', strtotime("-{$windowDays} days"));
$sql2 = "SELECT COUNT(*) as cnt, MAX(Date) as lastDate FROM Download d WHERE d.DownloaderID = ? AND d.Date >= ?";
$stmt2 = $mysqli->prepare($sql2);
if (!$stmt2) {
    echo json_encode(["success" => false, "step" => "prepare_check_downloads", "sql" => $sql2, "error" => $mysqli->error]);
    exit;
}

$stmt2->bind_param('is', $memberId, $cutoff);
if (!$stmt2->execute()) {
    echo json_encode(["success" => false, "step" => "exec_check_downloads", "error" => $stmt2->error]);
    $stmt2->close();
    exit;
}

$res = $stmt2->get_result();
$row = $res->fetch_assoc();
$count = intval($row['cnt'] ?? 0);
$lastDate = $row['lastDate'] ?? null;
$stmt2->close();

$allowed = $count === 0;

echo json_encode([
    "success" => true,
    "memberId" => $memberId,
    "hasRecentAuthorUpload" => $hasRecentAuthorUpload,
    "window_days" => $windowDays,
    "downloads_in_window" => $count,
    "last_download_date" => $lastDate,
    "allowed" => $allowed
]);

$mysqli->close();

?>
