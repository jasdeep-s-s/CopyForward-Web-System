<?php
// by Tudor Cosmin Suciu, 40179863

$dbHost = getenv('MYSQL_HOST') ?: 'database';
$dbUser = getenv('MYSQL_USER') ?: 'root';
$dbPass = getenv('MYSQL_PASSWORD') ?: 'tiger';
$dbName = getenv('MYSQL_DATABASE') ?: 'ovc353_2';
$dbPort = getenv('MYSQL_PORT') ?: 3306;

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
if ($mysqli->connect_errno) {
    echo json_encode(["success" => false, "error" => $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset('utf8mb4');

?>