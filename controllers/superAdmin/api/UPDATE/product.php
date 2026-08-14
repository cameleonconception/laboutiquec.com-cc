<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');
 
// 1. Récupération de l'ID (Indispensable pour savoir quel produit modifier)
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
// On récupère la valeur, on retire les espaces, et si c'est vide, on met NULL
$supplierId = !empty(trim($_POST['supplier'])) ? $_POST['supplier'] : null;

// Gestion de la personnalisation (On transforme le texte vide en null pour la BD)
$personalization = ($_POST['personalization'] === 'null' || empty(trim($_POST['personalization']))) ? null : $_POST['personalization'];

// 2. Décodage des données complexes envoyées en JSON par le JS
$categories = json_decode($_POST['categories'] ?? '[]', true);
$variants = json_decode($_POST['variants'] ?? '[]', true);
$deleteImages = json_decode($_POST['deleteImages'] ?? '[]', true);


// 3. Validations de base
if (!$id) {
    echo json_encode(['success' => false, 'message' => 'L\'ID du produit est manquant pour la mise à jour.']);
    exit();
}

if (empty(trim($sku))) {
    echo json_encode(['success' => false, 'message' => 'Le SKU est obligatoire.']);
    exit();
}

// 4. Validations spécifiques si le produit doit être Actif
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

// 5. Appel à la logique métier
$product = new Products();
$result = $product->updateProduct($_POST, $_FILES, $categories, $variants, $personalization, $supplierId, $imgNames);

// 6. Retour de la réponse finale vers le JS
echo json_encode($result);
exit();



