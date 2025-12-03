<?php
// Public Committees API - View committees and discussions
// by Jasdeep S. Sandhu, 40266557

session_start();
header('Content-Type: application/json');

require __DIR__ . '/db.php';

// Check if user is logged in
$memberId = $_SESSION['member_id'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$memberId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Must be signed in to view committees']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all committees with discussion counts
if ($method === 'GET' && !isset($_GET['discussionId'])) {
    $query = "SELECT c.*, 
              COUNT(DISTINCT d.DiscussionID) as DiscussionCount,
              COUNT(DISTINCT mc.MemberID) as MemberCount
              FROM Committee c
              LEFT JOIN Discussion d ON c.CommitteeID = d.CommitteeID
              LEFT JOIN MemberCommittee mc ON c.CommitteeID = mc.CommitteeID AND mc.Approved = 1
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
        // Check if current user is a member
        $checkMember = $mysqli->prepare("SELECT Approved FROM MemberCommittee WHERE MemberID = ? AND CommitteeID = ?");
        $checkMember->bind_param('ii', $memberId, $row['CommitteeID']);
        $checkMember->execute();
        $memberResult = $checkMember->get_result();
        $memberRow = $memberResult->fetch_assoc();
        
        $row['IsMember'] = $memberRow ? true : false;
        $row['IsApproved'] = $memberRow && $memberRow['Approved'] ? true : false;
        
        $committees[] = $row;
    }
    
    echo json_encode($committees);
    exit;
}

// GET - Get specific discussion details
if ($method === 'GET' && isset($_GET['discussionId'])) {
    $discussionId = (int)$_GET['discussionId'];
    
    // Get discussion details with item and committee info
    $query = "SELECT d.*, i.Title as ItemTitle, i.AuthorID, i.Status as ItemStatus,
              c.Name as CommitteeName, c.CommitteeID,
              m.Name as AuthorName, m.MemberID as AuthorMemberID
              FROM Discussion d
              JOIN Item i ON d.ItemID = i.ItemID
              JOIN Committee c ON d.CommitteeID = c.CommitteeID
              LEFT JOIN Member m ON i.AuthorID = m.ORCID
              WHERE d.DiscussionID = ?";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $discussionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $discussion = $result->fetch_assoc();
    
    if (!$discussion) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Discussion not found']);
        exit;
    }
    
    // Check if user is committee member
    $checkMember = $mysqli->prepare("SELECT Approved FROM MemberCommittee WHERE MemberID = ? AND CommitteeID = ?");
    $checkMember->bind_param('ii', $memberId, $discussion['CommitteeID']);
    $checkMember->execute();
    $memberResult = $checkMember->get_result();
    $memberRow = $memberResult->fetch_assoc();
    
    $discussion['IsCommitteeMember'] = $memberRow && $memberRow['Approved'] ? true : false;
    
    // Check if user has downloaded the item (required to view discussion)
    $checkDownloadAccess = $mysqli->prepare("SELECT 1 FROM Download WHERE DownloaderID = ? AND ItemID = ? LIMIT 1");
    $checkDownloadAccess->bind_param('ii', $memberId, $discussion['ItemID']);
    $checkDownloadAccess->execute();
    $downloadAccessResult = $checkDownloadAccess->get_result();
    $hasDownloadedItem = $downloadAccessResult->num_rows > 0;
    
    // User must be an approved committee member AND have downloaded the item
    if (!$discussion['IsCommitteeMember'] || !$hasDownloadedItem) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'Access denied. You must be an approved committee member and have downloaded the item to view this discussion.',
            'isCommitteeMember' => $discussion['IsCommitteeMember'],
            'hasDownloaded' => $hasDownloadedItem
        ]);
        exit;
    }
    
    // Check if user is the item author
    $discussion['IsAuthor'] = ($discussion['AuthorMemberID'] == $memberId);
    
    // Check if user has downloaded the item (can vote)
    $checkDownload = $mysqli->prepare("SELECT 1 FROM Download WHERE DownloaderID = ? AND ItemID = ? LIMIT 1");
    $checkDownload->bind_param('ii', $memberId, $discussion['ItemID']);
    $checkDownload->execute();
    $downloadResult = $checkDownload->get_result();
    $discussion['HasDownloaded'] = $downloadResult->num_rows > 0;
    
    // Check if user has already voted
    $checkVote = $mysqli->prepare("SELECT Vote FROM DiscussionVote WHERE VoterID = ? AND DiscussionID = ?");
    $checkVote->bind_param('ii', $memberId, $discussionId);
    $checkVote->execute();
    $voteResult = $checkVote->get_result();
    $voteRow = $voteResult->fetch_assoc();
    $discussion['HasVoted'] = $voteRow ? true : false;
    $discussion['UserVote'] = $voteRow ? $voteRow['Vote'] : null;
    
    // Get vote counts
    $voteQuery = "SELECT 
                  COUNT(*) as TotalVotes,
                  SUM(CASE WHEN Vote = 1 THEN 1 ELSE 0 END) as YesVotes,
                  SUM(CASE WHEN Vote = 0 THEN 1 ELSE 0 END) as NoVotes
                  FROM DiscussionVote WHERE DiscussionID = ?";
    $voteStmt = $mysqli->prepare($voteQuery);
    $voteStmt->bind_param('i', $discussionId);
    $voteStmt->execute();
    $voteData = $voteStmt->get_result()->fetch_assoc();
    $discussion = array_merge($discussion, $voteData);
    
    // Get messages
    $msgQuery = "SELECT dm.*, m.Name as SenderName, m.Username as SenderUsername
                 FROM DiscussionMessage dm
                 JOIN Member m ON dm.SenderID = m.MemberID
                 WHERE dm.DiscussionID = ?
                 ORDER BY dm.Date ASC";
    $msgStmt = $mysqli->prepare($msgQuery);
    $msgStmt->bind_param('i', $discussionId);
    $msgStmt->execute();
    $msgResult = $msgStmt->get_result();
    
    $messages = [];
    while ($msg = $msgResult->fetch_assoc()) {
        $messages[] = $msg;
    }
    
    $discussion['Messages'] = $messages;
    
    echo json_encode($discussion);
    exit;
}

