<?php

class FormValidation {

    public function validateTemporaryCode($temporaryCode, $required) {
        $regex = '/^[0-9]{6}$/';
        $temporaryCode = trim($temporaryCode);

        if (!$required && empty($temporaryCode)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($temporaryCode)) {
            return [
                'success' => false,
                'message' => 'Le code temporaire ne peut pas être vide.',
                'value' => htmlspecialchars($temporaryCode)
            ];
        }
        if (mb_strlen($temporaryCode, 'UTF-8') != 6 || !preg_match($regex, $temporaryCode)) {
            return [
                'success' => false,
                'message' => 'Le code temporaire doit être de 6 chiffres.',
                'value' => htmlspecialchars($temporaryCode)
            ];
        }
        return [
            'success' => true,
            'value' => htmlspecialchars($temporaryCode)
        ];
    }

    public function validateFname($fname, $required) {
        $regex = '/^[a-zA-ZÀ-ÿ\s\'-]+$/u';
        $fname = trim($fname);

        if (!$required && empty($fname)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($fname)) {
            return [
                'success' => false,
                'message' => 'Le prénom ne peut pas être vide.',
                'value' => htmlspecialchars($fname)
            ];
        }
        if (mb_strlen($fname, 'UTF-8') < 2 || mb_strlen($fname, 'UTF-8') > 50) {
            return [
                'success' => false,
                'message' => 'Le prénom doit contenir entre 2 et 50 caractères.',
                'value' => htmlspecialchars($fname)
            ];
        }
        if (!preg_match($regex, $fname)) {
            return [
                'success' => false,
                'message' => 'Le prénom n\'est pas valide.',
                'value' => htmlspecialchars($fname)
            ];
        }
        $fname = mb_convert_case($fname, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($fname)
        ];
    }

    public function validateLname($lname, $required) {
        $regex = '/^[a-zA-ZÀ-ÿ\s\'-]+$/u';
        $lname = trim($lname);

        if (!$required && empty($lname)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($lname)) {
            return [
                'success' => false,
                'message' => 'Le nom ne peut pas être vide.',
                'value' => htmlspecialchars($lname)
            ];
        }
        if (mb_strlen($lname, 'UTF-8') < 2 || mb_strlen($lname, 'UTF-8') > 100) {
            return [
                'success' => false,
                'message' => 'Le nom doit contenir entre 2 et 100 caractères.',
                'value' => htmlspecialchars($lname)
            ];
        }
        if (!preg_match($regex, $lname)) {
            return [
                'success' => false,
                'message' => 'Le nom n\'est pas valide.',
                'value' => htmlspecialchars($lname)
            ];
        }
        $lname = mb_convert_case($lname, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($lname)
        ];
    }

    public function validateCompany($company, $required) {
        $regex = '/^[\p{L}\p{N}\s\p{P}\'_-]{1,255}$/u';
        $company = trim($company);

        if (!$required && empty($company)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($company)) {
            return [
                'success' => false,
                'message' => 'Le nom de l\'entreprise ne peut pas être vide.',
                'value' => htmlspecialchars($company)
            ];
        }
        if (mb_strlen($company, 'UTF-8') < 2 || mb_strlen($company, 'UTF-8') > 255) {
            return [
                'success' => false,
                'message' => 'Le nom de l\'entreprise doit contenir entre 2 et 255 caractères.',
                'value' => htmlspecialchars($company)
            ];
        }
        if (!preg_match($regex, $company)) {
            return [
                'success' => false,
                'message' => 'Le nom de l\'entreprise contient des caractères non autorisés.',
                'value' => htmlspecialchars($company)
            ];
        }
        $company = mb_convert_case($company, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($company)
        ];
    }

    public function validatePhone($phone, $required) {
        $regex = '/^\(\d{3}\)\s\d{3}-\d{4}$/';
        $phone = trim($phone);

        if (!$required && empty($phone)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($phone)) {
            return [
                'success' => false,
                'message' => 'Le téléphone ne peut pas être vide.',
                'value' => htmlspecialchars($phone)
            ];
        }
        if (!preg_match($regex, $phone)) {
            return [
                'success' => false,
                'message' => 'Le format du téléphone doit être (xxx) xxx-xxxx.',
                'value' => htmlspecialchars($phone)
            ];
        }
        $cleanedPhone = preg_replace('/[^0-9]/', '', $phone);
        if (mb_strlen($cleanedPhone, 'UTF-8') !== 10) {
            return [
                'success' => false,
                'message' => 'Le numéro de téléphone doit contenir exactement 10 chiffres.',
                'value' => htmlspecialchars($phone)
            ];
        }
        return [
            'success' => true,
            'value' => $cleanedPhone
        ];
    }

