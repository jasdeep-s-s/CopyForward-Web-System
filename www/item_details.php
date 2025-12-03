<?php
// Item Details API - Get full item information
// By Jasdeep S. Sandhu, 40266557
session_start();
header('Content-Type: application/json');

require __DIR__ . '/db.php';

// Check if user is logged in
$memberId = $_SESSION['member_id'] ?? null;

if (!$memberId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Must be logged in']);
    exit;
}

// Get item ID
$itemId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$itemId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Item ID required']);
    exit;
}

// Query item details with author information
$query = "SELECT 
    i.*,
    m.Name as AuthorName,
    m.ORCID as AuthorORCID
FROM Item i
LEFT JOIN Member m ON i.AuthorID = m.ORCID
WHERE i.ItemID = ?";

$stmt = $mysqli->prepare($query);
$stmt->bind_param('i', $itemId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Item not found']);
    exit;
}

$item = $result->fetch_assoc();

echo json_encode($item);
?>
