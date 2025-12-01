<?php
// Moderator Items Management API
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

// GET - List all items with optional status filter
if ($method === 'GET') {
    $status = $_GET['status'] ?? null;
    $orcid = $_GET['orcid'] ?? null;
    
    $query = "SELECT i.*, m.Name as AuthorName, m.MemberID as AuthorMemberID 
              FROM Item i 
              LEFT JOIN Member m ON i.AuthorID = m.ORCID";
    
    $conditions = [];
    $params = [];
    $types = '';
    
    if ($status) {
        $conditions[] = "i.Status = ?";
        $types .= 's';
        $params[] = $status;
    }
    
    if ($orcid) {
        $conditions[] = "i.AuthorID = ?";
        $types .= 's';
        $params[] = $orcid;
    }
    
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " ORDER BY i.UploadDate DESC";
    
    if (!empty($params)) {
        $stmt = $mysqli->prepare($query);
        if ($stmt) {
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $mysqli->error]);
            exit;
        }
    } else {
        $result = $mysqli->query($query);
    }
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    
    echo json_encode($items);
    exit;
}

// PUT - Update item (approve/decline content)
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $itemId = $input['itemId'] ?? null;
    $status = $input['status'] ?? null;
    $title = $input['title'] ?? null;
    $content = $input['content'] ?? null;
    $topic = $input['topic'] ?? null;
    
    if (!$itemId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing itemId']);
        exit;
    }
    
    $updates = [];
    $types = '';
    $values = [];
    
    if ($status !== null) {
        $validStatuses = ['Under Review (Upload)', 'Available', 'Under Review (Plagiarism)', 'Removed', 'Deleted (Author)'];
        if (!in_array($status, $validStatuses)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            exit;
        }
        $updates[] = "Status = ?";
        $types .= 's';
        $values[] = $status;
        
        // If approving, set ApprovedBy and UpdatedAt
        if ($status === 'Available') {
            $updates[] = "ApprovedBy = ?";
            $updates[] = "UpdatedAt = NOW()";
            $types .= 'i';
            $values[] = $memberId;
        }
    }
    
    if ($title !== null) {
        $updates[] = "Title = ?";
        $types .= 's';
        $values[] = $title;
    }
    
    if ($content !== null) {
        $updates[] = "Content = ?";
        $types .= 's';
        $values[] = $content;
    }
    
    if ($topic !== null) {
        $updates[] = "Topic = ?";
        $types .= 's';
        $values[] = $topic;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $itemId;
    $types .= 'i';
    
    $query = "UPDATE Item SET " . implode(", ", $updates) . " WHERE ItemID = ?";
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

// DELETE - Delete item
if ($method === 'DELETE') {
    $itemId = $_GET['id'] ?? null;
    
    if (!$itemId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing item ID']);
        exit;
    }
    
    // Delete related records first (foreign key constraints)
    $mysqli->query("DELETE FROM Comment WHERE ItemID = $itemId");
    $mysqli->query("DELETE FROM Download WHERE ItemID = $itemId");
    $mysqli->query("DELETE FROM Donation WHERE ItemID = $itemId");
    $mysqli->query("DELETE FROM Discussion WHERE ItemID = $itemId");
    
    $stmt = $mysqli->prepare("DELETE FROM Item WHERE ItemID = ?");
    $stmt->bind_param('i', $itemId);
    
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
