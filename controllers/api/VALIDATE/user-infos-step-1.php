<?php 

require_once('classes/Form/Validation.php');
require_once('classes/API/Profile.php');

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

if(isset($_POST['fname'])){
    $required = isRequired('fname', $requiredFieldsName);
    $fname = $FORM->validateFname($_POST['fname'], $required);
    if(!$fname['success']){
        $errors['fname'] = $fname['message'];
    }
    $fname = $fname['value'];
    $userData['fname'] = $fname;
}else{
    $userData['fname'] = null;
}

if(isset($_POST['lname'])){
    $required = isRequired('lname', $requiredFieldsName);
    $lname = $FORM->validateLname($_POST['lname'], $required);
    if(!$lname['success']){
        $errors['lname'] = $lname['message'];
    }
    $lname = $lname['value'];
    $userData['lname'] = $lname;
}else{
    $userData['lname'] = null;
}


if(isset($_POST['phone'])){
    $required = isRequired('phone', $requiredFieldsName);
    $phone = $FORM->validatePhone($_POST['phone'], $required);
    if(!$phone['success']){
        $errors['phone'] = $phone['message'];
    }
    $phone = $phone['value'];
    $userData['phone'] = $phone;
}else{
    $userData['phone'] = null;
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
    $response = ['success'=>true];
    echo json_encode($response);
}

?>






