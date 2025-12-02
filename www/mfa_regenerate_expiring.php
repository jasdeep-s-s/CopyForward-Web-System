<?php
//by Tudor Cosmin Suciu 40179863

// Regenerate MFA matrices expiring within 48 hours and notify affected users.
header('Content-Type: application/json');

require __DIR__ . '/db.php';
require_once __DIR__ . '/mfa_lib.php';

$result = mfa_regenerate_expiring_users($mysqli, new DateTimeImmutable('now'), 48, '+30 days');
echo json_encode($result);