    public function validateGender($gender, $required) {
        $options = ['F', 'M', 'O'];
        $gender = trim($gender);

        if (!$required && empty($gender)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($gender) || !in_array($gender, $options) || mb_strlen($gender, 'UTF-8') > 1) {
            return [
                'success' => false,
                'message' => 'Vous devez sélectionner un genre valide.',
                'value' => htmlspecialchars($gender)
            ];
        }
        return [
            'success' => true,
            'value' => htmlspecialchars($gender)
        ];
    }

    public function validateBirthday($birthday, $required) {
        $regex = '/^\d{4}-\d{2}-\d{2}$/';
        $birthday = trim($birthday);

        if (!$required && empty($birthday)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($birthday)) {
            return [
                'success' => false,
                'message' => 'La date de naissance ne peut pas être vide.',
                'value' => htmlspecialchars($birthday)
            ];
        }
        if (!preg_match($regex, $birthday)) {
            return [
                'success' => false,
                'message' => 'Le format de la date de naissance doit être AAAA-MM-JJ.',
                'value' => htmlspecialchars($birthday)
            ];
        }
        $dateObject = DateTime::createFromFormat('Y-m-d', $birthday);
        if ($dateObject === false || $dateObject->format('Y-m-d') !== $birthday) {
            return [
                'success' => false,
                'message' => 'La date de naissance n\'est pas une date valide.',
                'value' => htmlspecialchars($birthday)
            ];
        }
        $today = new DateTime();
        if ($dateObject > $today) {
            return [
                'success' => false,
                'message' => 'La date de naissance ne peut pas être dans le futur.',
                'value' => htmlspecialchars($birthday)
            ];
        }
        $cleanedBirthday = preg_replace('/[^0-9]/', '', $birthday);
        if (mb_strlen($cleanedBirthday, 'UTF-8') !== 8) {
            return [
                'success' => false,
                'message' => 'La date de naissance doit contenir exactement 8 chiffres.',
                'value' => htmlspecialchars($birthday)
            ];
        }
        return [
            'success' => true,
            'value' => $cleanedBirthday
        ];
    }

    public function validateAddress($address, $required) {
        $address = trim($address);

        if (!$required && empty($address)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($address)) {
            return [
                'success' => false,
                'message' => 'L\'adresse ne peut pas être vide.',
                'value' => htmlspecialchars($address)
            ];
        }
        if (mb_strlen($address, 'UTF-8') < 2 || mb_strlen($address, 'UTF-8') > 255) {
            return [
                'success' => false,
                'message' => 'L\'adresse doit contenir entre 2 et 255 caractères.',
                'value' => htmlspecialchars($address)
            ];
        }
        return [
            'success' => true,
            'value' => htmlspecialchars($address)
        ];
    }

    public function validateCity($city, $required) {
        $city = trim($city);

        if (!$required && empty($city)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($city)) {
            return [
                'success' => false,
                'message' => 'La ville ne peut pas être vide.',
                'value' => htmlspecialchars($city)
            ];
        }
        if (mb_strlen($city, 'UTF-8') < 2 || mb_strlen($city, 'UTF-8') > 100) {
            return [
                'success' => false,
                'message' => 'La ville doit contenir entre 2 et 100 caractères.',
                'value' => htmlspecialchars($city)
            ];
        }
        $city = mb_convert_case($city, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($city)
        ];
    }

    public function validateProvince($province, $required) {
        $province = trim($province);

        if (!$required && empty($province)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($province)) {
            return [
                'success' => false,
                'message' => 'La province ne peut pas être vide.',
                'value' => htmlspecialchars($province)
            ];
        }
        if (mb_strlen($province, 'UTF-8') < 2 || mb_strlen($province, 'UTF-8') > 50) {
            return [
                'success' => false,
                'message' => 'La province doit contenir entre 2 et 50 caractères.',
                'value' => htmlspecialchars($province)
            ];
        }
        $province = mb_convert_case($province, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($province)
        ];
    }

    public function validateCountry($country, $required) {
        $country = trim($country);

        if (!$required && empty($country)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($country)) {
            return [
                'success' => false,
                'message' => 'Le pays ne peut pas être vide.',
                'value' => htmlspecialchars($country)
            ];
        }
        if (mb_strlen($country, 'UTF-8') < 2 || mb_strlen($country, 'UTF-8') > 100) {
            return [
                'success' => false,
                'message' => 'Le pays doit contenir entre 2 et 100 caractères.',
                'value' => htmlspecialchars($country)
            ];
        }
        $country = mb_convert_case($country, MB_CASE_TITLE, "UTF-8");
        return [
            'success' => true,
            'value' => htmlspecialchars($country)
        ];
    }

