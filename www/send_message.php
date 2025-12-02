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
    echo json_encode([
        "success" => false,
        "step"    => "db_connect",
        "error"   => $mysqli->connect_error,
        "errno"   => $mysqli->connect_errno
    ]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$senderId = isset($data['senderId']) ? intval($data['senderId']) : 0;
$toEmail  = isset($data['toEmail']) ? trim($data['toEmail']) : "";
$message  = isset($data['message']) ? trim($data['message']) : "";

if ($senderId <= 0 || !$toEmail || !$message) {
    echo json_encode([
        "success" => false,
        "step"    => "validate_input",
        "error"   => "Missing senderId, toEmail, or message."
    ]);
    exit;
}

if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "step"    => "validate_email",
        "error"   => "Invalid recipient email."
    ]);
    exit;
}

$sql = "SELECT MemberID FROM Member WHERE PrimaryEmail = ? LIMIT 1";
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "step"    => "prepare_receiver",
        "sql"     => $sql,
        "error"   => $mysqli->error
    ]);
    exit;
}

$stmt->bind_param("s", $toEmail);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "step"    => "exec_receiver",
        "sql"     => $sql,
        "error"   => $stmt->error
    ]);
    $stmt->close();
    exit;
}

$stmt->bind_result($receiverId);
if (!$stmt->fetch()) {
    $stmt->close();
    echo json_encode([
        "success" => false,
        "step"    => "no_receiver",
        "error"   => "No member found with that email."
    ]);
    exit;
}
$stmt->close();

$sql =
    "INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message)
    VALUES (?, ?, NOW(), ?)";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "step"    => "prepare_insert",
        "sql"     => $sql,
        "error"   => $mysqli->error
    ]);
    exit;
}

$stmt->bind_param("iis", $senderId, $receiverId, $message);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "step"    => "exec_insert",
        "sql"     => $sql,
        "error"   => $stmt->error
    ]);
    $stmt->close();
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode([
    "success"   => true,
    "insertId"  => null,
    "senderId"  => $senderId,
    "receiverId"=> $receiverId
]);
