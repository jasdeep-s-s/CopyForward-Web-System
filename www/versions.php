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

$parent = isset($_GET['parent']) ? intval($_GET['parent']) : 0;
if ($parent <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parent"]);
    $mysqli->close();
    exit;
}

$sql = "SELECT i.ItemID, i.Title, i.UploadDate FROM Item i WHERE i.ParentTitleID = ? ORDER BY i.UploadDate ASC";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
    exit;
}
$exclude = isset($_GET['exclude']) ? intval($_GET['exclude']) : 0;

if ($exclude > 0) {
    $sql = "SELECT i.ItemID, i.Title, i.UploadDate FROM Item i WHERE i.ParentTitleID = ? AND i.ItemID != ? ORDER BY i.UploadDate ASC";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
        exit;
    }
    $stmt->bind_param('ii', $parent, $exclude);
} else {
    $sql = "SELECT i.ItemID, i.Title, i.UploadDate FROM Item i WHERE i.ParentTitleID = ? ORDER BY i.UploadDate ASC";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed", "sql" => $sql, "mysqli_error" => $mysqli->error]);
        exit;
    }
    $stmt->bind_param('i', $parent);
}
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["error" => "Execute failed", "stmt_error" => $stmt->error]);
    $stmt->close();
    exit;
}

$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = $r;
}
$stmt->close();

$includeParent = isset($_GET['includeParent']) && ($_GET['includeParent'] === '1' || $_GET['includeParent'] === 'true');
if ($includeParent) {
    $pSql = "SELECT i.ItemID, i.Title, i.UploadDate FROM Item i WHERE i.ItemID = ? LIMIT 1";
    $pStmt = $mysqli->prepare($pSql);
    if ($pStmt) {
        $pStmt->bind_param('i', $parent);
        if ($pStmt->execute()) {
            $pRes = $pStmt->get_result();
            $prow = $pRes->fetch_assoc();
            if ($prow) {
                $exists = false;
                foreach ($rows as $r) {
                    if (isset($r['ItemID']) && $r['ItemID'] == $prow['ItemID']) { $exists = true; break; }
                }
                if (!$exists) {
                    array_unshift($rows, $prow);
                }
            }
        }
        $pStmt->close();
    }
}

echo json_encode($rows);
$mysqli->close();
