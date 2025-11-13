<?php
$pdo = new PDO('mysql:host=database;dbname=docker;charset=utf8', 'docker', 'docker');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
return $pdo;
