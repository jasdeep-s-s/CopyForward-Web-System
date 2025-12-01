<?php
// by Tudor Cosmin Suciu, 40179863

// Acknowledge the latest MFA matrix for the logged-in user.
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

require __DIR__ . '/db.php';

$uid = (int)$_SESSION['member_id'];

$stmt = $mysqli->prepare('UPDATE MFAMatrix SET recentlyUpdated = 0 WHERE UserID = ? ORDER BY CreationDate DESC LIMIT 1');
$stmt->bind_param('i', $uid);
if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to acknowledge matrix']);
}
$stmt->close();
?>
