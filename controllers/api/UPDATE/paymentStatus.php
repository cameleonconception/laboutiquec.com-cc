
<?php

    require_once('classes/API/Order.php');
    require_once('vendor/autoload.php');

$success_post_value = $_POST['success'] ?? '0'; 

// Correction : On force la conversion en booléen.
// Si c'est '1', ça devient true. Si c'est '0', ça devient false.
$success = (bool) $success_post_value; 

$id = $_POST['id'] ?? null;
$paymentError = $_POST['paymentError'] ?? null;
$paymentCardCompany = $_POST['paymentCardCompany'] ?? null;
$paymentId = $_POST['paymentId'] ?? null;
$paymentCardNumber = $_POST['paymentCardNumber'] ?? null;
$variantsToUpdate = $_POST['variantsToUpdate'] ?? null;
$email = $_POST['email'] ?? null;
    

    
    if ($success) { // Maintenant, ceci est un vrai booléen, true ou false
        $order = new Order();
        $order->updatePaymentId($paymentId, $id, $variantsToUpdate, $email, $paymentCardCompany, $paymentCardNumber);
        
    } else {
        $order = new Order();
        $order->updatePaymentError($paymentError, $id, $paymentCardCompany, $paymentCardNumber); 
    }
?>



