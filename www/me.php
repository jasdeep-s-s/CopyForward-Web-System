<?php
// by Tudor Cosmin Suciu, 40179863

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['member_id'])) { 
    http_response_code(401); 
    echo json_encode(['authenticated'=>false]); .
    exit; 
}

echo json_encode(['authenticated'=>true,'user'=>[
  'id'=>$_SESSION['member_id'],
  'role'=>$_SESSION['role'] ?? '',
  'email'=>$_SESSION['email'] ?? ''
]]);

?>