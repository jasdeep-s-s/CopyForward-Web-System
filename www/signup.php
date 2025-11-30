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
$stmt = $mysqli->prepare('SELECT 1 FROM Member WHERE Username = ? OR PrimaryEmail = ?');
$stmt->bind_param('ss', $username, $email);
$stmt->execute();

if ($stmt->get_result()->fetch_row()) {
    http_response_code(409);
    echo json_encode(['error' => 'Username or email already exists']);
    exit;
}
$stmt->close();

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
        'INSERT INTO Member (Role, Name, Username, Organization, AddressID, PrimaryEmail, RecoveryEmail, Password, ORCID, Blacklisted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)'
    );

    $role           = $orcid ? 'Author' : 'Regular';
    $orcidOrNull    = $orcid ?: null;
    $orgOrNull      = $organization ?: null;
    $recoveryOrNull = $recoveryEmail ?: null;

    $memberStmt->bind_param(
        'ssssissss',
        $role,
        $name,
        $username,
        $orgOrNull,
        $addressId,
        $email,
        $recoveryOrNull,
        $hash,
        $orcidOrNull
    );

    if (!$memberStmt->execute()) {
        throw new Exception('member');
    }

    $memberId = $memberStmt->insert_id;
    $memberStmt->close();
    $mysqli->commit();
} catch (Throwable $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Create failed']);
    exit;
}

session_regenerate_id(true);
$_SESSION['member_id'] = $memberId;
$_SESSION['role']      = $role;
$_SESSION['email']     = $email;

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => $memberId,
        'role'     => $role,
        'email'    => $email,
        'username' => $username,
    ],
]);

?>
