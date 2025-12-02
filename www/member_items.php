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

$orcid = isset($_GET['orcid']) ? trim($_GET['orcid']) : '';
if ($orcid === '') {
    echo json_encode(["success" => false, "error" => "Missing orcid"]);
    exit;
}

$sql = "SELECT
    i.ItemID,
    i.Title,
    i.UploadDate,
    i.ParentTitleID,
    COALESCE(d.DownloadCount, 0) AS DownloadCount,
    COALESCE(don.TotalDonations, 0) AS TotalDonations
    FROM Item i
    LEFT JOIN (
        SELECT ItemID, COUNT(*) AS DownloadCount FROM Download GROUP BY ItemID
    ) d ON i.ItemID = d.ItemID
    LEFT JOIN (
        SELECT ItemID, SUM(Amount) AS TotalDonations FROM Donation GROUP BY ItemID
    ) don ON i.ItemID = don.ItemID
    WHERE i.AuthorID = ? AND i.Status NOT IN ('Removed', 'Under Review (Upload)', 'Deleted (Author)')";

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "step" => "prepare", "sql" => $sql, "error" => $mysqli->error]);
    exit;
}

$stmt->bind_param('s', $orcid);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "step" => "execute", "sql" => $sql, "error" => $stmt->error]);
    $stmt->close();
    exit;
}

$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $r['DownloadCount'] = isset($r['DownloadCount']) ? intval($r['DownloadCount']) : 0;
    $r['TotalDonations'] = isset($r['TotalDonations']) ? floatval($r['TotalDonations']) : 0.0;
    $r['ParentTitleID'] = isset($r['ParentTitleID']) && $r['ParentTitleID'] !== null ? (int)$r['ParentTitleID'] : null;
    $r['ItemID'] = isset($r['ItemID']) ? (int)$r['ItemID'] : null;
    $rows[] = $r;
}

$stmt->close();
$mysqli->close();

echo json_encode($rows);

?>