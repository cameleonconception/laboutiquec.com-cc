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

if(isset($_POST['temporaryCode'])){
    $required = isRequired('temporaryCode', $requiredFieldsName);
    $temporaryCode = $FORM->validateTemporaryCode($_POST['temporaryCode'], $required);
    if(!$temporaryCode['success']){
        $errors['temporaryCode'] = $temporaryCode['message'];
    }
    $temporaryCode = $temporaryCode['value'];
    $userData['temporaryCode'] = $temporaryCode;
}else{
    $userData['temporaryCode'] = null;
}

if(isset($_POST['password'])){
    $required = isRequired('password', $requiredFieldsName);
    $password = $FORM->validatePassword($_POST['password'], $required);
    if(!$password['success']){
        $errors['password'] = $password['message'];
    }
    $password = $password['value'];
    $userData['password'] = $password;
}else{
    $userData['password'] = null;
}

if (isset($_POST['confirmedPassword']) && !(isset($_POST['password']) && !$required && empty($_POST['password']))) {
    if (empty($_POST['confirmedPassword'])) {
        $errors['confirmedPassword'] = 'Vous devez confirmer votre mot de passe.';
    } elseif ($password !== $_POST['confirmedPassword']) {
        $errors['confirmedPassword'] = 'Les mots de passe ne sont pas identiques.';
    }
    $confirmedPassword = htmlspecialchars($_POST['confirmedPassword']);
}



if(count($errors) > 0){
    $response = ['success'=>false,'errors' => $errors];
    echo json_encode($response);
}else{
    $newPassword = new NewPassword();
    $newPassword->updatePassword($userData);
}

?>






