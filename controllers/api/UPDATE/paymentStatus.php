
<?php

    require_once('classes/API/Order.php');
    require_once('vendor/autoload.php');

$success_post_value = $_POST['success'] ?? '0'; 

// Correction : On force la conversion en bool�en.
// Si c'est '1', �a devient true. Si c'est '0', �a devient false.
$success = $success_post_value === '1';

if (!in_array($success_post_value, ['0', '1'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valeur de statut de paiement invalide.']);
    exit;
}

if ($success) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Le statut payé doit être confirmé côté serveur par le fournisseur de paiement.'
    ]);
    exit;
}

$id = $_POST['id'] ?? null;
$paymentError = $_POST['paymentError'] ?? null;
$paymentCardCompany = $_POST['paymentCardCompany'] ?? null;
$paymentId = $_POST['paymentId'] ?? null;
$paymentCardNumber = $_POST['paymentCardNumber'] ?? null;
$variantsToUpdate = $_POST['variantsToUpdate'] ?? null;
$email = $_POST['email'] ?? null;
    

    
    if ($success) { // Maintenant, ceci est un vrai bool�en, true ou false
        $order = new Order();
        $order->updatePaymentId($paymentId, $id, $variantsToUpdate, $email, $paymentCardCompany, $paymentCardNumber);
        
    } else {
        $order = new Order();
        $order->updatePaymentError($paymentError, $id, $paymentCardCompany, $paymentCardNumber); 
    }
?>


