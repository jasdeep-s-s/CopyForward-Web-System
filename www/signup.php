<?php
// by Tudor Cosmin Suciu, 40179863

session_start();
header('Content-Type: application/json');

$in           = json_decode(file_get_contents('php://input'), true) ?? [];
$matrixInputRaw = isset($in['matrix']) ? (string)$in['matrix'] : '';
$matrixInput    = $matrixInputRaw !== '' ? preg_replace('/\s+/', '', strtoupper($matrixInputRaw)) : '';
$memberIdIn   = isset($in['memberId']) ? (int)$in['memberId'] : 0;
$now          = new DateTimeImmutable('now');

function respond($status, $payload)
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function generate_matrix_plain()
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out   = '';
    for ($i = 0; $i < 25; $i++) {
        $out .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $out;
}

function format_matrix_5x5($matrixPlain)
{
    $chunks = str_split($matrixPlain, 5);
    // Represent as groups of 5 characters separated by spaces (e.g., ABCDE FGHIJ ...)
    return implode(' ', $chunks);
}

require __DIR__ . '/db.php';

// Helper to fetch latest matrix for a member
function fetch_latest_matrix($mysqli, $memberId)
{
    $stmt = $mysqli->prepare('SELECT Matrix, ExpiryDate, CreationDate FROM MFAMatrix WHERE UserID = ? ORDER BY CreationDate DESC LIMIT 1');
    $stmt->bind_param('i', $memberId);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res ? $res->fetch_assoc() : null;
    $stmt->close();
    return $row;
}

// Second step: verify matrix and finalize signup
if ($matrixInput !== '') {
    $pending = $_SESSION['pending_signup'] ?? null;
    if (!$pending || (int)$pending['memberId'] !== $memberIdIn) {
        respond(400, ['error' => 'Signup session expired. Please start again.']);
    }

    $matrixRow = fetch_latest_matrix($mysqli, $memberIdIn);
    if (!$matrixRow) {
        respond(401, ['error' => 'No active security matrix found.']);
    }
    $expiryTs = strtotime($matrixRow['ExpiryDate']);
    if ($expiryTs !== false && $expiryTs < time()) {
        respond(401, ['error' => 'Security matrix expired. Contact a moderator to regenerate.']);
    }
    $stored = preg_replace('/\s+/', '', strtoupper(trim($matrixRow['Matrix'] ?? '')));
    if ($stored !== $matrixInput) {
        respond(401, ['error' => 'Invalid security matrix.']);
    }

    $mysqli->begin_transaction();
    try {
        $addressStmt = $mysqli->prepare(
            'INSERT INTO Address (StreetNumber, StreetName, City, Country) VALUES (?, ?, ?, ?)'
        );
        $addressStmt->bind_param(
            'isss',
            $pending['streetNumber'],
            $pending['streetName'],
            $pending['city'],
            $pending['country']
        );
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

        $memberStmt->bind_param(
            'ssssisssi',
            $pending['role'],
            $pending['name'],
            $pending['username'],
            $pending['organization'],
            $addressId,
            $pending['recoveryEmail'],
            $pending['passwordHash'],
            $pending['orcid'],
            $memberIdIn
        );

        if (!$memberStmt->execute()) {
            throw new Exception('member');
        }

        $memberStmt->close();
        $mysqli->commit();
    } catch (Throwable $e) {
        $mysqli->rollback();
        respond(500, ['error' => 'Create failed']);
    }

    unset($_SESSION['pending_signup']);
    session_regenerate_id(true);
    $_SESSION['member_id'] = $memberIdIn;
    $_SESSION['role']      = $pending['role'];
    $_SESSION['email']     = $pending['email'];

    respond(200, [
        'success' => true,
        'user'    => [
            'id'       => $memberIdIn,
            'role'     => $pending['role'],
            'email'    => $pending['email'],
            'username' => $pending['username'],
        ],
    ]);
}

// First step: validate details and send matrix
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
    respond(400, ['error' => 'Missing fields']);
}

if ($streetNumberRaw === '' || !preg_match('/^-?\d+$/', $streetNumberRaw) || !$streetName || !$city || !$country) {
    respond(400, ['error' => 'Address is required']);
}

$streetNumber = (int)$streetNumberRaw;
$role         = $orcid ? 'Author' : 'Regular';
$hash         = password_hash($pwd, PASSWORD_DEFAULT);

// ensure referred placeholder exists and is not already activated
$existingStmt = $mysqli->prepare('SELECT MemberID, Username, Password FROM Member WHERE PrimaryEmail = ? LIMIT 1');
$existingStmt->bind_param('s', $email);
$existingStmt->execute();
$existingRes = $existingStmt->get_result();
$existing    = $existingRes ? $existingRes->fetch_assoc() : null;
$existingStmt->close();

if (!$existing) {
    respond(403, ['error' => 'You must be referred before signing up.']);
}

$existingId         = (int)$existing['MemberID'];
$pendingPlaceholder = isset($existing['Password']) && $existing['Password'] === 'TBD';
if (!$pendingPlaceholder) {
    respond(409, ['error' => 'That email is already registered.']);
}

// check username uniqueness (excluding this placeholder row)
$usernameStmt = $mysqli->prepare('SELECT MemberID FROM Member WHERE Username = ? AND MemberID <> ? LIMIT 1');
$usernameStmt->bind_param('si', $username, $existingId);
$usernameStmt->execute();
if ($usernameStmt->get_result()->fetch_row()) {
    $usernameStmt->close();
    respond(409, ['error' => 'Username already taken.']);
}
$usernameStmt->close();

// generate matrix and store it
$matrixPlain = generate_matrix_plain();
$expiry      = $now->modify('+10 days')->format('Y-m-d H:i:s');

$matrixStmt = $mysqli->prepare(
    'INSERT INTO MFAMatrix (UserID, ExpiryDate, CreationDate, Matrix) VALUES (?, ?, ?, ?)'
);
$creation = $now->format('Y-m-d H:i:s');
$matrixStmt->bind_param('isss', $existingId, $expiry, $creation, $matrixPlain);
if (!$matrixStmt->execute()) {
    $matrixStmt->close();
    respond(500, ['error' => 'Failed to create security matrix.']);
}
$matrixStmt->close();

// send matrix via private message (SenderID NULL for system)
$message = "Your security matrix (expires in 10 days):\n" . format_matrix_5x5($matrixPlain);
$pmStmt = $mysqli->prepare(
    'INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message) VALUES (NULL, ?, ?, ?)'
);
$pmDate = $now->format('Y-m-d H:i:s');
$pmStmt->bind_param('iss', $existingId, $pmDate, $message);
$pmStmt->execute();
$pmStmt->close();

// store pending signup details in session until matrix is verified
$_SESSION['pending_signup'] = [
    'memberId'      => $existingId,
    'role'          => $role,
    'name'          => $name,
    'username'      => $username,
    'organization'  => $organization ?: null,
    'recoveryEmail' => $recoveryEmail ?: null,
    'passwordHash'  => $hash,
    'orcid'         => $orcid ?: null,
    'streetNumber'  => $streetNumber,
    'streetName'    => $streetName,
    'city'          => $city,
    'country'       => $country,
    'email'         => $email,
];

respond(200, [
    'success'      => true,
    'mfaRequired'  => true,
    'memberId'     => $existingId,
    'message'      => 'Security matrix sent. Enter it to finish signup.',
    'expiry'       => $expiry
]);

?>
