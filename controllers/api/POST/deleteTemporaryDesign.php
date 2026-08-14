<?php

// 1. Configuration du chemin de base (doit être identique au script d'ajout)
$baseDir = 'static-resources/temp-designs/';

// 2. Lecture des données JSON reçues
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['signature'])) {
    echo json_encode(['status' => 'error', 'message' => 'Signature manquante']);
    exit;
}

$signature = $data['signature'];
$designDir = $baseDir . $signature . '/';

// 3. Vérification et suppression
if (file_exists($designDir) && is_dir($designDir)) {
    
    // On récupère tous les fichiers à l'intérieur du dossier (logos et previews)
    $files = array_diff(scandir($designDir), array('.', '..'));
    
    foreach ($files as $file) {
        $filePath = $designDir . $file;
        if (is_file($filePath)) {
            unlink($filePath); // Supprime chaque image .png
        }
    }

    // Une fois vide, on supprime le dossier de la signature
    if (rmdir($designDir)) {
        echo json_encode(['status' => 'success', 'message' => 'Design temporaire supprimé du serveur']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Impossible de supprimer le dossier']);
    }
    
} else {
    // Si le dossier n'existe déjà plus, on considère cela comme un succès
    echo json_encode(['status' => 'success', 'message' => 'Le dossier n\'existe pas ou a déjà été supprimé']);
}