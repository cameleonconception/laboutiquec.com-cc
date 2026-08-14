<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');

// 1. Récupération de l'ID du produit à dupliquer
$id = $_POST['id'] ?? null;

// 2. Validation basique
if (!$id) {
    echo json_encode(['success' => false, 'message' => 'L\'ID du produit d\'origine est manquant.']);
    exit();
}

// 3. Appel de la méthode métier de duplication
$products = new Products();
$result = $products->duplicateProduct($id);

// 4. Envoi de la réponse JSON au JavaScript
echo json_encode($result);
exit();