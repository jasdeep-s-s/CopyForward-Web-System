<?php
// by Tudor Cosmin Suciu 40179863

// Shared MFA utilities

//Generate a random 25-character MFA matrix string using unambiguous characters.

function mfa_generate_plain($length = 25)
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out   = '';
    for ($i = 0; $i < $length; $i++) {
        $out .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $out;
}


//Format a matrix into 5-character blocks for readability.

function mfa_format_matrix($matrixPlain)
{
    $chunks = str_split($matrixPlain, 5);
    return implode(' ', $chunks);
}


//Create and persist a new MFA matrix row for a user.

function mfa_create_matrix_for_user(mysqli $mysqli, int $userId, DateTimeImmutable $expiryDate)
{
    $matrix     = mfa_generate_plain();
    $expiryStr  = $expiryDate->format('Y-m-d H:i:s');
    $createdStr = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'INSERT INTO MFAMatrix (UserID, ExpiryDate, CreationDate, Matrix, recentlyUpdated) VALUES (?, ?, ?, ?, 1)'
    );
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('isss', $userId, $expiryStr, $createdStr, $matrix);
    if (!$stmt->execute()) {
        $stmt->close();
        return null;
    }
    $matrixId = $mysqli->insert_id;
    $stmt->close();

    return [
        'userId'    => $userId,
        'matrixId'  => $matrixId,
        'matrix'    => $matrix,
        'formatted' => mfa_format_matrix($matrix),
        'expiry'    => $expiryStr,
        'created'   => $createdStr,
    ];
}

/**
 * Fetch the latest matrix id for a user.
 */
function mfa_latest_matrix_id(mysqli $mysqli, int $userId)
{
    $stmt = $mysqli->prepare(
        'SELECT MFAMatrixID FROM MFAMatrix WHERE UserID = ? ORDER BY CreationDate DESC LIMIT 1'
    );
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();

    if (!$row) {
        return null;
    }

    return (int)$row['MFAMatrixID'];
}

/**
 * Regenerate a matrix by matrix id. Returns matrix details or null on failure.
 */
function mfa_regenerate_by_matrix_id(mysqli $mysqli, int $matrixId, DateTimeImmutable $expiryDate)
{
    $lookup = $mysqli->prepare('SELECT UserID FROM MFAMatrix WHERE MFAMatrixID = ?');
    if (!$lookup) {
        return null;
    }
    $lookup->bind_param('i', $matrixId);
    $lookup->execute();
    $res = $lookup->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $lookup->close();

    if (!$row) {
        return null;
    }

    $userId = (int)$row['UserID'];
    return mfa_regenerate_latest_for_user($mysqli, $userId, $expiryDate, $matrixId);
}

/**
 * Regenerate the latest matrix for a user (or a specific matrix id if provided).
 * Marks the row as recentlyUpdated to be picked up by mfa_status.
 */
function mfa_regenerate_latest_for_user(mysqli $mysqli, int $userId, DateTimeImmutable $expiryDate, $matrixId = null)
{
    $targetMatrixId = $matrixId ?? mfa_latest_matrix_id($mysqli, $userId);
    if (!$targetMatrixId) {
        // If the user has no matrix yet, create one instead of failing.
        return mfa_create_matrix_for_user($mysqli, $userId, $expiryDate);
    }

    $matrix     = mfa_generate_plain();
    $expiryStr  = $expiryDate->format('Y-m-d H:i:s');
    $createdStr = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'UPDATE MFAMatrix
         SET Matrix = ?, ExpiryDate = ?, CreationDate = ?, recentlyUpdated = 1
         WHERE MFAMatrixID = ?'
    );
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('sssi', $matrix, $expiryStr, $createdStr, $targetMatrixId);
    if (!$stmt->execute()) {
        $stmt->close();
        return null;
    }
    $stmt->close();

    return [
        'userId'    => $userId,
        'matrixId'  => $targetMatrixId,
        'matrix'    => $matrix,
        'formatted' => mfa_format_matrix($matrix),
        'expiry'    => $expiryStr,
        'created'   => $createdStr,
    ];
}

/**
 * Notify a user that their matrix was regenerated.
 */
