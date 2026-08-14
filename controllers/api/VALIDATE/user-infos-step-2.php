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

if(isset($_POST['address'])){
    $required = isRequired('address', $requiredFieldsName);
    $address = $FORM->validateAddress($_POST['address'], $required);
    if(!$address['success']){
        $errors['address'] = $address['message'];
    }
    $address = $address['value'];
    $userData['address'] = $address;
}else{
    $userData['address'] = null;
}

if(isset($_POST['city'])){
    $required = isRequired('city', $requiredFieldsName);
    $city = $FORM->validateCity($_POST['city'], $required);
    if(!$city['success']){
        $errors['city'] = $city['message'];
    }
    $city = $city['value'];
    $userData['city'] = $city;
}else{
    $userData['city'] = null;
}

if(isset($_POST['province'])){
    $required = isRequired('province', $requiredFieldsName);
    $province = $FORM->validateProvince($_POST['province'], $required);
    if(!$province['success']){
        $errors['province'] = $province['message'];
    }
    $province = $province['value'];
    $userData['province'] = $province;
}else{
    $userData['province'] = null;
}

if(isset($_POST['country'])){
    $required = isRequired('country', $requiredFieldsName);
    $country = $FORM->validateCountry($_POST['country'], $required);
    if(!$country['success']){
        $errors['country'] = $country['message'];
    }
    $country = $country['value'];
    $userData['country'] = $country;
}else{
    $userData['country'] = null;
}

if(isset($_POST['postalCode'])){
    $required = isRequired('postalCode', $requiredFieldsName);
    $postalCode = $FORM->validatePostalCode($_POST['postalCode'], $required);
    if(!$postalCode['success']){
        $errors['postalCode'] = $postalCode['message'];
    }
    $postalCode = $postalCode['value'];
    $userData['postalCode'] = $postalCode;
}else{
    $userData['postalCode'] = null;
}


if(count($errors) > 0){
    $response = ['success'=>false,'errors' => $errors];
    echo json_encode($response);
}else{
    $response = ['success'=>true];
    echo json_encode($response);
}

?>






