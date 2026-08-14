<?php

require_once('classes/API/Login.php');

$login = new Login();
$validationResult = $login->validateAndDecodeToken();

if ($validationResult['success']) {
    echo json_encode(['success' => true]);
    exit;
} else {
    echo json_encode(['success' => false]);
    exit;
}






