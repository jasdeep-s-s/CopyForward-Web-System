<?php
// discussions.php - List discussions by committee
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'not_logged_in']);
  exit;
}

$loggedInMemberId = $_SESSION['member_id'];

// Get committee filter
$committeeId = isset($_GET['committee']) ? intval($_GET['committee']) : null;

if (!$committeeId) {
  http_response_code(400);
  echo json_encode(['error' => 'committee parameter required']);
  exit;
}

// Query discussions for the committee
$sql = "SELECT 
  d.DiscussionID,
  d.Subject,
  d.Status,
  d.VoteActive,
  d.VotingDeadline,
  i.ItemID,
  i.Title AS ItemTitle
FROM Discussion d
JOIN Item i ON d.ItemID = i.ItemID
WHERE d.CommitteeID = ?
ORDER BY d.DiscussionID DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $committeeId);
$stmt->execute();
$result = $stmt->get_result();

$discussions = [];
while ($row = $result->fetch_assoc()) {
  $discussions[] = $row;
}

echo json_encode($discussions);
