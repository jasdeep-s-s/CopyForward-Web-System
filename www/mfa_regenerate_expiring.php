<?php
//by Tudor Cosmin Suciu 40179863

// Regenerate MFA matrices expiring within 48 hours and notify affected users.
header('Content-Type: application/json');

require __DIR__ . '/db.php';

$now       = new DateTimeImmutable('now');
$soon      = $now->modify('+48 hours')->format('Y-m-d H:i:s');
$nowStr    = $now->format('Y-m-d H:i:s');
$newExpiry = $now->modify('+10 days')->format('Y-m-d H:i:s');

function generate_matrix_plain()
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out   = '';
    for ($i = 0; $i < 25; $i++) {
        $out .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $out;
}

function format_matrix_blocks($matrixPlain)
{
    $chunks = str_split($matrixPlain, 5);
    return implode(' ', $chunks);
}

// find distinct users with a matrix expiring within 48h OR already expired
$stmt = $mysqli->prepare(
    'SELECT DISTINCT UserID FROM MFAMatrix WHERE ExpiryDate <= ? OR ExpiryDate BETWEEN ? AND ?'
);
$stmt->bind_param('sss', $nowStr, $nowStr, $soon);
$stmt->execute();
$res = $stmt->get_result();
$users = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
$stmt->close();

if (!$users) {
    echo json_encode(['success' => true, 'regenerated' => 0]);
    exit;
}

$pmDate = $nowStr;
$count  = 0;

foreach ($users as $u) {
    $uid = (int)$u['UserID'];
    $plain = generate_matrix_plain();
    $formatted = format_matrix_blocks($plain);

    // update latest matrix row
    $updateStmt = $mysqli->prepare(
        'UPDATE MFAMatrix
         SET Matrix = ?, ExpiryDate = ?, CreationDate = ?, recentlyUpdated = 1
         WHERE UserID = ?
         ORDER BY CreationDate DESC
         LIMIT 1'
    );
    $updateStmt->bind_param('sssi', $plain, $newExpiry, $nowStr, $uid);
    if (!$updateStmt->execute()) {
        $updateStmt->close();
        continue;
    }
    $updateStmt->close();

    // notify user
    $pmStmt = $mysqli->prepare(
        'INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message) VALUES (NULL, ?, ?, ?)'
    );
    $msg = "Your security matrix has been renewed (expires in 10 days):\n{$formatted}";
    $pmStmt->bind_param('iss', $uid, $pmDate, $msg);
    if ($pmStmt->execute()) {
        $count++;
    }
    $pmStmt->close();
}

echo json_encode(['success' => true, 'regenerated' => $count]);

?>
