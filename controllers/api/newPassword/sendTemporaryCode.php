<?php 

require_once('classes/Form/Validation.php');
require_once('classes/API/NewPassword.php');

$errors = [];
$userData = [];

$FORM = new FormValidation;

$requiredFieldsName = isset($_POST['requiredFieldsName']) ? json_decode($_POST['requiredFieldsName'], true) : [];
if (!is_array($requiredFieldsName)) {
    $requiredFieldsName = [];
}

function isRequired($field, $requiredFieldsName) {
    return in_array($field, $requiredFieldsName);
}

if(isset($_POST['email'])){
    $required = isRequired('email', $requiredFieldsName);
    $email = $FORM->validateEmail($_POST['email'], $required);
    if(!$email['success']){
        $errors['email'] = $email['message'];
    }
    $email = $email['value'];
    $userData['email'] = strtolower(trim($email));
}else{
    $userData['email'] = null;
}


if(count($errors) > 0){
    $response = ['success'=>false,'errors' => $errors];
    echo json_encode($response);
}else{
    $newPassword = new NewPassword();
    $newPassword->checkEmailExists($userData);
}

?>






