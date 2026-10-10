<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true);

$fileName = $jsonInput['file_name'] ?? $_POST['file_name'] ?? '';

if (empty($fileName)) {
    echo json_encode(['success' => false, 'message' => 'Nom de fichier manquant.']);
    exit();
}

$product = new Products();
$result = $product->deleteColorImage($fileName);

echo json_encode($result);
exit();