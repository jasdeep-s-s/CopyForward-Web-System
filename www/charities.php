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
    echo json_encode(["success"=>false, "error"=>$mysqli->connect_error]);
    exit;
}

$sql = "SELECT ChildrenCharityID, Name FROM ChildrenCharity WHERE Approved = 1 ORDER BY Name";
$res = $mysqli->query($sql);
$out = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $out[] = [ 'id' => intval($row['ChildrenCharityID']), 'name' => $row['Name'] ];
    }
    $res->free();
}

$mysqli->close();
echo json_encode($out);

?>
