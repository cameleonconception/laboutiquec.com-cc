<?php
// Configuration du chemin de base
$baseDir = 'static-resources/temp-designs/';

// Lecture des données JSON reçues
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['signature'])) {
    echo json_encode(['status' => 'error', 'message' => 'Données invalides']);
    exit;
}

$signature = $data['signature']; // Exemple: studio_1700000000
// Création du sous-dossier spécifique au design
$designDir = $baseDir . $signature . '/';

if (!file_exists($designDir)) {
    mkdir($designDir, 0777, true);
}

$responseViews = [];

foreach ($data['views'] as $vIdx => $view) {
    // 1. Sauvegarde de la Preview (Vêtement + Logos)
    // Nomenclature demandée : preview_v1.png, preview_v2.png, etc.
    $previewName = "preview_v" . ($vIdx + 1) . ".png";
    $previewPath = $designDir . $previewName;
    
    // Extraction et décodage du base64
    $previewData = explode(',', $view['previewWithLogos'])[1];
    file_put_contents($previewPath, base64_decode($previewData));

    $savedLogos = [];
    
    // 2. Sauvegarde de chaque logo individuel
    foreach ($view['logos'] as $lIdx => $logo) {
        // Nomenclature demandée : logo_v1_n1.png, logo_v1_n2.png, etc.
        $logoName = "logo_v" . ($vIdx + 1) . "_n" . ($lIdx + 1) . ".png";
        $logoPath = $designDir . $logoName;
        
        $logoData = explode(',', $logo['src'])[1];
        file_put_contents($logoPath, base64_decode($logoData));
        
        $savedLogos[] = [
            'width' => $logo['width'],
            'height' => $logo['height'],
            'url'   => $logoPath // On retourne le chemin relatif vers le fichier
        ];
    }

    $responseViews[] = [
        'viewImage'  => $view['viewImage'],
        'previewUrl' => $previewPath,
        'logos'      => $savedLogos
    ];
}

// Retourne le succès et les nouveaux chemins vers les fichiers
echo json_encode(['status' => 'success', 'views' => $responseViews]);