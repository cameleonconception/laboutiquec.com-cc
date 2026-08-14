<?php

require_once('classes/Database/Connection.php');
require_once('classes/API/Login.php');
require_once('vendor/autoload.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Signup
{

    public function checkEmailExists($email)
    {
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT COUNT(*) FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        return $stmt->fetchColumn() > 0;
    }

    public function createUser($userData)
    {
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        if ($this->checkEmailExists($userData['email'])) {
            $response = ['success' => false, 'message' => 'Cette adresse courriel est déjà utilisé.'];
            echo json_encode($response);
            return;
        }

        $sql = "INSERT INTO users (fname, lname, email, password, company, phone, gender, birthday, address, city, province, country, postalCode, createdAt, updatedAt)
                VALUES (:fname, :lname, :email, :password, :company, :phone, :gender, :birthday, :address, :city, :province, :country, :postalCode, UTC_TIMESTAMP(), UTC_TIMESTAMP())";

        $stmt = $pdo->prepare($sql);

        $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

        $stmt->bindParam(':fname', $userData['fname']);
        $stmt->bindParam(':lname', $userData['lname']);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':company', $userData['company']);
        $stmt->bindParam(':phone', $userData['phone']);
        $stmt->bindParam(':gender', $userData['gender']);
        $stmt->bindParam(':birthday', $userData['birthday']);
        $stmt->bindParam(':address', $userData['address']);
        $stmt->bindParam(':city', $userData['city']);
        $stmt->bindParam(':province', $userData['province']);
        $stmt->bindParam(':country', $userData['country']);
        $stmt->bindParam(':postalCode', $userData['postalCode']);

        try {
            $stmt->execute();

            $mail = new PHPMailer(true);
            try {
                $mail->CharSet = 'UTF-8';

                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'info@cameleonconception.com';
                $mail->Password = 'wngu mfov cdtq tkak';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;


                // Destinataires
                $mail->setFrom('info@cameleonconception.com', 'Caméléon conception');
                $mail->addAddress($userData['email']); // Destinataire principal
                //$mail->addBCC('info@cameleonconception.com'); // Vous-même en CCI

                // Identifiant de l'image Google Drive pour le logo
                $google_drive_logo_id = '1VdjL0BYyxgHgYjtkaEma5Z8DRtYyfYp5';
                $google_drive_logo_url = 'https://drive.google.com/uc?export=view&id=' . $google_drive_logo_id;

                // Récupérer le contenu de l'image du logo depuis l'URL
                $logo_data = file_get_contents($google_drive_logo_url);
                if ($logo_data === false) {
                    throw new Exception("Impossible de récupérer le logo depuis Google Drive.");
                }

                // CORRECTION : Utiliser addStringEmbeddedImage pour l'intégration
                // 'logo_cameleon' est le Content ID (cid) utilisé dans la balise <img>
                $mail->addStringEmbeddedImage($logo_data, 'logo_cameleon', 'logo_cameleon.jpg', 'base64', 'image/jpeg');

                // Contenu de l'e-mail
                $mail->isHTML(true);
                $mail->Subject = 'Bienvenue sur La Boutique C';

                ob_start();
                require("static-resources/emailTemplate/signupConfirmation.php");
                $message = ob_get_clean();

                $mail->Body = $message;

                $mail->send();


                $login = new Login;
                $login->createConnectionFromSignup([
                    'id' => $pdo->lastInsertId(),
                    'role' => 0
                ]);

                $response = ['success' => true, 'message' => 'Enregistrement réussi.'];


                echo json_encode($response);

            } catch (Exception $e) {
                $response = ['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email : ' . $mail->ErrorInfo];
                echo json_encode($response);
                return;
            }

        } catch (\PDOException $e) {
            $response = ['success' => false, 'message' => 'Un problème est survenu lors de l\'enregistrement : ' . $e->getMessage()];
            echo json_encode($response);
        }
    }
}