function mfa_notify_user_regenerated(mysqli $mysqli, int $userId, $formattedMatrix, $expiryDate, DateTimeImmutable $now)
{
    $pmStmt = $mysqli->prepare(
        'INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message) VALUES (NULL, ?, ?, ?)'
    );
    if (!$pmStmt) {
        return false;
    }
    $msg = "Your security matrix has been renewed (expires on {$expiryDate}):\n{$formattedMatrix}";
    $pmDate = $now->format('Y-m-d H:i:s');
    $pmStmt->bind_param('iss', $userId, $pmDate, $msg);
    $ok = $pmStmt->execute();
    $pmStmt->close();
    return $ok;
}

/**
 * Get moderator member ids.
 */
function mfa_get_moderator_ids(mysqli $mysqli)
{
    $modsRes = $mysqli->query("SELECT MemberID FROM Member WHERE Role = 'Moderator'");
    if (!$modsRes) {
        return [];
    }
    $rows = $modsRes->fetch_all(MYSQLI_ASSOC);
    return array_map(function ($row) {
        return (int)$row['MemberID'];
    }, $rows);
}

/**
 * Notify moderators about matrices expiring within a window (default 48h).
 */
function mfa_notify_mods_about_expiring(mysqli $mysqli, DateTimeImmutable $now, $hoursAhead = 48)
{
    $soon    = $now->modify('+' . (int)$hoursAhead . ' hours')->format('Y-m-d H:i:s');
    $nowStr  = $now->format('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'SELECT UserID, ExpiryDate, CreationDate FROM MFAMatrix WHERE ExpiryDate BETWEEN ? AND ?'
    );
    if (!$stmt) {
        return ['success' => false, 'notified' => 0, 'error' => 'Failed to prepare expiring query'];
    }
    $stmt->bind_param('ss', $nowStr, $soon);
    $stmt->execute();
    $res = $stmt->get_result();
    $expiring = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    if (!$expiring) {
        return ['success' => true, 'notified' => 0, 'expiring' => 0];
    }

    $modIds = mfa_get_moderator_ids($mysqli);
    if (!$modIds) {
        return ['success' => false, 'notified' => 0, 'error' => 'No moderators found', 'expiring' => count($expiring)];
    }

    $pmStmt = $mysqli->prepare(
        'INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message) VALUES (NULL, ?, ?, ?)'
    );
    if (!$pmStmt) {
        return ['success' => false, 'notified' => 0, 'error' => 'Unable to prepare notification insert'];
    }

    $pmDate = $now->format('Y-m-d H:i:s');
    $notified = 0;

    foreach ($expiring as $row) {
        $msg = sprintf(
            "MFA matrix for MemberID %d expires on %s. Please regenerate if appropriate.",
            $row['UserID'],
            $row['ExpiryDate']
        );
        foreach ($modIds as $modId) {
            $pmStmt->bind_param('iss', $modId, $pmDate, $msg);
            if ($pmStmt->execute()) {
                $notified++;
            }
        }
    }
    $pmStmt->close();

    return ['success' => true, 'notified' => $notified, 'expiring' => count($expiring)];
}

/**
 * Regenerate matrices for users whose matrices expire within a window or are already expired.
 */
function mfa_regenerate_expiring_users(mysqli $mysqli, DateTimeImmutable $now, $hoursAhead = 48, $renewInterval = '+30 days')
{
    $soon   = $now->modify('+' . (int)$hoursAhead . ' hours')->format('Y-m-d H:i:s');
    $nowStr = $now->format('Y-m-d H:i:s');

    $stmt = $mysqli->prepare(
        'SELECT DISTINCT UserID FROM MFAMatrix WHERE ExpiryDate <= ? OR ExpiryDate BETWEEN ? AND ?'
    );
    if (!$stmt) {
        return ['success' => false, 'regenerated' => 0, 'error' => 'Failed to prepare expiring user query'];
    }
    $stmt->bind_param('sss', $nowStr, $nowStr, $soon);
    $stmt->execute();
    $res = $stmt->get_result();
    $users = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    if (!$users) {
        return ['success' => true, 'regenerated' => 0];
    }

    $newExpiry = $now->modify($renewInterval);
    $count  = 0;

    foreach ($users as $u) {
        $uid = (int)$u['UserID'];
        $regenerated = mfa_regenerate_latest_for_user($mysqli, $uid, $newExpiry);
        if (!$regenerated) {
            continue;
        }
        if (mfa_notify_user_regenerated($mysqli, $uid, $regenerated['formatted'], $regenerated['expiry'], $now)) {
            $count++;
        }
    }

    return ['success' => true, 'regenerated' => $count, 'users' => count($users)];
}

