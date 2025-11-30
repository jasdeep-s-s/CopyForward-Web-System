<?php
// by Tudor Cosmin Suciu, 40179863

session_start();
header('Content-Type: application/json');

$in            = json_decode(file_get_contents('php://input'), true) ?? [];
$name          = trim($in['name'] ?? '');
$username      = trim($in['username'] ?? '');
$email         = trim($in['email'] ?? '');
$recoveryEmail = trim($in['recoveryEmail'] ?? '');
$organization  = trim($in['organization'] ?? '');
$pwd           = $in['password'] ?? '';
$orcid         = trim($in['orcid'] ?? '');
$addressInput  = $in['address'] ?? [];

$streetNumberRaw = isset($addressInput['streetNumber']) ? trim((string)$addressInput['streetNumber']) : '';
$streetName      = isset($addressInput['streetName']) ? trim((string)$addressInput['streetName']) : '';
$city            = isset($addressInput['city']) ? trim((string)$addressInput['city']) : '';
$country         = isset($addressInput['country']) ? trim((string)$addressInput['country']) : '';

if (!$name || !$username || !$email || strlen($pwd) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

if ($streetNumberRaw === '' || !preg_match('/^-?\d+$/', $streetNumberRaw) || !$streetName || !$city || !$country) {
    http_response_code(400);
    echo json_encode(['error' => 'Address is required']);
    exit;
}

$streetNumber = (int)$streetNumberRaw;
$hash         = password_hash($pwd, PASSWORD_DEFAULT);

require __DIR__ . '/db.php';

// ensure unique username/email
$existingStmt = $mysqli->prepare('SELECT MemberID, Username, Password FROM Member WHERE PrimaryEmail = ? LIMIT 1');
$existingStmt->bind_param('s', $email);
$existingStmt->execute();
$existingRes = $existingStmt->get_result();
$existing = $existingRes ? $existingRes->fetch_assoc() : null;
$existingStmt->close();

if (!$existing) {
    http_response_code(403);
    echo json_encode(['error' => 'You must be referred before signing up.']);
    exit;
}

$existingId = (int)$existing['MemberID'];
$pendingPlaceholder = isset($existing['Password']) && $existing['Password'] === 'TBD';
if (!$pendingPlaceholder) {
    http_response_code(409);
    echo json_encode(['error' => 'That email is already registered.']);
    exit;
}

$usernameStmt = $mysqli->prepare('SELECT MemberID FROM Member WHERE Username = ? AND MemberID <> ? LIMIT 1');
$usernameStmt->bind_param('si', $username, $existingId);
$usernameStmt->execute();
if ($usernameStmt->get_result()->fetch_row()) {
    $usernameStmt->close();
    http_response_code(409);
    echo json_encode(['error' => 'Username already taken.']);
    exit;
}
$usernameStmt->close();

$mysqli->begin_transaction();

try {
    $addressStmt = $mysqli->prepare(
        'INSERT INTO Address (StreetNumber, StreetName, City, Country) VALUES (?, ?, ?, ?)'
    );
    $addressStmt->bind_param('isss', $streetNumber, $streetName, $city, $country);
    if (!$addressStmt->execute()) {
        throw new Exception('address');
    }
    $addressId = $addressStmt->insert_id;
    $addressStmt->close();

    $memberStmt = $mysqli->prepare(
        'UPDATE Member
            SET Role = ?, Name = ?, Username = ?, Organization = ?, AddressID = ?, RecoveryEmail = ?, Password = ?, ORCID = ?, Blacklisted = 0
          WHERE MemberID = ?'
    );

    $role           = $orcid ? 'Author' : 'Regular';
    $orcidOrNull    = $orcid ?: null;
    $orgOrNull      = $organization ?: null;
    $recoveryOrNull = $recoveryEmail ?: null;

    $memberStmt->bind_param(
        'ssssisssi',
        $role,
        $name,
        $username,
        $orgOrNull,
        $addressId,
        $recoveryOrNull,
        $hash,
        $orcidOrNull,
        $existingId
    );

    if (!$memberStmt->execute()) {
        throw new Exception('member');
    }

    $memberStmt->close();
    $mysqli->commit();
} catch (Throwable $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Create failed']);
    exit;
}

session_regenerate_id(true);
$_SESSION['member_id'] = $existingId;
$_SESSION['role']      = $role;
$_SESSION['email']     = $email;

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => $existingId,
        'role'     => $role,
        'email'    => $email,
        'username' => $username,
    ],
]);

?>
