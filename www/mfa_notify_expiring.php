<?php
//by Tudor Cosmin Suciu 40179863

// Triggering this endpoint will check and notify moderators about MFA matrices expiring within 48h.
header('Content-Type: application/json');

require __DIR__ . '/db.php';
require_once __DIR__ . '/mfa_lib.php';

$result = mfa_notify_mods_about_expiring($mysqli, new DateTimeImmutable('now'), 48);
echo json_encode($result);

?>
