<?php

use GrahamCampbell\ResultType\Success;

require_once('classes/API/Login.php');
require_once('classes/Database/Connection.php');



class Profile{

    private function getUserId(){

        $login = new Login;
        $result = $login->validateAndDecodeToken();

        if ($result['success']) {
            $user = $result['user']; 
            return $user['id'];
           }
    }

public function validateUserIdAndEmailForPayment($receivedEmail){
    $id = $this->getUserId();

    if(isset($id) && !empty($id)){

        try {
            $dbConnection = new Connection;
            $pdo = $dbConnection->getPDO();

            $sql = "SELECT email FROM users WHERE id = :id";
            $stmt = $pdo->prepare($sql);

            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if($user !== false){ 
                if($user['email'] === $receivedEmail){
                    $response = [
                        'success' => true,
                        'id' => $id,
                        'email' => $user['email'] 
                    ];
                }else{
                    $response = [
                    'success' => false,
                    'message' => "Le courriel fourni n'est pas associé au compte connecté."
                ];
                }

                return $response;
            } else {
                $response = [
                    'success' => false,
                    'message' => "Utilisateur non trouvé."
                ];
                return $response;
            }
        } catch (PDOException $e) {
            $response = [
                'success' => false,
                'message' => "Erreur de base de données : " . $e->getMessage()
            ];
            return $response;
        }

    } else {
        $response = [
            'success' => false,
            'message' => "ID utilisateur manquant."
        ];
        return $response;
    }
}

    public function getUserInfo_id(){
        $id = $this->getUserId();

        if(isset($id) && !empty($id)){

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT id FROM users WHERE id = :id";
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);


        return $user['id'];
    }
    }

    public function getUserInfos(){
        $id = $this->getUserId();

        if(isset($id) && !empty($id)){

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT id, company, fname, lname, phone, email, address, city, country, province, postalCode FROM users WHERE id = :id";
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);


        if($user){
        $response = ['success' => true, 'userInfos' => [
            'company' => $user['company'],
            'fname' => $user['fname'],
            'lname' => $user['lname'] ,
            'email' => $user['email'] ,
            'phone' => $user['phone'] ,
            'address' => $user['address'] ,
            'city' => $user['city'],
            'province' => $user['province'] ,
            'country' => $user['country'] ,
            'postalCode' => $user['postalCode'] ]
        ];
        echo json_encode($response);
        exit();
        }else{
            $response = ['success' => false, 'message' => 'Utilisateur non trouvé.'];
            echo json_encode($response);
            exit();
        }

    }
    }

    public function getDashUsers(){

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

    if($user['role'] >= 2){
        $sql = "SELECT id, company, fname, lname, phone, email, role, address, city, country, province, postalCode FROM users";
        $stmt = $pdo->prepare($sql);

        $stmt->execute();
        $users = $stmt->fetchALL(PDO::FETCH_ASSOC);

        if($users){
            $response = ['success' => true, 'users' => $users];
            echo json_encode($response);
            exit();

    }else{
            $response = ['success' => false, 'message' => 'Vous n\'avez pas les privilèges pour accéder aux utilisateurs.'];
            echo json_encode($response);
            exit();
    }

    }
    }

    public function getUserInfoForPayment(){
        $id = $this->getUserId();

        if(isset($id) && !empty($id)){

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT * FROM users WHERE id = :id";
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);


        $response = ['success' => true, 'userInfos' => [
            'company' => $user['company'] ?? "",
            'fname' => $user['fname'] ?? "",
            'lname' => $user['lname'] ?? "",
            'email' => $user['email'] ?? "",
            'phone' => $user['phone'] ?? "",
            'address' => $user['address'] ?? "",
            'city' => $user['city'] ?? "",
            'province' => $user['province'] ?? "",
            'country' => $user['country'] ?? "",
            'postalCode' => $user['postalCode'] ?? ""]
        ];
        echo json_encode($response);
        exit();

        }else{
            header('Location: 401');
            exit;
        }
    }
    
    public function updateuUserInfos($userData){
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();


        $sql = "UPDATE users SET company = :company, fname = :fname, lname = :lname, phone = :phone, address = :address, city = :city, province = :province, country = :country, postalCode = :postalCode, updatedAt = UTC_TIMESTAMP() WHERE email = :email"; 
        
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':company', $userData['company']);
        $stmt->bindParam(':email', $userData['email']);
        $stmt->bindParam(':fname', $userData['fname']);
        $stmt->bindParam(':lname', $userData['lname']);
        $stmt->bindParam(':phone', $userData['phone']);
        $stmt->bindParam(':address', $userData['address']);
        $stmt->bindParam(':city', $userData['city']);
        $stmt->bindParam(':province', $userData['province']);
        $stmt->bindParam(':country', $userData['country']);
        $stmt->bindParam(':postalCode', $userData['postalCode']);

        try {
            $stmt->execute();
            $response = ['success' => true, 'message' => 'Informations mises à jour avec succès !', 'date'=> $userData];

            echo json_encode($response);

        } catch (\PDOException $e) {
            $response = ['success' => false, 'message' => 'Un problème est survenu lors de l\'enregistrement : ' . $e->getMessage()];
            echo json_encode($response);
        }  
}

}

?>






