<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');

$id = $_POST['id'] ?? null;
$sku = $_POST['sku'] ?? null;

if (!$id || !$sku) {
    echo json_encode(['success' => false, 'message' => 'ID ou SKU manquant.']);
    exit();
}

$product = new Products();
$result = $product->deleteProduct($id, $sku);

echo json_encode($result);
exit();



