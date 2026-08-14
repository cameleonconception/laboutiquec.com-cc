<?php

require_once('classes/Database/Connection.php');
require_once('vendor/autoload.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


class NewPassword
{

    public function checkEmailExists($userData)
    {
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT COUNT(*) FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->execute();
        if ($stmt->fetchColumn() == 0) {
            $response = ['success' => true, 'email' => $userData['email']];
            echo json_encode($response);

        } else {
            $dbConnection = new Connection;
            $pdo = $dbConnection->getPDO();
            $sql = "UPDATE users SET newPasswordAttempt = null WHERE email = :email";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':email', $userData['email']);
            $stmt->execute();

            $this->sendTemporaryCode($userData['email']);
        }
    }

    private function sendTemporaryCode($email)
    {
        $temporaryCode = rand(100000, 999999);
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();
        $sql = "UPDATE users SET temporaryCode = :temporaryCode, updatedAt = CURRENT_TIMESTAMP WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':temporaryCode', $temporaryCode);
        $stmt->bindParam(':email', $email);
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
            $mail->addAddress($email); // Destinataire principal
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
            $mail->Subject = 'Code temporaire';

            ob_start();
            require("static-resources/emailTemplate/codeTemporaire.php");
            $message = ob_get_clean();

            $mail->Body = $message;

            $mail->send();

            $response = ['success' => true, 'email' => $email];
            echo json_encode($response);

        } catch (Exception $e) {
            $response = ['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email : ' . $mail->ErrorInfo];
            echo json_encode($response);
            return;
        }
    }

    public function validateTemporaryCode($userData)
    {

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT temporaryCode, newPasswordAttempt, updatedAt FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            if ($result['temporaryCode'] == $userData['temporaryCode']) {
                $updateAtTimestamp = new \DateTime($result['updatedAt'], new \DateTimeZone('UTC'));
                $currentTime = new \DateTime('now', new \DateTimeZone('UTC'));
                $interval = $currentTime->getTimestamp() - $updateAtTimestamp->getTimestamp();

                if ($interval <= 600) { // 10 min
                    if ($result['newPasswordAttempt'] < 3 || $result['newPasswordAttempt'] == null) {
                        $sql = "UPDATE users SET newPasswordAttempt = null WHERE email = :email";
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindParam(':email', $userData['email']);
                        $stmt->execute();

                        $response = ['success' => true, 'email' => $userData['email'], 'temporaryCode' => $userData['temporaryCode']];
                        echo json_encode($response);
                    } else {
                        $sql = "UPDATE users SET temporaryCode = NULL, newPasswordAttempt = null WHERE email = :email";
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindParam(':email', $userData['email']);
                        $stmt->execute();

                        $response = ['success' => false, 'message' => 'Vous avez atteint le nombre maximum de tentatives.', 'newTemporaryCode' => true];
                        echo json_encode($response);
                    }
                } else {
                    $sql = "UPDATE users SET temporaryCode = NULL, newPasswordAttempt = null WHERE email = :email";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':email', $userData['email']);
                    $stmt->execute();

                    $response = ['success' => false, 'message' => 'Ce code temporaire est expiré.', 'newTemporaryCode' => true];
                    echo json_encode($response);
                }
            } else {
                if ($result['newPasswordAttempt'] == null) {
                    $newPasswordAttempt = 1;
                } else {
                    $newPasswordAttempt = $result['newPasswordAttempt'] + 1;
                }

                $sql = "UPDATE users SET newPasswordAttempt = :newPasswordAttempt WHERE email = :email";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':newPasswordAttempt', $newPasswordAttempt);
                $stmt->bindParam(':email', $userData['email']);
                $stmt->execute();

                if ($newPasswordAttempt >= 3) {

                    $sql = "UPDATE users SET temporaryCode = NULL WHERE email = :email";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':email', $userData['email']);
                    $stmt->execute();

                    $response = ['success' => false, 'message' => 'Vous avez atteint le nombre maximum de tentatives.', 'newTemporaryCode' => true];
                    echo json_encode($response);

                } else {
                    $response = ['success' => false, 'message' => 'Le code temporaire est incorrect.'];
                    echo json_encode($response);
                }
            }
        } else {
            $response = ['success' => false, 'message' => 'Le code temporaire est incorrect.'];
            echo json_encode($response);
        }
    }

    public function updatePassword($userData)
    {

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "UPDATE users SET updatedAt = CURRENT_TIMESTAMP, password = :password, temporaryCode = null, loginAttempt = null WHERE email = :email AND temporaryCode = :temporaryCode";

        $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->bindParam(':temporaryCode', $userData['temporaryCode']);

        $stmt->execute();

        $rowsAffected = $stmt->rowCount();

        if ($rowsAffected > 0) {
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
                $mail->Subject = 'Nouveau mot de passe';

                ob_start();
                require("static-resources/emailTemplate/newPasswordConfirmation.php");
                $message = ob_get_clean();

                $mail->Body = $message;

                $mail->send();

                $response = ['success' => true];

            } catch (Exception $e) {
                $response = ['success' => false, 'message' => 'Erreur lors de l\'envoi de l\'email : ' . $mail->ErrorInfo];
                echo json_encode($response);
                return;
            }
        } else {
            $response = ['success' => false, 'message' => 'Un problème est survenu lors de la mise à jour du mot de passe.', 'newTemporaryCode' => true];
        }

        echo json_encode($response);

    }
}

?>






