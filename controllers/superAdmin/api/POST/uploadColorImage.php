<?php

require_once('classes/API/Products.php');

header('Content-Type: application/json');

$productsAPI = new Products();

// On vérifie le nom EXACT envoyé par le JS : 'color_img'
if (isset($_FILES['color_img'])) {
    // On passe tout l'index 'color_img' à la classe
    $result = $productsAPI->uploadColorImage($_FILES['color_img']);
    echo json_encode($result);
} else {
    echo json_encode(['success' => false, 'message' => 'Aucun fichier reçu (champ color_img manquant).']);
}
