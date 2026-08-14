<?php

require_once('classes/Database/Connection.php');
require_once('classes/API/PreOrder.php');
require_once('classes/API/Profile.php');
require_once('vendor/autoload.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
class Order{
    
public function addOrder($userId, $company, $fname, $lname, $phone, $userEmail, $address, $city, $province, $country, $postalCode, $subtotal, $shipping, $tps, $tvq, $total, $details, $shippingAddress, $notes) {

    $handlingFees = 0;
    $creditCardFees = 0;
    
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    $openPreOrder = new PreOrder();
    $openPreOrder = $openPreOrder->returnOpenPreOrderId();

    $sqlOrder = "INSERT INTO orders (clientId, company, fname, lname, phone, clientEmail, address, city, province, country, postalCode, date, subtotal, shipping, tps, tvq, total, details, shippingAddress, status, notes, preOrderId, handlingFees, creditCardFees)
                VALUES (:clientId, :company, :fname, :lname, :phone, :clientEmail, :address, :city, :province, :country, :postalCode, UTC_TIMESTAMP(), :subtotal, :shipping, :tps, :tvq, :total, :details, :shippingAddress, 1, :notes, :preOrderId, :handlingFees, :creditCardFees)";

    $stmt = $pdo->prepare($sqlOrder);
    // ... (tes bindings restent identiques) ...
    $stmt->bindParam(':clientId', $userId);
    $stmt->bindParam(':company', $company);
    $stmt->bindParam(':fname', $fname);
    $stmt->bindParam(':lname', $lname);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':clientEmail', $userEmail);
    $stmt->bindParam(':address', $address);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':province', $province);
    $stmt->bindParam(':country', $country);
    $stmt->bindParam(':postalCode', $postalCode);
    $stmt->bindParam(':subtotal', $subtotal);
    $stmt->bindParam(':shipping', $shipping);
    $stmt->bindParam(':tps', $tps);
    $stmt->bindParam(':tvq', $tvq);
    $stmt->bindParam(':total', $total);
    $stmt->bindParam(':details', $details);
    $stmt->bindParam(':shippingAddress', $shippingAddress);
    $stmt->bindParam(':notes', $notes);
    $stmt->bindParam(':preOrderId', $openPreOrder);
    $stmt->bindParam(':handlingFees', $handlingFees);
    $stmt->bindParam(':creditCardFees', $creditCardFees);

    try {
        $pdo->beginTransaction();
        $stmt->execute();
        $lastInsertId = $pdo->lastInsertId();
        
        // Mise à jour profil utilisateur
        $sqlUpdateUser = "UPDATE users SET address = :address, city = :city, province = :province, country = :country, postalCode = :postalCode WHERE id = :userId";
        $stmtUser = $pdo->prepare($sqlUpdateUser);
        $stmtUser->execute([
            ':address' => $address, ':city' => $city, ':province' => $province, 
            ':country' => $country, ':postalCode' => $postalCode, ':userId' => $userId
        ]);

        $pdo->commit();

        // --- PRÉPARATION DU TABLEAU DE RETOUR POUR updatePaymentId ---
        $detailsArray = json_decode($details, true);
        $variantsToUpdate = [];

        if (is_array($detailsArray)) {
            foreach ($detailsArray as $product) {
                // On récupère la signature du design au niveau du produit
                $sig = $product['designSignature'] ?? null;

                if (isset($product['sizes']) && is_array($product['sizes'])) {
                    foreach ($product['sizes'] as $variant) {
                        $variantId = $variant['variantId'] ?? null;
                        $quantity = $variant['qte'] ?? 0;
                        if ($variantId !== null && $quantity > 0) {
                            $variantsToUpdate[] = [
                                'variantId' => (int)$variantId,
                                'qte'       => (int)$quantity,
                                'designSignature' => $sig
                            ];
                        }
                    }
                }
            }
        }
        

        // 3. ENVOI DE L'E-MAIL DE CONFIRMATION
        $mail = new PHPMailer(true);
        try {
            $mail->CharSet = 'UTF-8';

            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'info@cameleonconception.com';
            $mail->Password = 'wngu mfov cdtq tkak'; // Attention à l'utilisation de mot de passe en clair (app passwords)
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Destinataires
            $mail->setFrom('info@cameleonconception.com', 'Caméléon conception');
            $mail->addAddress($userEmail); 
            $mail->addBCC('laboutiquec@cameleonconception.com');

            // Intégration du logo
            $google_drive_logo_id = '1VdjL0BYyxgHgYjtkaEma5Z8DRtYyfYp5';
            $google_drive_logo_url = 'https://drive.google.com/uc?export=view&id=' . $google_drive_logo_id;
            $logo_data = file_get_contents($google_drive_logo_url);
            
            if ($logo_data === false) {
                 // Si on ne peut pas récupérer le logo, cela ne devrait pas empêcher la confirmation
                 // On peut choisir d'ignorer ou de logger l'erreur. Ici, on va juste logger/ignorer l'intégration.
            } else {
                $mail->addStringEmbeddedImage($logo_data, 'logo_cameleon', 'logo_cameleon.jpg', 'base64', 'image/jpeg');
            }

            // Contenu de l'e-mail
            $mail->isHTML(true);
            $mail->Subject = 'Demande de soumission web #' . $lastInsertId;
            
            ob_start();
            // Assurez-vous que ce fichier existe et utilise le Content ID 'cid:logo_cameleon'
            require("static-resources/emailTemplate/orderConfirmation.php"); 
            $message = ob_get_clean();

            $mail->Body = $message;

            $mail->send();

        return [
            'success' => true, 
            'lastInsertId' => $lastInsertId, 
            'variantsToUpdate' => $variantsToUpdate 
        ];

        } catch (Exception $e) {
            // CAS 2: Succès DB/Stock, Échec Email
            // Nous considérons toujours cela comme un succès côté client car le paiement est validé.
            $response = ['success' => true, 'message' => 'Votre commande a bien été reçue, mais nous n\'avons pas été en mesure de vous envoyer la confirmation par courriel.'];
        }


    } catch (\PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

public function updatePaymentId($paymentId, $orderId, $variantsToUpdate, $email, $paymentCardCompany, $paymentCardNumber){
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    $response = []; // Initialisation de la variable de réponse

    // 1. Mise à jour du statut de la commande (Succès du paiement)
    $sql = "UPDATE orders SET paymentId = :paymentId, status = :status, paymentError = :paymentError, updatedAt = UTC_TIMESTAMP(), paymentCardCompany = :paymentCardCompany, paymentCardNumber = :paymentCardNumber WHERE id = :orderId"; 
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':status', 1); // Status 1 indique le succès du paiement
    $stmt->bindValue(':paymentError', null);
    $stmt->bindParam(':paymentId', $paymentId);
    $stmt->bindParam(':orderId', $orderId);
    $stmt->bindParam(':paymentCardCompany', $paymentCardCompany);
    $stmt->bindParam(':paymentCardNumber', $paymentCardNumber);

    try {
        $stmt->execute();

            $decodedVariants = json_decode($variantsToUpdate, true);
        
            if (is_array($decodedVariants)) {
                $variantsToUpdate = $decodedVariants;
            } else {
                $variantsToUpdate = [];
            }
        // 2. LOGIQUE DE MISE À JOUR DES STOCKS
        if (is_array($variantsToUpdate) && !empty($variantsToUpdate)) {
            
            // PREMIÈRE BOUCLE : Mise à jour des stocks SQL
            foreach ($variantsToUpdate as $variant) {
                $variantId = $variant['variantId'] ?? null;
                $quantityOrdered = $variant['qte'] ?? 0;

                if ($variantId > 0 && $quantityOrdered > 0) {
                    $sqlCheckStock = "SELECT stock FROM product_size_color_price WHERE id = :variantId";
                    $stmtCheckStock = $pdo->prepare($sqlCheckStock);
                    $stmtCheckStock->bindParam(':variantId', $variantId, \PDO::PARAM_INT);
                    $stmtCheckStock->execute();
                    $currentStock = $stmtCheckStock->fetchColumn(); 

                    if (strval($currentStock) !== '-') {
                        $sqlUpdateStock = "UPDATE product_size_color_price SET stock = stock - :qte WHERE id = :variantId";
                        $stmtUpdateStock = $pdo->prepare($sqlUpdateStock);
                        $stmtUpdateStock->bindParam(':qte', $quantityOrdered, \PDO::PARAM_INT);
                        $stmtUpdateStock->bindParam(':variantId', $variantId, \PDO::PARAM_INT);
                        $stmtUpdateStock->execute();
                    }
                }
            } // Fin de la boucle des stocks

            // DEUXIÈME BOUCLE DANS updatePaymentId : Déplacement des dossiers Studio
            $tempBaseDir = 'static-resources/temp-designs/';

            foreach ($variantsToUpdate as $variant) {
                if (!empty($variant['designSignature'])) {
                    $signature = $variant['designSignature'];
                    
                    // Chemin source (ex: static-resources/temp-designs/studio_12345)
                    $sourcePath = $tempBaseDir . $signature;
                    
                    // Chemin destination (ex: static-resources/orders/502/studio_12345)
                    // On crée un dossier par signature à l'intérieur du dossier de commande
                    $orderBaseDir = 'static-resources/orders/' . $orderId . '/';
                    $destPath = $orderBaseDir . $signature;

                    if (file_exists($sourcePath) && !file_exists($destPath)) {
                        if (!file_exists($orderBaseDir)) {
                            mkdir($orderBaseDir, 0777, true);
                        }
                        // Déplacement complet du dossier
                        rename($sourcePath, $destPath);
                    }
                }
            }
        } // Fin du bloc if is_array


        // 3. ENVOI DE L'E-MAIL DE CONFIRMATION
        $mail = new PHPMailer(true);
        try {
            $mail->CharSet = 'UTF-8';

            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'info@cameleonconception.com';
            $mail->Password = 'wngu mfov cdtq tkak'; // Attention à l'utilisation de mot de passe en clair (app passwords)
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Destinataires
            $mail->setFrom('info@cameleonconception.com', 'Caméléon conception');
            $mail->addAddress($email); 
            $mail->addBCC('laboutiquec@cameleonconception.com');

            // Intégration du logo
            $google_drive_logo_id = '1VdjL0BYyxgHgYjtkaEma5Z8DRtYyfYp5';
            $google_drive_logo_url = 'https://drive.google.com/uc?export=view&id=' . $google_drive_logo_id;
            $logo_data = file_get_contents($google_drive_logo_url);
            
            if ($logo_data === false) {
                 // Si on ne peut pas récupérer le logo, cela ne devrait pas empêcher la confirmation
                 // On peut choisir d'ignorer ou de logger l'erreur. Ici, on va juste logger/ignorer l'intégration.
            } else {
                $mail->addStringEmbeddedImage($logo_data, 'logo_cameleon', 'logo_cameleon.jpg', 'base64', 'image/jpeg');
            }

            // Contenu de l'e-mail
            $mail->isHTML(true);
            $mail->Subject = 'Commande #' . $orderId;
            
            ob_start();
            // Assurez-vous que ce fichier existe et utilise le Content ID 'cid:logo_cameleon'
            require("static-resources/emailTemplate/orderConfirmation.php"); 
            $message = ob_get_clean();

            $mail->Body = $message;

            $mail->send();

            // CAS 1: Succès total (DB, Stock, Email)
            $response = ['success' => true, 'message' => 'Votre commande a bien été reçue ! Vous pouvez suivre le statut de votre commande dans votre compte.'];

        } catch (Exception $e) {
            // CAS 2: Succès DB/Stock, Échec Email
            // Nous considérons toujours cela comme un succès côté client car le paiement est validé.
            $response = ['success' => true, 'message' => 'Votre commande a bien été reçue, mais nous n\'avons pas été en mesure de vous envoyer la confirmation par courriel.'];
        }

        // ENVOI DE LA RÉPONSE JSON (Quoi qu'il arrive après l'étape 1)
        echo json_encode($response);

    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Un problème est survenu lors de l\'enregistrement de votre commande : ' . $e->getMessage()];
        echo json_encode($response);
    } 
}

