<?php
// Moderator Members Management API
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

// GET - List all members with optional donations data
if ($method === 'GET') {
    $withDonations = isset($_GET['withDonations']) && $_GET['withDonations'] === 'true';
    $year = $_GET['year'] ?? date('Y');
    
    $query = "SELECT m.*, a.StreetNumber, a.StreetName, a.City, a.Country 
              FROM Member m 
              LEFT JOIN Address a ON m.AddressID = a.AddressID
              ORDER BY m.MemberID";
    
    $result = $mysqli->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $mysqli->error]);
        exit;
    }
    
    $members = [];
    while ($row = $result->fetch_assoc()) {
        $mid = (int)$row['MemberID'];
        
        if ($withDonations) {
            // Get donations for specified year
            $donQuery = "SELECT SUM(Amount) as TotalDonated, COUNT(*) as DonationCount 
                        FROM Donation 
                        WHERE DonatorID = ? AND YEAR(Date) = ?";
            $stmt = $mysqli->prepare($donQuery);
            $stmt->bind_param('ii', $mid, $year);
            $stmt->execute();
            $donResult = $stmt->get_result();
            $donData = $donResult->fetch_assoc();
            
            $row['TotalDonated'] = $donData['TotalDonated'] ?? 0;
            $row['DonationCount'] = $donData['DonationCount'] ?? 0;
            $row['DonationYear'] = $year;
        }
        
        // Get download count
        $dlQuery = "SELECT COUNT(*) as DownloadCount FROM Download WHERE DownloaderID = ?";
        $dlStmt = $mysqli->prepare($dlQuery);
        $dlStmt->bind_param('i', $mid);
        $dlStmt->execute();
        $dlResult = $dlStmt->get_result();
        $dlData = $dlResult->fetch_assoc();
        $row['DownloadCount'] = $dlData['DownloadCount'] ?? 0;
        
        $members[] = $row;
    }
    
    echo json_encode($members);
    exit;
}

// POST - Create new member
if ($method === 'POST') {
    $name = $input['name'] ?? null;
    $username = $input['username'] ?? null;
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    $role = $input['role'] ?? 'Regular';
    $organization = $input['organization'] ?? null;
    $orcid = $input['orcid'] ?? null;
    $recoveryEmail = $input['recoveryEmail'] ?? null;
    
    if (!$name || !$username || !$email || !$password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    // Validate role
    $validRoles = ['Regular', 'Author', 'Moderator'];
    if (!in_array($role, $validRoles)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid role']);
        exit;
    }
    
    // Check if username already exists
    $stmt = $mysqli->prepare("SELECT MemberID FROM Member WHERE Username = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Username already exists']);
        exit;
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $mysqli->prepare("INSERT INTO Member (Role, Name, Username, Organization, PrimaryEmail, RecoveryEmail, Password, ORCID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('ssssssss', $role, $name, $username, $organization, $email, $recoveryEmail, $hashedPassword, $orcid);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'memberId' => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    
    exit;
}

// PUT - Update member (including role changes)
if ($method === 'PUT') {
    $targetMemberId = $input['memberId'] ?? null;
    $name = $input['name'] ?? null;
    $role = $input['role'] ?? null;
    $organization = $input['organization'] ?? null;
    $email = $input['email'] ?? null;
    $recoveryEmail = $input['recoveryEmail'] ?? null;
    $blacklisted = isset($input['blacklisted']) ? (int)$input['blacklisted'] : null;
    $orcid = $input['orcid'] ?? null;
    
    if (!$targetMemberId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing memberId']);
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
    
    if ($role !== null) {
        $validRoles = ['Regular', 'Author', 'Moderator'];
        if (!in_array($role, $validRoles)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid role']);
            exit;
        }
        $updates[] = "Role = ?";
        $types .= 's';
        $values[] = $role;
    }
    
    if ($organization !== null) {
        $updates[] = "Organization = ?";
        $types .= 's';
        $values[] = $organization;
    }
    
    if ($email !== null) {
        $updates[] = "PrimaryEmail = ?";
        $types .= 's';
        $values[] = $email;
    }
    
    if ($recoveryEmail !== null) {
        $updates[] = "RecoveryEmail = ?";
        $types .= 's';
        $values[] = $recoveryEmail;
    }
    
    if ($blacklisted !== null) {
        $updates[] = "Blacklisted = ?";
        $types .= 'i';
        $values[] = $blacklisted;
    }
    
    if ($orcid !== null) {
        $updates[] = "ORCID = ?";
        $types .= 's';
        $values[] = $orcid;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        exit;
    }
    
    $values[] = $targetMemberId;
    $types .= 'i';
    
    $query = "UPDATE Member SET " . implode(", ", $updates) . " WHERE MemberID = ?";
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

// DELETE - Delete member
if ($method === 'DELETE') {
    $targetMemberId = $input['memberId'] ?? ($_GET['id'] ?? null);
    
    if (!$targetMemberId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing member ID']);
        exit;
    }
    
    // Prevent deleting self
    if ((int)$targetMemberId === (int)$memberId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot delete your own account']);
        exit;
    }
    
    // Delete related records first
    $mysqli->query("DELETE FROM Comment WHERE CommentorID = $targetMemberId");
    $mysqli->query("DELETE FROM Download WHERE DownloaderID = $targetMemberId");
    $mysqli->query("DELETE FROM Donation WHERE DonatorID = $targetMemberId");
    $mysqli->query("DELETE FROM MemberCommittee WHERE MemberID = $targetMemberId");
    $mysqli->query("DELETE FROM DiscussionMessage WHERE SenderID = $targetMemberId");
    $mysqli->query("DELETE FROM DiscussionVote WHERE VoterID = $targetMemberId");
    $mysqli->query("DELETE FROM PrivateMessage WHERE SenderID = $targetMemberId OR ReceiverID = $targetMemberId");
    $mysqli->query("DELETE FROM MFAMatrix WHERE UserID = $targetMemberId");
    
    // Get ORCID for item cleanup
    $stmt = $mysqli->prepare("SELECT ORCID FROM Member WHERE MemberID = ?");
    $stmt->bind_param('i', $targetMemberId);
    $stmt->execute();
    $result = $stmt->get_result();
    $memberData = $result->fetch_assoc();
    
    if ($memberData && $memberData['ORCID']) {
        $orcid = $memberData['ORCID'];
        // Delete items by this author
        $mysqli->query("DELETE FROM Item WHERE AuthorID = '$orcid'");
    }
    
    $stmt = $mysqli->prepare("DELETE FROM Member WHERE MemberID = ?");
    $stmt->bind_param('i', $targetMemberId);
    
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
