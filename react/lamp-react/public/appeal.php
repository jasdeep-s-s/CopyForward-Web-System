<?php
// appeal.php - Submit appeal for blacklisted item
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'not_logged_in']);
  exit;
}

$loggedInMemberId = $_SESSION['member_id'];

// Handle POST - Submit appeal
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $discussionId = isset($input['discussionId']) ? intval($input['discussionId']) : 0;
  $message = isset($input['message']) ? trim($input['message']) : '';

  if (!$discussionId || !$message) {
    echo json_encode(['success' => false, 'error' => 'Missing discussionId or message']);
    exit;
  }

  // Verify the discussion exists and is blacklisted
  $sql = "SELECT d.DiscussionID, d.ItemID, d.Status, i.AuthorID 
          FROM Discussion d
          JOIN Item i ON d.ItemID = i.ItemID
          WHERE d.DiscussionID = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('i', $discussionId);
  $stmt->execute();
  $result = $stmt->get_result();
  $discussion = $result->fetch_assoc();

  if (!$discussion) {
    echo json_encode(['success' => false, 'error' => 'Discussion not found']);
    exit;
  }

  // Only the author can appeal
  if ($discussion['AuthorID'] != $loggedInMemberId) {
    echo json_encode(['success' => false, 'error' => 'Only the author can appeal']);
    exit;
  }

  // Can only appeal blacklisted items
  if ($discussion['Status'] !== 'Blacklisted') {
    echo json_encode(['success' => false, 'error' => 'Can only appeal blacklisted items']);
    exit;
  }

  // Check if appeal already exists
  $sql = "SELECT DiscussionID FROM Discussion 
          WHERE ItemID = ? AND Status = 'Appeal'";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('i', $discussion['ItemID']);
  $stmt->execute();
  $result = $stmt->get_result();
  if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'error' => 'Appeal already submitted for this item']);
    exit;
  }

  // Create new appeal discussion
  $appealCommitteeId = 2; // Appeal Committee
  $subject = "Appeal for: " . $discussion['ItemID'];
  $votingDeadline = date('Y-m-d H:i:s', strtotime('+7 days')); // 7 days for appeal vote

  $sql = "INSERT INTO Discussion (Subject, CommitteeID, ItemID, Status, VoteActive, VotingDeadline)
          VALUES (?, ?, ?, 'Appeal', TRUE, ?)";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('siis', $subject, $appealCommitteeId, $discussion['ItemID'], $votingDeadline);
  
  if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Failed to create appeal: ' . $stmt->error]);
    exit;
  }

  $newAppealId = $conn->insert_id;

  // Add initial appeal message from author
  $sql = "INSERT INTO DiscussionMessage (DiscussionID, SenderID, Message, Date)
          VALUES (?, ?, ?, NOW())";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('iis', $newAppealId, $loggedInMemberId, $message);
  $stmt->execute();

  // Update original discussion status to Appeal
  $sql = "UPDATE Discussion SET Status = 'Appeal' WHERE DiscussionID = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param('i', $discussionId);
  $stmt->execute();

  echo json_encode([
    'success' => true,
    'appealId' => $newAppealId,
    'message' => 'Appeal submitted successfully'
  ]);
  exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
