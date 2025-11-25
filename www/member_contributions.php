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
    $member = isset($_GET['member']) ? intval($_GET['member']) : 0;
    if (!$member) {
        echo json_encode(["success" => false, "error" => "missing_member"]);
        exit;
    }

    $stmt = $mysqli->prepare(
        "SELECT i.Title AS ItemTitle, d.Amount AS Amount, d.Date AS DonationDate
         FROM Donation d
         LEFT JOIN Item i ON d.ItemID = i.ItemID
         WHERE d.DonatorID = ?
         ORDER BY d.Date DESC"
    );
    if (!$stmt) throw new Exception($mysqli->error);
    $stmt->bind_param('i', $member);
    $stmt->execute();
    $res = $stmt->get_result();
    $out = [];
    while ($row = $res->fetch_assoc()) {
        $out[] = $row;
    }
    echo json_encode($out);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
