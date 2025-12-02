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
    $stmt = $mysqli->prepare(
        "SELECT CommitteeID, Name, Description 
        FROM Committee 
        ORDER BY Name ASC");
    if (!$stmt) throw new Exception($mysqli->error);
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
