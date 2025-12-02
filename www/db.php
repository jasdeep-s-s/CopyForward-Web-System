<?php
// by Tudor Cosmin Suciu, 40179863

// DB Credentials
// for local DB:
//      host = database
//      user = docker
//      password = docker
// for AITS:
//      host = ovc353.encs.concordia.ca
//      user = ovc353_2
//      password = darkjade89

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

$mysqli->set_charset('utf8mb4');

?>