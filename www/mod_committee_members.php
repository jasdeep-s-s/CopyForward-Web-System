<?php
// Moderator Committee Members Management API
// by Jasdeep S. Sandhu, 40266557

session_start();
header('Content-Type: application/json');

require __DIR__ . '/db.php';

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

// GET - List members of a specific committee with approval status
if ($method === 'GET') {
    $committeeId = $_GET['committeeId'] ?? null;
    
    if (!$committeeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing committeeId']);
        exit;
    }
    
    $query = "SELECT mc.*, m.Name, m.Username, m.PrimaryEmail 
              FROM MemberCommittee mc 
              JOIN Member m ON mc.MemberID = m.MemberID
              WHERE mc.CommitteeID = ?
              ORDER BY mc.Approved DESC, m.Name";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $committeeId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $members = [];
    while ($row = $result->fetch_assoc()) {
        $members[] = $row;
    }
    
    echo json_encode($members);
    exit;
}

// PUT - Approve/Reject committee join request
if ($method === 'PUT') {
    $memberCommitteeId = $input['memberCommitteeId'] ?? null;
    $approved = isset($input['approved']) ? (int)$input['approved'] : null;
    
    if (!$memberCommitteeId || $approved === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    $stmt = $mysqli->prepare("UPDATE MemberCommittee SET Approved = ? WHERE MemberCommitteeID = ?");
    $stmt->bind_param('ii', $approved, $memberCommitteeId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// DELETE - Remove member from committee
if ($method === 'DELETE') {
    $memberCommitteeId = $input['memberCommitteeId'] ?? ($_GET['id'] ?? null);
    
    if (!$memberCommitteeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing ID']);
        exit;
    }
    
    $stmt = $mysqli->prepare("DELETE FROM MemberCommittee WHERE MemberCommitteeID = ?");
    $stmt->bind_param('i', $memberCommitteeId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
