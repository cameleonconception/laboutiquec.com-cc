<?php
require_once('classes/API/Products.php');
header('Content-Type: application/json');

$productsAPI = new Products();
$fileName = $_POST['file_name'] ?? '';

if (!empty($fileName)) {
    echo json_encode($productsAPI->deleteColorImage($fileName));
} else {
    echo json_encode(['success' => false, 'message' => 'Nom de fichier manquant.']);
}
