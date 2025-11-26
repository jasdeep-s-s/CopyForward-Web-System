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
    echo json_encode(["success" => false, "step" => "db_connect", "error" => $mysqli->connect_error]);
    exit;
}

$report = isset($_GET['report']) ? trim($_GET['report']) : '';

try {
    if ($report === 'growth_usage') {
        $sql = "SELECT i.Type, COUNT(i.ItemID) AS ItemCount, (COUNT(i.ItemID) * 100.0 / 
                (SELECT COUNT(*) 
                FROM Item 
                WHERE Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)'))) AS ItemPercentage
            FROM Item i
            WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')
            GROUP BY i.Type";

        $res = $mysqli->query($sql);
        if (!$res) throw new Exception($mysqli->error);

        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['ItemCount'] = isset($r['ItemCount']) ? intval($r['ItemCount']) : 0;
            $r['ItemPercentage'] = isset($r['ItemPercentage']) ? floatval($r['ItemPercentage']) : 0.0;
            $rows[] = $r;
        }

        echo json_encode($rows);
        exit;
    }

    if ($report === 'annual_access') {
        $sql = "SELECT i.Type, COUNT(d.ItemID) AS DownloadCount
            FROM Item i
            LEFT JOIN Download d ON i.ItemID = d.ItemID
            WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')
            GROUP BY i.Type";

        $res = $mysqli->query($sql);
        if (!$res) throw new Exception($mysqli->error);

        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['DownloadCount'] = isset($r['DownloadCount']) ? intval($r['DownloadCount']) : 0;
            $rows[] = $r;
        }

        echo json_encode($rows);
        exit;
    }

        if ($report === 'annual_by_country') {
                $sql = "SELECT a.Country, COUNT(d.ItemID) AS DownloadCount
                        FROM Item i
                        LEFT JOIN Download d ON i.ItemID = d.ItemID
                        LEFT JOIN Member m ON m.MemberID = d.DownloaderID
                        LEFT JOIN Address a ON m.AddressID = a.AddressID
                        WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)') AND a.Country IS NOT NULL
                        GROUP BY a.Country";

        $res = $mysqli->query($sql);
        if (!$res) throw new Exception($mysqli->error);

        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['DownloadCount'] = isset($r['DownloadCount']) ? intval($r['DownloadCount']) : 0;
            $rows[] = $r;
        }

        echo json_encode($rows);
        exit;
    }

    if ($report === 'annual_by_author') {
           $sql = "SELECT COALESCE(a.Name, 'Unknown') AS Name, COALESCE(a.Organization, '') AS Organization, COUNT(d.ItemID) AS DownloadCount
              FROM Item i
              LEFT JOIN Download d ON i.ItemID = d.ItemID
              LEFT JOIN Member a ON i.AuthorID = a.ORCID
              WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')
              GROUP BY a.Name, a.Organization
              ORDER BY DownloadCount DESC";

        $res = $mysqli->query($sql);
        if (!$res) throw new Exception($mysqli->error);

        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['DownloadCount'] = isset($r['DownloadCount']) ? intval($r['DownloadCount']) : 0;
            $r['Organization'] = isset($r['Organization']) ? $r['Organization'] : '';
            $rows[] = $r;
        }

        echo json_encode($rows);
        exit;
    }

    if ($report === 'top_items') {
        $sql = "SELECT i.ItemID, i.Title, COALESCE(a.Name, 'Unknown') AS Author, i.Type, COUNT(d.ItemID) AS DownloadCount
            FROM Item i
            LEFT JOIN Download d ON i.ItemID = d.ItemID
            LEFT JOIN Member a ON i.AuthorID = a.ORCID
            WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')
            GROUP BY i.ItemID, i.Title, a.Name, i.Type
            ORDER BY DownloadCount DESC
            LIMIT 10";

        $res = $mysqli->query($sql);
        if (!$res) throw new Exception($mysqli->error);

        $rows = [];
        while ($r = $res->fetch_assoc()) {
            $r['DownloadCount'] = isset($r['DownloadCount']) ? intval($r['DownloadCount']) : 0;
            $r['ItemID'] = isset($r['ItemID']) ? $r['ItemID'] : null;
            $r['Title'] = isset($r['Title']) ? $r['Title'] : '';
            $r['Author'] = isset($r['Author']) ? $r['Author'] : 'Unknown';
            $r['Type'] = isset($r['Type']) ? $r['Type'] : '';
            $rows[] = $r;
        }

        echo json_encode($rows);
        exit;
    }

    $totals = [];

    $q = $mysqli->query("SELECT COUNT(*) AS c FROM Member");
    $totals['totalMembers'] = $q ? intval($q->fetch_assoc()['c']) : 0;

    // total items excluding removed or under-review uploads
    $q = $mysqli->query("SELECT COUNT(*) AS c FROM Item WHERE Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')");
    $totals['totalItems'] = $q ? intval($q->fetch_assoc()['c']) : 0;

    // total downloads for items that are not removed / under review
    $q = $mysqli->query("SELECT COUNT(d.ItemID) AS c FROM Download d JOIN Item i ON d.ItemID = i.ItemID WHERE i.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')");
    $totals['totalDownloads'] = $q ? intval($q->fetch_assoc()['c']) : 0;

    // total donations for items that are not removed / under review
    $q = $mysqli->query("SELECT COALESCE(SUM(don.Amount),0) AS s FROM Donation don JOIN Item i2 ON don.ItemID = i2.ItemID WHERE i2.Status NOT IN ('Removed','Under Review (Upload)', 'Deleted (Author)')");
    $totals['totalDonations'] = $q ? floatval($q->fetch_assoc()['s']) : 0.0;

    echo json_encode($totals);
} catch (Exception $ex) {
    echo json_encode(["success" => false, "error" => $ex->getMessage()]);
} finally {
    $mysqli->close();
}

?>
