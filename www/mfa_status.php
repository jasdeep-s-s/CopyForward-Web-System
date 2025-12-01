<?php
// by Tudor Cosmin Suciu, 40179863

// Return MFA matrix status for the logged-in user if recently updated.
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

require __DIR__ . '/db.php';

$uid = (int)$_SESSION['member_id'];
$stmt = $mysqli->prepare('SELECT Matrix, ExpiryDate, CreationDate, recentlyUpdated FROM MFAMatrix WHERE UserID = ? ORDER BY CreationDate DESC LIMIT 1');
$stmt->bind_param('i', $uid);
$stmt->execute();
$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;
$stmt->close();

if (!$row || !$row['recentlyUpdated']) {
    echo json_encode(['success' => true, 'pending' => false]);
    exit;
}

echo json_encode([
    'success' => true,
    'pending' => true,
    'matrix'  => $row['Matrix'],
    'expiry'  => $row['ExpiryDate'],
    'created' => $row['CreationDate']
]);
?>