public function updatePaymentError($paymentMessage, $orderId){
    // Étape 1: Connexion à la base de données
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    
    // Initialisation de la variable de réponse
    $response = [];


    // Étape 2: Requête SQL
    $sql = "UPDATE orders SET status = :status, paymentError = :paymentError, updatedAt = UTC_TIMESTAMP(), paymentCardCompany = :paymentCardCompany, paymentCardNumber = :paymentCardNumber WHERE id = :orderId"; 
    $stmt = $pdo->prepare($sql);
    
    // Étape 3: Liaison des valeurs
    $stmt->bindValue(':status', 1);
    $stmt->bindParam(':paymentError', $paymentMessage);
    $stmt->bindParam(':orderId', $orderId);
    $stmt->bindParam(':paymentCardCompany', $paymentCardCompany);
    $stmt->bindParam(':paymentCardNumber', $paymentCardNumber);

    try {
        // Étape 4: Exécution
        $stmt->execute();
        
        // On construit la réponse de succès
        $response = ['success' => false, 'message' => $paymentMessage];

    } catch (\PDOException $e) {
        
        // On construit la réponse d'erreur
        $response = ['success' => false, 'message' => 'Un problème est survenu lors de l\'enregistrement de votre commande : ' . $e->getMessage()];
    }
    
    // --- NOUVEAU : Affichage de la réponse JSON ---
    // On définit l'en-tête pour indiquer au client qu'il s'agit de JSON
    header('Content-Type: application/json');
    
    // On affiche le JSON
    echo json_encode($response);
    
    // On arrête l'exécution de la fonction/script ici, car la réponse a été envoyée
    exit; // Utiliser exit; est une bonne pratique quand on termine avec un echo JSON.
}


