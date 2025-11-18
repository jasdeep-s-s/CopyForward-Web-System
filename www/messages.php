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
        "errno"   => $mysqli->connect_errno,
        "host"    => $dbHost,
        "db"      => $dbName,
        "user"    => $dbUser,
        "port"    => $dbPort
    ]);
    exit;
}

$email    = trim($_GET['email'] ?? "");
$memberId = isset($_GET['memberId']) ? intval($_GET['memberId']) : 0;
$view     = $_GET['view'] ?? "received";

if ($memberId === 0) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            "success" => false,
            "step"    => "email_check",
            "error"   => "Invalid or missing email"
        ]);
        exit;
    }

    $sql = "SELECT MemberID FROM Member WHERE PrimaryEmail = ? LIMIT 1";
    $stmt = $mysqli->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "step"    => "prepare_member",
            "sql"     => $sql,
            "error"   => $mysqli->error
        ]);
        exit;
    }

    $stmt->bind_param("s", $email);

    if (!$stmt->execute()) {
        echo json_encode([
            "success" => false,
            "step"    => "exec_member",
            "sql"     => $sql,
            "error"   => $stmt->error
        ]);
        $stmt->close();
        exit;
    }

    $stmt->bind_result($resolvedId);
    if ($stmt->fetch()) {
        $memberId = (int)$resolvedId;
    } else {
        echo json_encode([
            "success"  => true,
            "memberId" => 0,
            "messages" => []
        ]);
        $stmt->close();
        exit;
    }

    $stmt->close();
}

if ($memberId <= 0) {
    echo json_encode([
        "success" => false,
        "step"    => "memberId_invalid",
        "error"   => "Could not resolve a valid MemberID"
    ]);
    exit;
}

if ($view === "received") {
    $sql = "
        SELECT 
            s.PrimaryEmail AS PeerEmail,
            p.Message,
            p.Date,
            'received' AS Direction
        FROM PrivateMessage p
        LEFT JOIN Member s ON p.SenderID = s.MemberID
        WHERE p.ReceiverID = ?
        ORDER BY p.Date DESC
    ";
} else {
    $sql = "
        SELECT 
            r.PrimaryEmail AS PeerEmail,
            p.Message,
            p.Date,
            'sent' AS Direction
        FROM PrivateMessage p
        LEFT JOIN Member r ON p.ReceiverID = r.MemberID
        WHERE p.SenderID = ?
        ORDER BY p.Date DESC
    ";
}

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "step"    => "prepare_messages",
        "sql"     => $sql,
        "error"   => $mysqli->error
    ]);
    exit;
}

$stmt->bind_param("i", $memberId);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "step"    => "exec_messages",
        "sql"     => $sql,
        "error"   => $stmt->error
    ]);
    $stmt->close();
    exit;
}

$stmt->bind_result($peerEmail, $message, $date, $direction);

$messages = [];
while ($stmt->fetch()) {
    $messages[] = [
        "PeerEmail" => $peerEmail,
        "Message"   => $message,
        "Date"      => $date,
        "Direction" => $direction
    ];
}

$stmt->close();
$mysqli->close();

echo json_encode([
    "success"  => true,
    "memberId" => $memberId,
    "view"     => $view,
    "messages" => $messages
]);
