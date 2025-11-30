<?php
//By Elhadji Moussa Diongue, 40186654
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
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 200;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

if ($limit <= 0) $limit = 200;
if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;

$where = ["(m.Role = 'Author' OR m.ORCID IS NOT NULL)"];
$params = [];
$types = '';

if ($search !== '') {
    $like = '%' . $search . '%';
    $where[] = "(m.Name LIKE ? OR m.Username LIKE ? OR m.Organization LIKE ?)";
    $types .= 'sss';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

$sql = "SELECT
            m.MemberID,
            m.Name,
            m.Username,
            m.Organization,
            m.PrimaryEmail,
            m.ORCID,
            (SELECT COUNT(*) FROM Item i WHERE i.AuthorID = m.ORCID) AS ItemCount,
            (
                SELECT COALESCE(SUM(d.Amount), 0)
                FROM Donation d
                JOIN Item i2 ON d.ItemID = i2.ItemID
                WHERE i2.AuthorID = m.ORCID
            ) AS TotalRaised
        FROM Member m";

if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}

$sql .= " ORDER BY COALESCE(m.Name, m.Username) ASC LIMIT ? OFFSET ?";
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
$authors = [];
while ($row = $result->fetch_assoc()) {
    $authors[] = [
        "MemberID" => (int)$row['MemberID'],
        "Name" => $row['Name'],
        "Username" => $row['Username'],
        "Organization" => $row['Organization'],
        "PrimaryEmail" => $row['PrimaryEmail'],
        "ORCID" => $row['ORCID'],
        "ItemCount" => isset($row['ItemCount']) ? (int)$row['ItemCount'] : 0,
        "TotalRaised" => isset($row['TotalRaised']) ? (float)$row['TotalRaised'] : 0.0
    ];
}

$stmt->close();
$mysqli->close();

echo json_encode($authors);
?>
