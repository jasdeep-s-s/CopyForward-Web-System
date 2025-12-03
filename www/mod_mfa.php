<?php
// Moderator MFA Matrix Management API
// by Jasdeep S. Sandhu, 40266557
// and Tudor Cosmin Suciu 40179863

session_start();
header('Content-Type: application/json');

require __DIR__ . '/db.php';
require_once __DIR__ . '/mfa_lib.php';

$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true) ?: [];
$override = $_POST['_method'] ?? ($input['_method'] ?? null);
$method = $override ? strtoupper($override) : $_SERVER['REQUEST_METHOD'];

// Check if user is logged in and is a moderator
$memberId = $_SESSION['member_id'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$memberId || $role !== 'Moderator') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied. Moderator access required.']);
    exit;
}

// GET - List all MFA matrices with member details
if ($method === 'GET') {
    $query = "SELECT mfa.*, m.Name, m.Username, m.PrimaryEmail,
              TIMESTAMPDIFF(HOUR, NOW(), mfa.ExpiryDate) as HoursUntilExpiry
              FROM MFAMatrix mfa
              JOIN Member m ON mfa.UserID = m.MemberID
              ORDER BY mfa.ExpiryDate ASC";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $matrices = [];
    while ($row = $result->fetch_assoc()) {
        $matrices[] = $row;
    }
    
    echo json_encode($matrices);
    exit;
}

// PUT - Regenerate MFA matrix for a user (by matrix id or user id)
if ($method === 'PUT') {
    $mfaMatrixId = $input['mfaMatrixId'] ?? null;
    $targetUserId = isset($input['userId']) ? (int)$input['userId'] : null;
    $notifyUser = array_key_exists('notifyUser', $input) ? (bool)$input['notifyUser'] : true; // default notify
    
    if (!$mfaMatrixId && !$targetUserId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing mfaMatrixId or userId']);
        exit;
    }
    
    $newExpiry   = new DateTimeImmutable('+30 days');
    $regenerated = $mfaMatrixId
        ? mfa_regenerate_by_matrix_id($mysqli, (int)$mfaMatrixId, $newExpiry)
        : mfa_regenerate_latest_for_user($mysqli, $targetUserId, $newExpiry);

    if (!$regenerated) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to regenerate matrix']);
        exit;
    }

    if ($targetUserId !== null) {
        $notifyUser = true; // ensure notifying when regenerating by user id
    }

    if ($notifyUser && isset($regenerated['userId'])) {
        mfa_notify_user_regenerated($mysqli, (int)$regenerated['userId'], $regenerated['formatted'], $regenerated['expiry'], new DateTimeImmutable('now'));
    }
    
    echo json_encode([
        'success'        => true, 
        'newMatrix'      => $regenerated['matrix'],
        'formatted'      => $regenerated['formatted'],
        'newExpiryDate'  => $regenerated['expiry'],
        'mfaMatrixId'    => $regenerated['matrixId'],
        'userId'         => $regenerated['userId'],
    ]);
    exit;
}

// POST - Create new MFA matrix for a user
if ($method === 'POST') {
    $userId = $input['userId'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing userId']);
        exit;
    }
    
    $created = mfa_create_matrix_for_user($mysqli, (int)$userId, new DateTimeImmutable('+30 days'));
    if (!$created) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create matrix']);
        exit;
    }
    
    echo json_encode([
        'success'     => true,
        'mfaMatrixId' => $created['matrixId'],
        'matrix'      => $created['matrix'],
        'formatted'   => $created['formatted'],
        'expiryDate'  => $created['expiry']
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
