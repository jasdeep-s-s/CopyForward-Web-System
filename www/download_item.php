<?php
// by Pascal Ypperciel, 40210921
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
    echo json_encode(["success"=>false, "step"=>"db_connect", "error"=>$mysqli->connect_error]);
    exit;
}

$itemId = isset($_GET['item']) ? intval($_GET['item']) : (isset($_POST['item']) ? intval($_POST['item']) : 0);
$memberId = isset($_GET['member']) ? intval($_GET['member']) : (isset($_POST['member']) ? intval($_POST['member']) : 0);
$preview = isset($_GET['preview']) && $_GET['preview'] == '1';

if ($itemId <= 0 || $memberId <= 0) {
    echo json_encode(["success"=>false, "step"=>"validate", "error"=>"Missing item or member"]);
    exit;
}

function check_allowed($mysqli, $memberId) {
    $orcid = null;
    $sql = "SELECT ORCID FROM Member WHERE MemberID = ? LIMIT 1";
    $st = $mysqli->prepare($sql);
    if (!$st) return ["ok"=>false, "error"=>"prepare_orcid_failed"];
    $st->bind_param('i', $memberId);
    if (!$st->execute()) { $st->close(); return ["ok"=>false, "error"=>"exec_orcid_failed"]; }
    $st->bind_result($orcid);
    $found = $st->fetch();
    $st->close();

    $hasRecentAuthorUpload = false;
    if ($found && $orcid) {
        $sql = "SELECT 1 FROM Item WHERE AuthorID = ? AND UploadDate >= NOW() - INTERVAL 1 YEAR LIMIT 1";
        $st2 = $mysqli->prepare($sql);
        if ($st2) {
            $st2->bind_param('s', $orcid);
            if ($st2->execute()) {
                $st2->store_result();
                $hasRecentAuthorUpload = $st2->num_rows > 0;
            }
            $st2->close();
        }
    }

    $windowDays = $hasRecentAuthorUpload ? 1 : 7;
    $cutoff = date('Y-m-d H:i:s', strtotime("-{$windowDays} days"));

    $sql3 = "SELECT COUNT(*) as cnt, MAX(Date) as lastDate FROM Download WHERE DownloaderID = ? AND Date >= ?";
    $st3 = $mysqli->prepare($sql3);
    if (!$st3) return ["ok"=>false, "error"=>"prepare_downloads_failed"];
    $st3->bind_param('is', $memberId, $cutoff);
    if (!$st3->execute()) { $st3->close(); return ["ok"=>false, "error"=>"exec_downloads_failed"]; }
    $res = $st3->get_result();
    $row = $res->fetch_assoc();
    $count = intval($row['cnt'] ?? 0);
    $lastDate = $row['lastDate'] ?? null;
    $st3->close();

    $allowed = ($count === 0);
    return [
        "ok" => true,
        "allowed" => $allowed,
        "window_days" => $windowDays,
        "downloads_in_window" => $count,
        "last_download_date" => $lastDate,
    ];
}

if ($preview) {
    $r = check_allowed($mysqli, $memberId);
    echo json_encode(array_merge(["success"=>true], $r));
    $mysqli->close();
    exit;
}

$mysqli->begin_transaction();
try {
    $chk = check_allowed($mysqli, $memberId);
    if (!$chk['ok']) throw new Exception('check_failed');
    if (!$chk['allowed']) {
        $mysqli->rollback();
        echo json_encode(["success"=>false, "allowed"=>false, "window_days"=>$chk['window_days'], "downloads_in_window"=>$chk['downloads_in_window']]);
        $mysqli->close();
        exit;
    }

    $sqlIns = "INSERT INTO Download (ItemID, DownloaderID, Date) VALUES (?, ?, NOW())";
    $stIns = $mysqli->prepare($sqlIns);
    if (!$stIns) { $mysqli->rollback(); echo json_encode(["success"=>false, "error"=>"prepare_insert_failed"]); $mysqli->close(); exit; }
    $stIns->bind_param('ii', $itemId, $memberId);
    if (!$stIns->execute()) { $stIns->close(); $mysqli->rollback(); echo json_encode(["success"=>false, "error"=>"exec_insert_failed"]); $mysqli->close(); exit; }
    $stIns->close();

    $mysqli->commit();

    $sqlItem = "SELECT Title, Content FROM Item WHERE ItemID = ? LIMIT 1";
    $stItem = $mysqli->prepare($sqlItem);
    if (!$stItem) { echo json_encode(["success"=>false, "error"=>"prepare_item_failed"]); $mysqli->close(); exit; }
    $stItem->bind_param('i', $itemId);
    if (!$stItem->execute()) { $stItem->close(); echo json_encode(["success"=>false, "error"=>"exec_item_failed"]); $mysqli->close(); exit; }
    $resItem = $stItem->get_result();
    if ($resItem->num_rows === 0) { $stItem->close(); echo json_encode(["success"=>false, "error"=>"item_not_found"]); $mysqli->close(); exit; }
    $row = $resItem->fetch_assoc();
    $stItem->close();

    $title = $row['Title'] ?? "item_{$itemId}";
    $content = $row['Content'] ?? '';

    $safe = preg_replace('/[^A-Za-z0-9 _-]/', '_', $title);
    if (!$safe) $safe = "item_{$itemId}";
    $filename = $safe . '.txt';

    if (ob_get_level()) ob_end_clean();
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo $content;
    $mysqli->close();
    exit;

} catch (Exception $ex) {
    $mysqli->rollback();
    echo json_encode(["success"=>false, "error"=>"exception", "msg"=> $ex->getMessage()]);
    $mysqli->close();
    exit;
}

?>
