<?php
// Moderator MFA Matrix Management API
// by Jasdeep S. Sandhu, 40266557

session_start();
header('Content-Type: application/json');

require __DIR__ . '/db.php';

// Check if user is logged in and is a moderator
$memberId = $_SESSION['member_id'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$memberId || $role !== 'Moderator') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied. Moderator access required.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

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

// PUT - Regenerate MFA matrix for a user
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $mfaMatrixId = $input['mfaMatrixId'] ?? null;
    
    if (!$mfaMatrixId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing mfaMatrixId']);
        exit;
    }
    
    // Generate new random 25-character matrix
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $newMatrix = '';
    for ($i = 0; $i < 25; $i++) {
        $newMatrix .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    // Set new expiry date (1 year from now)
    $newExpiryDate = date('Y-m-d H:i:s', strtotime('+1 year'));
    $creationDate = date('Y-m-d H:i:s');
    
    $stmt = $mysqli->prepare("UPDATE MFAMatrix SET Matrix = ?, ExpiryDate = ?, CreationDate = ? WHERE MFAMatrixID = ?");
    $stmt->bind_param('sssi', $newMatrix, $newExpiryDate, $creationDate, $mfaMatrixId);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true, 
            'newMatrix' => $newMatrix,
            'newExpiryDate' => $newExpiryDate
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// POST - Create new MFA matrix for a user
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['userId'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing userId']);
        exit;
    }
    
    // Generate random 25-character matrix
    $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $matrix = '';
    for ($i = 0; $i < 25; $i++) {
        $matrix .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    $expiryDate = date('Y-m-d H:i:s', strtotime('+1 year'));
    $creationDate = date('Y-m-d H:i:s');
    
    $stmt = $mysqli->prepare("INSERT INTO MFAMatrix (UserID, ExpiryDate, CreationDate, Matrix) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('isss', $userId, $expiryDate, $creationDate, $matrix);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'mfaMatrixId' => $mysqli->insert_id,
            'matrix' => $matrix,
            'expiryDate' => $expiryDate
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
