<?php
// Moderator Comments Management API
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

// GET - List all comments (with optional filters)
if ($method === 'GET') {
    $private = isset($_GET['private']) ? (int)$_GET['private'] : null;
    
    $query = "SELECT c.*, m.Username as CommentorUsername, i.Title as ItemTitle 
              FROM Comment c 
              LEFT JOIN Member m ON c.CommentorID = m.MemberID
              LEFT JOIN Item i ON c.ItemID = i.ItemID";
    
    $conditions = [];
    if ($private !== null) {
        $conditions[] = "c.Private = $private";
    }
    
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " ORDER BY c.Date DESC";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }
    
    echo json_encode($comments);
    exit;
}

// POST - Create comment (moderator can create comments)
if ($method === 'POST') {
    $itemId = $input['itemId'] ?? null;
    $comment = $input['comment'] ?? null;
    $private = isset($input['private']) ? (int)$input['private'] : 0;
    $parentCommentId = $input['parentCommentId'] ?? null;
    
    if (!$itemId || !$comment) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    $stmt = $mysqli->prepare("INSERT INTO Comment (ItemID, CommentorID, Comment, Date, ParentCommentID, Private) VALUES (?, ?, ?, NOW(), ?, ?)");
    $stmt->bind_param('iisii', $itemId, $memberId, $comment, $parentCommentId, $private);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'commentId' => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// PUT - Update comment (approve/decline is done by marking as Private or deleting)
if ($method === 'PUT') {
    $commentId = $input['commentId'] ?? null;
    $private = isset($input['private']) ? (int)$input['private'] : null;
    $comment = $input['comment'] ?? null;
    
    if (!$commentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing commentId']);
        exit;
    }
    
    $updates = [];
    $types = '';
    $values = [];
    
    if ($private !== null) {
        $updates[] = "Private = ?";
        $types .= 'i';
        $values[] = $private;
    }
    
    if ($comment !== null) {
        $updates[] = "Comment = ?";
        $types .= 's';
        $values[] = $comment;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $commentId;
    $types .= 'i';
    
    $query = "UPDATE Comment SET " . implode(", ", $updates) . " WHERE CommentID = ?";
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

// DELETE - Delete comment
if ($method === 'DELETE') {
    $commentId = $input['commentId'] ?? ($_GET['id'] ?? null);
    
    if (!$commentId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing comment ID']);
        exit;
    }
    
    $stmt = $mysqli->prepare("DELETE FROM Comment WHERE CommentID = ?");
    $stmt->bind_param('i', $commentId);
    
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
