<?php
require_once('classes/API/Products.php');

header('Content-Type: application/json');
 
$sku = $_POST['sku'] ?? '';
$active = $_POST['active'] ?? '0';
$dtf = $_POST['dtf'] ?? '0';
$broderie = $_POST['broderie'] ?? '0';
$tampographie = $_POST['tampographie'] ?? '0';
$vividPrint = $_POST['vividPrint'] ?? '0';
$screenPrint = $_POST['screenPrint'] ?? '0';
$engraving = $_POST['engraving'] ?? '0';
$patch = $_POST['patch'] ?? '0';

$uvdtf = $_POST['uvdtf'] ?? '0';
$name = $_POST['name'] ?? '';
$description = $_POST['description'] ?? '';
$embroideryDetails = $_POST['embroideryDetails'] ?? '';
$tampographieDetails = $_POST['tampographieDetails'] ?? '';
$vividPrintDetails = $_POST['vividPrintDetails'] ?? '';
$screenPrintDetails = $_POST['screenPrintDetails'] ?? '';
$engravingDetails = $_POST['engravingDetails'] ?? '';
$patchDetails = $_POST['patchDetails'] ?? '';

$personalization = ($_POST['personalization'] === 'null' || empty(trim($_POST['personalization']))) ? null : $_POST['personalization'];
$supplierId = !empty(trim($_POST['supplier'])) ? $_POST['supplier'] : null;


$categories = json_decode($_POST['categories'] ?? '[]', true);
$variants = json_decode($_POST['variants'] ?? '[]', true);

$img = $_FILES['img'] ?? null;
$technicalFile = $_FILES['technicalFile'] ?? null;

if (empty(trim($sku))) {
    echo json_encode(['success' => false, 'message' => 'Le SKU est obligatoire.']);
    exit();
}

if ($active === '1') {
    if (empty(trim($name))) {
        echo json_encode(['success' => false, 'message' => 'Le nom est obligatoire pour un produit actif.']);
        exit();
    }

    if (empty(trim($description))) {
        echo json_encode(['success' => false, 'message' => 'La description est obligatoire pour un produit actif.']);
        exit();
    }

    if (empty($variants)) {
        echo json_encode(['success' => false, 'message' => 'Au moins une variante est requise pour un produit actif.']);
        exit();
    }

    // --- CORRECTION ICI : On vérifie le tableau d'images ---
    $imageValide = false;
    if (isset($img['error'])) {
        // On force en tableau pour boucler dessus (gère 1 ou plusieurs fichiers)
        $errors = (array)$img['error'];
        foreach ($errors as $err) {
            if ($err === UPLOAD_ERR_OK) {
                $imageValide = true;
                break; // On a trouvé au moins une image, c'est bon
            }
        }
    }

    if (!$imageValide) {
        echo json_encode(['success' => false, 'message' => 'Une image est obligatoire pour un produit actif.']);
        exit();
    }
    // -------------------------------------------------------

    if (!$technicalFile || $technicalFile['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Une fiche technique est obligatoire pour un produit actif.']);
        exit();
    }
}

$product = new Products();
$result = $product->addNewProducts($_POST, $_FILES, $categories, $variants, $personalization, $supplierId);

echo json_encode($result);
exit();


