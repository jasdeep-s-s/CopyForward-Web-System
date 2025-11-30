// by Tudor Cosmin Suciu, 40179863

<?php

session_start();
$_SESSION = [];
session_destroy();
header('Content-Type: application/json');

echo json_encode(['success'=>true]);

?>