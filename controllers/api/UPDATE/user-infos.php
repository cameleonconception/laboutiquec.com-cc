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

if(isset($_POST['company'])){
    $required = isRequired('company', $requiredFieldsName);
    $company = $FORM->validateCompany($_POST['company'], $required);
    if(!$company['success']){
        $errors['company'] = $company['message'];
    }
    $company = $company['value'];
    $userData['company'] = $company;
}else{
    $userData['company'] = null;
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
    $profile = new Profile();
    $profile->updateuUserInfos($userData);
}

?>






