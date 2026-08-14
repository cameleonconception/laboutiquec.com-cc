<?php

// Définition de l'en-tête pour indiquer au client qu'il s'agit de JSON
header('Content-Type: application/json');

// DEMO ACCESS
$accountID = "0022923"; 
$UserID = "apiuser"; 
$PIN = "WNCJBZFC7WKY2KO1BK9PIS1V0HOLQA51ZB2LJZ85X6QN5H7OGJVDT71X40429LD7"; 
$url = "https://api.demo.convergepay.com/hosted-payments/transaction_token"; 


// PRODUCTION ACCESS
#$accountID = "2712202"; 
#$UserID = "apiuser523783"; 
#$PIN = "6EXCFMYYMHAJB6PW70KHAALZVH68ULR4YQ6TRW4WYWJFN3PERD1A83V1W4KA8P3K"; 
#$url = "https://api.convergepay.com/hosted-payments/transaction_token"; 

// Lecture des variables POST, avec une vérification pour éviter les erreurs si elles sont manquantes
$firstname = $_POST['ssl_first_name'] ?? ''; 
$lastname = $_POST['ssl_last_name'] ?? ''; 
$amount = $_POST['ssl_amount'] ?? ''; 
$email = $_POST['ssl_email'] ?? ''; 
$phone = $_POST['ssl_phone'] ?? ''; 


// 1. Initialisation de la requête cURL
$ch = curl_init(); 
curl_setopt($ch, CURLOPT_URL, $url); 
curl_setopt($ch, CURLOPT_POST, true); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_VERBOSE, false); // Mis à false pour ne pas polluer la sortie JSON

// Définition des champs POST pour la requête de jeton
$post_fields = 
    "ssl_account_id=" . urlencode($accountID) .
    "&ssl_user_id=" . urlencode($UserID) .
    "&ssl_pin=" . urlencode($PIN) .
    "&ssl_transaction_type=ccauthonly" .
    "&ssl_first_name=" . urlencode($firstname) .
    "&ssl_last_name=" . urlencode($lastname) .
    "&ssl_email=" . urlencode($email) .
    "&ssl_phone=" . urlencode($phone) .
    "&ssl_get_token=Y" .
    "&ssl_add_token=Y" .
    "&ssl_amount=" . urlencode($amount);

curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);

// 2. Exécution de la requête
$result = curl_exec($ch); 
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$response = [];

// 3. Gestion des erreurs cURL
if (curl_errno($ch)) {
    $response = [
        'success' => false, 
        'message' => 'Erreur cURL lors de la communication avec Converge: ' . curl_error($ch)
    ];
    curl_close($ch);
    echo json_encode($response);
    exit;
}

// 4. Gestion des erreurs HTTP (Réponse non 200)
if ($http_code !== 200) {
    $response = [
        'success' => false, 
        'message' => 'Erreur HTTP du serveur Converge: Code ' . $http_code,
        // Inclure le corps de la réponse pour le débogage côté client
        'body' => $result 
    ];
    curl_close($ch);
    echo json_encode($response);
    exit;
}

// 5. Traitement de la réponse Converge (Réponse 200)

// Converge renvoie un jeton brut ou un message d'erreur dans le corps $result.
// Nous supposons que $result est le jeton en cas de succès.
// S'il y a un format spécifique à parser (XML, autre), cette partie devra être ajustée.

if (!empty($result)) {
    // Si la réponse n'est pas vide (on assume que c'est le token de succès)
    $response = [
        'success' => true, 
        'message' => 'Jeton généré avec succès.',
        'token' => trim($result) // On renvoie le jeton
    ];
} else {
    // Si la réponse est vide (cas imprévu après un code 200)
    $response = [
        'success' => false, 
        'message' => 'Réponse vide reçue de Converge malgré un code HTTP 200.'
    ];
}

curl_close($ch); 

// 6. Affichage de la réponse finale
echo json_encode($response);
?>