public function getMyOrders()
{
    // 1. Initialisation des variables
    $sql = ''; // Initialiser la requête SQL
    $params = []; // Initialiser le tableau de paramètres pour la requête préparée

    // 2. Récupération de l'ID de l'utilisateur
    // Note : Créer un nouvel objet à chaque appel de fonction peut être coûteux.
    // Il serait préférable d'injecter ou d'utiliser une instance déjà existante si possible.
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();

    // 3. Connexion à la base de données
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    // 4. Vérification du rôle de l'utilisateur
    try {
        $sqlRole = "SELECT role FROM users WHERE id = :id";
        $stmtRole = $pdo->prepare($sqlRole);
        // L'ID utilisateur est toujours un entier (nous utilisons \PDO::PARAM_INT)
        $stmtRole->bindValue(':id', $userId, \PDO::PARAM_INT);
        $stmtRole->execute();
        $user = $stmtRole->fetch(\PDO::FETCH_ASSOC);
    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur lors de la vérification du rôle.'];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }

        // Rôle Client ou autre : accès à SES commandes uniquement (status > 0 et clientId = :clientId)
        
        // Le clientId est toujours nécessaire pour les utilisateurs non-admin
        $params[':clientId'] = $userId;
            // Requête pour TOUTES les commandes du client
            $sql = "SELECT * FROM orders WHERE clientId = :clientId AND status > 0 ORDER BY id DESC";
            // Le paramètre :clientId est déjà défini

    // 6. Gestion des cas où la requête SQL n'a pas pu être construite (ex: rôle non trouvé)
    if (empty($sql)) {
        $response = ['success' => false, 'message' => 'Rôle utilisateur invalide ou non trouvé.'];
        http_response_code(403); // Interdit
        echo json_encode($response);
        exit();
    }
    
    // 7. Exécution de la requête des commandes
    try {
        $stmt = $pdo->prepare($sql);

        // Liaison des paramètres
        foreach ($params as $key => $value) {
            // Utiliser PDO::PARAM_INT pour les IDs pour une meilleure sécurité si la clé contient 'Id'
            $paramType = (str_contains($key, 'Id') || str_contains($key, 'id')) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
            $stmt->bindValue($key, $value, $paramType);
        }
        
        $stmt->execute();
            
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // N'afficher handlingFees / creditCardFees que pour les utilisateurs avec role > 0
        $isPrivileged = isset($user['role']) && ((int)$user['role'] > 0);
        if (!$isPrivileged && is_array($orders)) {
            foreach ($orders as &$order) {
                unset($order['handlingFees'], $order['creditCardFees']);
            }
            unset($order); // rompre la référence
        }

        $response = ['success' => true, 'orders' => $orders];
        echo json_encode($response);
        exit();

    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur de base de données : ' . $e->getMessage()];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }
}

public function getOrders($orderId)
{
    // 1. Initialisation des variables
    $sql = ''; // Initialiser la requête SQL
    $params = []; // Initialiser le tableau de paramètres pour la requête préparée

    // 2. Récupération de l'ID de l'utilisateur
    // Note : Créer un nouvel objet à chaque appel de fonction peut être coûteux.
    // Il serait préférable d'injecter ou d'utiliser une instance déjà existante si possible.
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();

    // 3. Connexion à la base de données
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    // 4. Vérification du rôle de l'utilisateur
    try {
        $sqlRole = "SELECT role FROM users WHERE id = :id";
        $stmtRole = $pdo->prepare($sqlRole);
        // L'ID utilisateur est toujours un entier (nous utilisons \PDO::PARAM_INT)
        $stmtRole->bindValue(':id', $userId, \PDO::PARAM_INT);
        $stmtRole->execute();
        $user = $stmtRole->fetch(\PDO::FETCH_ASSOC);
    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur lors de la vérification du rôle.'];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }


    // 5. Construction de la requête principale et des paramètres
    // Le rôle 1 est généralement un Administrateurx
    if ($user && $user['role'] >= 1) {
        // Rôle Administrateur : accès à TOUTES les commandes (status > 0)
        
        if ($orderId !== null && is_numeric($orderId)) {
            // Requête pour une commande spécifique
            $sql = "SELECT * FROM orders WHERE status >= 0 AND id = :orderId";
            $params[':orderId'] = $orderId; // Ajouter le paramètre orderId
        } else {
            // Requête pour TOUTES les commandes
            $sql = "SELECT * FROM orders WHERE status >= 0 ORDER BY id DESC";
            // Pas de paramètres spécifiques nécessaires dans ce cas
        }
    } else {
        // Rôle Client ou autre : accès à SES commandes uniquement (status > 0 et clientId = :clientId)
        
        // Le clientId est toujours nécessaire pour les utilisateurs non-admin
        $params[':clientId'] = $userId;
        
        if ($orderId !== null && is_numeric($orderId)) {
            // Requête pour une commande spécifique du client
            $sql = "SELECT * FROM orders WHERE clientId = :clientId AND status > 0 AND id = :orderId";
            $params[':orderId'] = $orderId; // Ajouter le paramètre orderId
        } else {
            // Requête pour TOUTES les commandes du client
            $sql = "SELECT * FROM orders WHERE clientId = :clientId AND status > 0 ORDER BY id DESC";
            // Le paramètre :clientId est déjà défini
        }
    }

    // 6. Gestion des cas où la requête SQL n'a pas pu être construite (ex: rôle non trouvé)
    if (empty($sql)) {
        $response = ['success' => false, 'message' => 'Rôle utilisateur invalide ou non trouvé.'];
        http_response_code(403); // Interdit
        echo json_encode($response);
        exit();
    }
    
    // 7. Exécution de la requête des commandes
    try {
        $stmt = $pdo->prepare($sql);

        // Liaison des paramètres
        foreach ($params as $key => $value) {
            // Utiliser PDO::PARAM_INT pour les IDs pour une meilleure sécurité si la clé contient 'Id'
            $paramType = (str_contains($key, 'Id') || str_contains($key, 'id')) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
            $stmt->bindValue($key, $value, $paramType);
        }
        
        $stmt->execute();
            
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // N'afficher handlingFees / creditCardFees que pour les utilisateurs avec role > 0
        $isPrivileged = isset($user['role']) && ((int)$user['role'] > 0);
        if (!$isPrivileged && is_array($orders)) {
            foreach ($orders as &$order) {
                unset($order['handlingFees'], $order['creditCardFees']);
            }
            unset($order); // rompre la référence
        }

        $response = ['success' => true, 'role' => $user['role'],  'orders' => $orders];
        echo json_encode($response);
        exit();

    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur de base de données : ' . $e->getMessage()];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }
}

public function getDashOrders($preOrderId)
{
    // 1. Initialisation des variables
    $sql = ''; // Initialiser la requête SQL
    $params = []; // Initialiser le tableau de paramètres pour la requête préparée

    // 2. Récupération de l'ID de l'utilisateur
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();


    $preOrders = new PreOrder();
    $retrunedPreOrders = $preOrders->returnPreOrder();

    // 3. Connexion à la base de données
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    // 4. Vérification du rôle de l'utilisateur
    try {
        $sqlRole = "SELECT role FROM users WHERE id = :id";
        $stmtRole = $pdo->prepare($sqlRole);
        $stmtRole->bindValue( ':id', $userId, \PDO::PARAM_INT);
        $stmtRole->execute();
        $user = $stmtRole->fetch(\PDO::FETCH_ASSOC);
    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur lors de la vérification du rôle.'];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }


    // 5. Construction de la requête principale et des paramètres
    // Le rôle 1 est généralement un Administrateur
    if ($user && ( (int)$user['role'] === 1 || (int)$user['role'] === 2) ) { // Utiliser (int) pour la robustesse

        // On crée la base de la requête
        $sql = "SELECT * FROM orders WHERE status >= 0";
        
        // CORRECTION 1: On vérifie l'existence et la non-nullité/non-vide de l'ID
        if (!empty($preOrderId)) {
            // CORRECTION 2: S'assurer que le nom de la colonne et le placeholder sont corrects
            // J'assume que la colonne est 'preOrderId' dans la table 'orders'
            $sql .= " AND preOrderId = :preOrderId";
            // CORRECTION 3: Ajouter le paramètre à l'array $params pour la liaison ultérieure
            $params[':preOrderId'] = $preOrderId;
        }
        
        // Ajout de l'ordre de tri final
        $sql .= " ORDER BY id DESC";

    } else {
        $response = ['success' => false, 'message' => 'Vous devez être administrateur.'];
        http_response_code(403); // 403 est plus précis pour l'accès non autorisé
        echo json_encode($response);
        exit();
    }

    // 6. Gestion des cas où la requête SQL n'a pas pu être construite (ex: rôle non trouvé)
    if (empty($sql)) {
        $response = ['success' => false, 'message' => 'Rôle utilisateur invalide ou non trouvé.'];
        http_response_code(403);
        echo json_encode($response);
        exit();
    }
    
    // 7. Exécution de la requête des commandes (simplifiée et corrigée)
    try {
        // CORRECTION 4: On prépare la requête ici, quel que soit le filtre
        $stmt = $pdo->prepare($sql);

        // Liaison des paramètres (y compris :preOrderId si présent)
        foreach ($params as $key => $value) {
            // Utiliser PDO::PARAM_INT pour les IDs
            $stmt->bindValue($key, $value, \PDO::PARAM_INT);
        }
        
        $stmt->execute();
            
        $orders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // ... (suite du code pour le calcul des totaux et la réponse) ...
        $finalSubtotal = 0.00;
        $finalShipping = 0.00;
        $finalTPS = 0.00;
        $finalTVQ = 0.00;
        $finalTotal = 0.00;

        foreach ($orders as $order){
            $finalSubtotal = floatval($finalSubtotal) + floatval($order['subtotal']);
            $finalShipping = floatval($finalShipping) + floatval($order['shipping']);
            $finalTPS = floatval($finalTPS) + floatval($order['tps']);
            $finalTVQ = floatval($finalTVQ) + floatval($order['tvq']);
            $finalTotal = floatval($finalTotal) + floatval($order['total']);
        }

        $response = [
            'success' => true, 
            'orders' => $orders, 
            'preOrders' => $retrunedPreOrders, 
            'subtotal' => round($finalSubtotal, 2),
            'shipping' => round($finalShipping, 2),
            'tps' => round($finalTPS, 2),
            'tvq' => round($finalTVQ, 2),
            'total' => round($finalTotal, 2)
        ];
        
        header('Content-Type: application/json'); // Bonne pratique
        echo json_encode($response);
        exit();

    } catch (\PDOException $e) {
        $response = ['success' => false, 'message' => 'Erreur de base de données : ' . $e->getMessage()];
        http_response_code(500);
        echo json_encode($response);
        exit();
    }
}

public function updateOrderStatus($id, $newStatus, $shippingLink, $shippingMessage){
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    
    $response = ['success' => false, 'message' => 'Erreur inconnue.'];
    $clientEmail = null;
    
    // S'assurer que les deux champs sont des chaînes (vides si null)
    $shippingLink = $shippingLink ?? ''; 
    $shippingMessage = $shippingMessage ?? '';
    
    if (intval($id) && intval($newStatus)) {

        // --- 1. RÉCUPÉRATION DE L'EMAIL CLIENT ---
        try {
            $sqlSelect = "SELECT clientEmail, fname FROM orders WHERE id = :orderId";
            $stmtSelect = $pdo->prepare($sqlSelect);
            $stmtSelect->bindParam(':orderId', $id, \PDO::PARAM_INT);
            $stmtSelect->execute();
            $orderData = $stmtSelect->fetch(\PDO::FETCH_ASSOC);

            if ($orderData) {
                $clientEmail = $orderData['clientEmail'];
                $fname = $orderData['fname'];
            } else {
                $response = ['success' => false, 'message' => 'Commande non trouvée pour la mise à jour.'];
                echo json_encode($response);
                exit();
            }
        } catch (\PDOException $e) {
            $response = ['success' => false, 'message' => 'Erreur lors de la recherche de l\'email : ' . $e->getMessage()];
            echo json_encode($response);
            exit();
        }
        
        // --- 2. MISE À JOUR DU STATUT ---
        try {
            // 🌟 MISE À JOUR SQL pour inclure les deux colonnes
            $sqlUpdate = "UPDATE orders SET status = :status, shippingLink = :shippingLink, shippingMessage = :shippingMessage, updatedAt = UTC_TIMESTAMP() WHERE id = :orderId"; 
            $stmtUpdate = $pdo->prepare($sqlUpdate);
            $stmtUpdate->bindValue(':status', $newStatus, \PDO::PARAM_INT);
            $stmtUpdate->bindParam(':orderId', $id, \PDO::PARAM_INT);
            $stmtUpdate->bindParam(':shippingLink', $shippingLink); 
            $stmtUpdate->bindParam(':shippingMessage', $shippingMessage); // 🌟 Bind de la nouvelle variable

            $stmtUpdate->execute();
            
            $response = ['success' => true, 'message' => 'Le statut a été mis à jour !'];

        } catch (\PDOException $e) {
            $response = ['success' => false, 'message' => 'Un problème est survenu lors de l\'enregistrement : ' . $e->getMessage()];
            echo json_encode($response);
            exit();
        } 
        
        // --- 3. ENVOI DE L'EMAIL ---
        /*
        if ($clientEmail) {
            $phpMailerClassName = class_exists('\PHPMailer\PHPMailer\PHPMailer') ? '\PHPMailer\PHPMailer\PHPMailer' : 'PHPMailer';
            $mail = new $phpMailerClassName(true);
            try {
                $mail->CharSet = 'UTF-8';

                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'info@cameleonconception.com';
                $mail->Password = 'wngu mfov cdtq tkak';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;


                $mail->setFrom('info@cameleonconception.com', 'Caméléon conception');
                $mail->addAddress($clientEmail); 

                
                $google_drive_logo_id = '1VdjL0BYyxgHgYjtkaEma5Z8DRtYyfYp5';
                $google_drive_logo_url = 'https://drive.google.com/uc?export=view&id=' . $google_drive_logo_id;
                $logo_data = file_get_contents($google_drive_logo_url);
                
                if ($logo_data === false) {
                    throw new Exception("Impossible de récupérer le logo depuis Google Drive.");
                }

                $mail->addStringEmbeddedImage($logo_data, 'logo_cameleon', 'logo_cameleon.jpg', 'base64', 'image/jpeg');

                $mail->isHTML(true);
                $mail->Subject = 'Mise à jour de votre Commande #' . $id;
                
                ob_start();
                // $shippingLink et $shippingMessage sont maintenant disponibles dans le template email
                require("static-resources/emailTemplate/updateOrderStatusTo-".$newStatus.".php");
                $message = ob_get_clean();

                $mail->Body = $message;
                $mail->send();

                $response['message'] .= ' Email de statut envoyé.';


            } catch (Exception $e) {
                $response['message'] .= ' Attention: Échec de l\'envoi de l\'email (' . $mail->ErrorInfo . ')';
            }
        }
        */
        
        echo json_encode($response);
        exit();

    } else {
        $response = ['success' => false, 'message' => 'L\'ID et/ou le statut ne sont pas valides.'];
        echo json_encode($response);
        exit();
    }
}
}

?>






