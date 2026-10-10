<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');

// --- 0. TRAITEMENT DES ACTIONS AJAX SPÉCIFIQUES (JSON) ---
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true);

if (isset($jsonInput['action'])) {
    $product = new Products();

    switch ($jsonInput['action']) {
        case 'update_variant_color':
            $oldColor = $jsonInput['old_color'] ?? '';
            $newColor = $jsonInput['new_color'] ?? '';
            $productId = $jsonInput['product_id'] ?? null;

            $result = $product->updateVariantColor($oldColor, $newColor, $productId);
            echo json_encode($result);
            exit();

        case 'rename_image':
            $productId = $jsonInput['product_id'] ?? null;
            $oldFileName = $jsonInput['old_file_name'] ?? '';
            $newFileName = $jsonInput['new_file_name'] ?? '';

            $result = $product->renameProductImage($productId, $oldFileName, $newFileName);
            echo json_encode($result);
            exit();

        // ====> AJOUTER CE BLOC <====
 case 'rename_color_image':
            $oldFileName = basename(trim($jsonInput['old_file_name'] ?? ''));
            $newFileName = basename(trim($jsonInput['new_file_name'] ?? ''));

            // S'assurer de conserver l'extension d'origine si l'utilisateur ne l'a pas saisie
            $oldExt = pathinfo($oldFileName, PATHINFO_EXTENSION);
            $newExt = pathinfo($newFileName, PATHINFO_EXTENSION);
            if (empty($newExt) && !empty($oldExt)) {
                $newFileName .= '.' . $oldExt;
            }

            // Répertoire dynamique basé sur la racine du projet
            $basePath = dirname(__DIR__, 4); // Remonte jusqu'à la racine de votre application
            $colorsDir = $basePath . "/static-resources/products/colors/";

            $oldPath = $colorsDir . $oldFileName;
            $newPath = $colorsDir . $newFileName;

            if (!empty($oldFileName) && !empty($newFileName) && file_exists($oldPath)) {
                if (rename($oldPath, $newPath)) {
                    echo json_encode(['success' => true, 'message' => 'Image de couleur renommée avec succès.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Échec du renommage du fichier sur le serveur.']);
                }
            } else {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Fichier source introuvable ou paramètres invalides.'
                ]);
            }
            exit();
    }
}

// --- 1. TRAITEMENT STANDARD (Formulaire complet) ---
$id = $_POST['id'] ?? null;
$sku = $_POST['sku'] ?? '';
$oldSku = $_POST['old_sku'] ?? '';
$active = $_POST['active'] ?? '0';
$blank = $_POST['blank'] ?? '1';
$dtf = $_POST['dtf'] ?? '0';
$broderie = $_POST['broderie'] ?? '0';
$customPersonalization = $_POST['customPersonalization'] ?? '0';
$tampographie = $_POST['tampographie'] ?? '0';
$vividPrint = $_POST['vividPrint'] ?? '0';
$screenPrint = $_POST['screenPrint'] ?? '0';
$engraving = $_POST['engraving'] ?? '0';
$zoom = $_POST['zoom'] ?? '1';
$patch = $_POST['patch'] ?? '0';
$uvdtf = $_POST['uvdtf'] ?? '0';
$name = $_POST['name'] ?? '';
$description = $_POST['description'] ?? '';
$imgNames = $_POST['imgNames'] ?? [];
$blankDetailss = $_POST['blankDetails'] ?? '';
$embroideryDetails = $_POST['embroideryDetails'] ?? '';
$customPersonalizationDetails = $_POST['customPersonalizationDetails'] ?? '';
$tampographieDetails = $_POST['tampographieDetails'] ?? '';
$vividPrintDetails = $_POST['vividPrintDetails'] ?? '';
$screenPrintDetails = $_POST['screenPrintDetails'] ?? '';
$engravingDetails = $_POST['engravingDetails'] ?? '';
$patchDetails = $_POST['patchDetails'] ?? '';

$supplierId = !empty(trim($_POST['supplier'])) ? $_POST['supplier'] : null;
$personalization = ($_POST['personalization'] === 'null' || empty(trim($_POST['personalization']))) ? null : $_POST['personalization'];

$categories = json_decode($_POST['categories'] ?? '[]', true);
$variants = json_decode($_POST['variants'] ?? '[]', true);
$deleteImages = json_decode($_POST['deleteImages'] ?? '[]', true);

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'L\'ID du produit est manquant pour la mise à jour.']);
    exit();
}

if (empty(trim($sku))) {
    echo json_encode(['success' => false, 'message' => 'Le SKU est obligatoire.']);
    exit();
}

if ($active === '1') {
    if (empty(trim($name))) {
        echo json_encode(['success' => false, 'message' => 'Un nom est requis pour un produit actif.']);
        exit();
    }
    if (empty(trim($description))) {
        echo json_encode(['success' => false, 'message' => 'Une description est requise pour un produit actif.']);
        exit();
    }
    if (empty($variants)) {
        echo json_encode(['success' => false, 'message' => 'Au moins une variante est requise pour un produit actif.']);
        exit();
    }
}

$product = new Products();
$result = $product->updateProduct($_POST, $_FILES, $categories, $variants, $personalization, $supplierId, $imgNames);

echo json_encode($result);
exit();