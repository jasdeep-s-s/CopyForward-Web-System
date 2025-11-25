<?php
header('Content-Type: application/json');

ini_set('display_errors', 0);
error_reporting(E_ALL);

$dbHost = 'database';
$dbUser = getenv('MYSQL_USER') ?: 'docker';
$dbPass = getenv('MYSQL_PASSWORD') ?: 'docker';
$dbName = 'CFP';
$dbPort = 3306;

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed", "errno" => $mysqli->connect_errno]);
    exit;
}

$search = isset($_GET['q']) ? trim($_GET['q']) : '';
$topic = isset($_GET['topic']) ? trim($_GET['topic']) : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

if ($limit <= 0) $limit = 50;
if ($limit > 200) $limit = 200;
if ($offset < 0) $offset = 0;

$where = [];
$params = [];
$types = '';

if ($search !== '') {
    $like = '%' . $search . '%';
    $where[] = "(i.Title LIKE ? OR i.Topic LIKE ? OR i.Type LIKE ? OR COALESCE(m.Username, m.Name) LIKE ?)";
    $types .= 'ssss';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

if ($topic !== '') {
    $where[] = "i.Topic LIKE ?";
    $types .= 's';
    $params[] = '%' . $topic . '%';
}

$sql = "SELECT
            i.ItemID,
            i.Title,
            i.Topic,
            i.Type,
            i.Status,
            i.UploadDate,
            i.PublicationDate,
            i.ParentTitleID,
            COALESCE(m.Username, m.Name) AS AuthorName,
            m.MemberID AS AuthorMemberID,
            (SELECT COUNT(*) FROM Download d WHERE d.ItemID = i.ItemID) AS DownloadCount,
            (SELECT COALESCE(SUM(Amount), 0) FROM Donation don WHERE don.ItemID = i.ItemID) AS TotalDonations
        FROM Item i
        LEFT JOIN Member m ON i.AuthorID = m.ORCID
        WHERE i.Status NOT IN ('Removed', 'Under Review (Upload)')";

if ($where) {
    $sql .= ' AND ' . implode(' AND ', $where);
}

$sql .= " ORDER BY i.UploadDate DESC, i.ItemID DESC LIMIT ? OFFSET ?";
$types .= 'ii';
$params[] = $limit;
$params[] = $offset;

$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
    $mysqli->close();
    exit;
}

$bindParams = [];
$bindParams[] = $types;
foreach ($params as $key => $val) {
    $bindParams[] = &$params[$key];
}

call_user_func_array([$stmt, 'bind_param'], $bindParams);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Execute failed", "stmt_error" => $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$result = $stmt->get_result();
$items = [];
while ($row = $result->fetch_assoc()) {
    $items[] = [
        "ItemID" => (int)$row['ItemID'],
        "Title" => $row['Title'],
        "Topic" => $row['Topic'],
        "Type" => $row['Type'],
        "Status" => $row['Status'],
        "UploadDate" => $row['UploadDate'],
        "PublicationDate" => $row['PublicationDate'],
        "ParentTitleID" => $row['ParentTitleID'] !== null ? (int)$row['ParentTitleID'] : null,
        "AuthorName" => $row['AuthorName'],
        "AuthorMemberID" => $row['AuthorMemberID'] !== null ? (int)$row['AuthorMemberID'] : null,
        "DownloadCount" => isset($row['DownloadCount']) ? (int)$row['DownloadCount'] : 0,
        "TotalDonations" => isset($row['TotalDonations']) ? (float)$row['TotalDonations'] : 0.0
    ];
}

$stmt->close();
$mysqli->close();

echo json_encode($items);
?>
