<?php
// Moderator Committees Management API
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

// GET - List all committees with member counts
if ($method === 'GET') {
    $query = "SELECT c.*, COUNT(mc.MemberCommitteeID) as MemberCount 
              FROM Committee c 
              LEFT JOIN MemberCommittee mc ON c.CommitteeID = mc.CommitteeID
              GROUP BY c.CommitteeID
              ORDER BY c.CommitteeID";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $committees = [];
    while ($row = $result->fetch_assoc()) {
        $committees[] = $row;
    }
    
    echo json_encode($committees);
    exit;
}

// POST - Create new committee
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    
    if (!$name) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing committee name']);
        exit;
    }
    
    $stmt = $mysqli->prepare("INSERT INTO Committee (Name, Description) VALUES (?, ?)");
    $stmt->bind_param('ss', $name, $description);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'committeeId' => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// PUT - Update committee
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $committeeId = $input['committeeId'] ?? null;
    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    
    if (!$committeeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing committeeId']);
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
    
    if ($description !== null) {
        $updates[] = "Description = ?";
        $types .= 's';
        $values[] = $description;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $committeeId;
    $types .= 'i';
    
    $query = "UPDATE Committee SET " . implode(", ", $updates) . " WHERE CommitteeID = ?";
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

// DELETE - Delete committee
if ($method === 'DELETE') {
    $committeeId = $_GET['id'] ?? null;
    
    if (!$committeeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing committee ID']);
        exit;
    }
    
    // Delete related records first
    $mysqli->query("DELETE FROM Discussion WHERE CommitteeID = $committeeId");
    $mysqli->query("DELETE FROM MemberCommittee WHERE CommitteeID = $committeeId");
    
    $stmt = $mysqli->prepare("DELETE FROM Committee WHERE CommitteeID = ?");
    $stmt->bind_param('i', $committeeId);
    
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