// POST - Post message to discussion (committee members only)
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $discussionId = $input['discussionId'] ?? null;
    $message = $input['message'] ?? null;
    
    if (!$discussionId || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    // Check if user is approved committee member AND has downloaded the item
    $checkQuery = "SELECT mc.Approved, d.CommitteeID, d.ItemID
                   FROM Discussion d
                   JOIN MemberCommittee mc ON d.CommitteeID = mc.CommitteeID
                   WHERE d.DiscussionID = ? AND mc.MemberID = ? AND mc.Approved = 1";
    $checkStmt = $mysqli->prepare($checkQuery);
    $checkStmt->bind_param('ii', $discussionId, $memberId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if (!$checkRow) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only approved committee members can post messages']);
        exit;
    }
    
    // Verify user has downloaded the item
    $downloadCheckStmt = $mysqli->prepare("SELECT 1 FROM Download WHERE DownloaderID = ? AND ItemID = ? LIMIT 1");
    $downloadCheckStmt->bind_param('ii', $memberId, $checkRow['ItemID']);
    $downloadCheckStmt->execute();
    $downloadCheckResult = $downloadCheckStmt->get_result();
    
    if ($downloadCheckResult->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You must download the item before participating in this discussion']);
        exit;
    }
    
    // Insert message
    $insertStmt = $mysqli->prepare("INSERT INTO DiscussionMessage (DiscussionID, SenderID, Message, Date) VALUES (?, ?, ?, NOW())");
    $insertStmt->bind_param('iis', $discussionId, $memberId, $message);
    
    if ($insertStmt->execute()) {
        echo json_encode(['success' => true, 'messageId' => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $insertStmt->error]);
    }
    
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
