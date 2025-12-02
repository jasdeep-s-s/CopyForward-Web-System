
<?php
// committee_discussions.php - List discussions by committee
// by Jasdeep S. Sandhu, 40266557
session_start();
header('Content-Type: application/json');
require __DIR__ . '/db.php';

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

// First check if user is an approved member of this committee
$memberCheckSql = "SELECT Approved FROM MemberCommittee WHERE MemberID = ? AND CommitteeID = ? AND Approved = 1";
$memberCheckStmt = $mysqli->prepare($memberCheckSql);
$memberCheckStmt->bind_param('ii', $loggedInMemberId, $committeeId);
$memberCheckStmt->execute();
$memberCheckResult = $memberCheckStmt->get_result();

if ($memberCheckResult->num_rows === 0) {
  // User is not an approved member of this committee
  echo json_encode([]);
  exit;
}

// Query discussions for the committee - only show discussions where user has downloaded the item
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
AND EXISTS (
  SELECT 1 FROM Download 
  WHERE Download.ItemID = i.ItemID 
  AND Download.DownloaderID = ?
)
ORDER BY d.DiscussionID DESC";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param('ii', $committeeId, $loggedInMemberId);
$stmt->execute();
$result = $stmt->get_result();

$discussions = [];
while ($row = $result->fetch_assoc()) {
  $discussions[] = $row;
}

echo json_encode($discussions);
