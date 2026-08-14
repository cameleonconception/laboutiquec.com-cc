<?php

use GrahamCampbell\ResultType\Success;

require_once('classes/API/Profile.php');
require_once('classes/Database/Connection.php');



class Suppliers{

    public function getSuppliers(){

    $profile = new Profile();
    $userId = $profile->getUserInfo_id();
    
    $whereClauses = [];
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRole = $stmtRole->fetchColumn();

    if ((int)$userRole === 2) {
            $sql = "SELECT * FROM suppliers";
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $suppliersList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
            'success' => true,
            'suppliers' => $suppliersList
            ]);
            exit();
    } else {
        echo json_encode([
            'success' => false,
            'message' => "Vous ne disposez pas des droit pour accéder aux fournisseurs"
        ]);
        exit();
    }

    }

    public function addSupplier() {
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();
    
    $dbConnection = new Connection();
    $pdo = $dbConnection->getPDO();
    
    // 1. Vérification des droits (Role 2 = Super Admin)
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRole = $stmtRole->fetchColumn();

    if ((int)$userRole !== 2) {
        echo json_encode(['success' => false, 'message' => "Accès refusé"]);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $id = isset($input['id']) ? (int)$input['id'] : null;
    $name = trim($input['name']);
    $shippingCost = (float)$input['shippingCost'];
    
    // Gestion du NULL pour la base de données
    $freeShippingAt = ($input['freeShippingAt'] === null || $input['freeShippingAt'] === "") 
                      ? null 
                      : (float)$input['freeShippingAt'];

    try {
        $sql = "INSERT INTO suppliers (id, name, shippingCost, freeShippingAt) 
                VALUES (:id, :name, :cost, :free)
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                shippingCost = VALUES(shippingCost), 
                freeShippingAt = VALUES(freeShippingAt)";
        
        $stmt = $pdo->prepare($sql);
        
        // On lie les paramètres
        $stmt->bindValue(':id', $id, $id ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':name', $name);
        $stmt->bindValue(':cost', $shippingCost);
        
        // Crucial : on utilise PDO::PARAM_NULL si la valeur est null
        $stmt->bindValue(':free', $freeShippingAt, is_null($freeShippingAt) ? PDO::PARAM_NULL : PDO::PARAM_STR);

        $stmt->execute();

        echo json_encode(['success' => true]);
        exit();
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        exit();
    }
}

}

?>
