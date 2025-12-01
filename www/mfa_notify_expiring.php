<?php
//by Tudor Cosmin Suciu 40179863

// Triggering this endpoint will check and notify moderators about MFA matrices expiring within 48h.
header('Content-Type: application/json');

require __DIR__ . '/db.php';

$now      = new DateTimeImmutable('now');
$soon     = $now->modify('+48 hours')->format('Y-m-d H:i:s');
$nowStr   = $now->format('Y-m-d H:i:s');

$stmt = $mysqli->prepare(
    'SELECT UserID, ExpiryDate, CreationDate FROM MFAMatrix WHERE ExpiryDate BETWEEN ? AND ?'
);
$stmt->bind_param('ss', $nowStr, $soon);
$stmt->execute();
$res = $stmt->get_result();
$expiring = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
$stmt->close();

if (!$expiring) {
    echo json_encode(['success' => true, 'notified' => 0]);
    exit;
}

$modsRes = $mysqli->query("SELECT MemberID FROM Member WHERE Role = 'Moderator'");
$modIds  = $modsRes ? $modsRes->fetch_all(MYSQLI_ASSOC) : [];

if (!$modIds) {
    echo json_encode(['success' => false, 'error' => 'No moderators found']);
    exit;
}

$pmStmt = $mysqli->prepare(
    'INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message) VALUES (NULL, ?, ?, ?)'
);
$pmDate = $now->format('Y-m-d H:i:s');
$notified = 0;

foreach ($expiring as $row) {
    $msg = sprintf(
        "MFA matrix for MemberID %d expires on %s. Please regenerate if appropriate.",
        $row['UserID'],
        $row['ExpiryDate']
    );
    foreach ($modIds as $mod) {
        $pmStmt->bind_param('iss', $mod['MemberID'], $pmDate, $msg);
        if ($pmStmt->execute()) {
            $notified++;
        }
    }
}
$pmStmt->close();

echo json_encode(['success' => true, 'notified' => $notified]);

?>