    public function validatePostalCode($postalCode, $required) {
        $postalCode = trim($postalCode);

        if (!$required && empty($postalCode)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($postalCode)) {
            return [
                'success' => false,
                'message' => 'Le code postal ne peut pas être vide.',
                'value' => ''
            ];
        }
        $postalCode = strtoupper($postalCode);
        $cleanedPostalCode = preg_replace('/[^A-Z0-9]/', '', $postalCode);
        if (mb_strlen($cleanedPostalCode, 'UTF-8') < 5 || mb_strlen($cleanedPostalCode, 'UTF-8') > 9) {
            return [
                'success' => false,
                'message' => 'Le code postal doit contenir entre 5 et 9 caractères alphanumériques.',
                'value' => htmlspecialchars($postalCode)
            ];
        }
        return [
            'success' => true,
            'value' => $cleanedPostalCode
        ];
    }

    public function validateEmail($email, $required) {
        $email = trim($email);

        if (!$required && empty($email)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($email)) {
            return [
                'success' => false,
                'message' => 'L\'adresse courriel ne peut pas être vide.',
                'value' => htmlspecialchars($email)
            ];
        }
        if (mb_strlen($email, 'UTF-8') < 2 || mb_strlen($email, 'UTF-8') > 255) {
            return [
                'success' => false,
                'message' => 'L\'adresse courriel doit contenir entre 2 et 255 caractères.',
                'value' => htmlspecialchars($email)
            ];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'L\'adresse courriel n\'est pas valide.',
                'value' => htmlspecialchars($email)
            ];
        }
        $email = strtolower($email);
        return [
            'success' => true,
            'value' => htmlspecialchars($email)
        ];
    }

    public function validateLoginEmail($email, $required) {
        $email = trim($email);

        if (!$required && empty($email)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($email)) {
            return [
                'success' => false,
                'message' => 'L\'adresse courriel ne peut pas être vide.',
                'value' => htmlspecialchars($email)
            ];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'L\'adresse courriel n\'est pas valide.',
                'value' => htmlspecialchars($email)
            ];
        }
        $email = strtolower($email);
        return [
            'success' => true,
            'value' => htmlspecialchars($email)
        ];
    }

    public function validateLoginPassword($password, $required) {
        $password = trim($password);

        if (!$required && empty($password)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe ne peut pas être vide.',
                'value' => htmlspecialchars($password)
            ];
        }
        return [
            'success' => true,
            'value' => htmlspecialchars($password)
        ];
    }

    public function validatePassword($password, $required) {
        $password = trim($password);

        if (!$required && empty($password)) {
            return [
                'success' => true,
                'value' => null
            ];
        }
        if (empty($password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe ne peut pas être vide.',
                'value' => htmlspecialchars($password)
            ];
        }
        if (mb_strlen($password, 'UTF-8') < 8 || mb_strlen($password, 'UTF-8') > 255) {
            return [
                'success' => false,
                'message' => 'Le mot de passe doit contenir entre 8 et 255 caractères.',
                'value' => htmlspecialchars($password)
            ];
        }
        if (!preg_match('/[A-Z]/', $password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe doit inclure au moins une lettre majuscule.',
                'value' => htmlspecialchars($password)
            ];
        }
        if (!preg_match('/[a-z]/', $password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe doit inclure au moins une lettre minuscule.',
                'value' => htmlspecialchars($password)
            ];
        }
        if (!preg_match('/[0-9]/', $password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe doit inclure au moins un chiffre.',
                'value' => htmlspecialchars($password)
            ];
        }
        if (!preg_match('/[!@#$%^&*]/', $password)) {
            return [
                'success' => false,
                'message' => 'Le mot de passe doit inclure au moins un caractère spécial (!@#$%^&*).',
                'value' => htmlspecialchars($password)
            ];
        }
        return [
            'success' => true,
            'value' => $password
        ];
    }

    public function validateNotes($notes, $required) {
        $notes = trim($notes);

        if (!$required && empty($notes)) {
            return [
                'success' => true,
                'value' => null
            ];
        }

        if (empty($notes)) {
            return [
                'success' => false,
                'message' => 'Vous devez inscrire une note.',
                'value' => htmlspecialchars($notes)
            ];
        }
        if (mb_strlen($notes, 'UTF-8') < 2 || mb_strlen($notes, 'UTF-8') > 255) {
            return [
                'success' => false,
                'message' => 'Les notes doit contenir entre 2 et 255 caractères.',
                'value' => htmlspecialchars($notes)
            ];
        }
        return [
            'success' => true,
            'value' => htmlspecialchars($notes)
        ];
    }
}

?>







