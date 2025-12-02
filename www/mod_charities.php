<?php
// Moderator Children's Charities Management API
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

// GET - List all charities
if ($method === 'GET') {
    $query = "SELECT cc.*, m.Username as SuggestedByUsername 
              FROM ChildrenCharity cc 
              LEFT JOIN Member m ON cc.SuggestedBy = m.MemberID
              ORDER BY cc.ChildrenCharityID";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $charities = [];
    while ($row = $result->fetch_assoc()) {
        $charities[] = $row;
    }
    
    echo json_encode($charities);
    exit;
}

// POST - Create new charity
if ($method === 'POST') {
    $name = $input['name'] ?? null;
    $approved = isset($input['approved']) ? (int)$input['approved'] : 0;
    
    if (!$name) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing charity name']);
        exit;
    }
    
    $stmt = $mysqli->prepare("INSERT INTO ChildrenCharity (Name, Approved, SuggestedBy) VALUES (?, ?, ?)");
    $stmt->bind_param('sii', $name, $approved, $memberId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'charityId' => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// PUT - Update charity (approve/decline)
if ($method === 'PUT') {
    $charityId = $input['charityId'] ?? null;
    $name = $input['name'] ?? null;
    $approved = isset($input['approved']) ? (int)$input['approved'] : null;
    
    if (!$charityId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing charityId']);
        exit;
    }
    
    $updates = [];
    $types = '';
    $values = [];
    
    if ($name !== null) {
        $updates[] = "Name = ?";
        $types .= 's';
        $values[] = $name;
    }
    
    if ($approved !== null) {
        $updates[] = "Approved = ?";
        $types .= 'i';
        $values[] = $approved;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $charityId;
    $types .= 'i';
    
    $query = "UPDATE ChildrenCharity SET " . implode(", ", $updates) . " WHERE ChildrenCharityID = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// DELETE - Delete charity
if ($method === 'DELETE') {
    $charityId = $input['charityId'] ?? ($_GET['id'] ?? null);
    
    if (!$charityId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing charity ID']);
        exit;
    }
    
    // Delete related donations first
    $mysqli->query("DELETE FROM Donation WHERE ChildrenCharityID = $charityId");
    
    $stmt = $mysqli->prepare("DELETE FROM ChildrenCharity WHERE ChildrenCharityID = ?");
    $stmt->bind_param('i', $charityId);
    
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
