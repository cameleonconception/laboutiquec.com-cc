<?php

require_once('classes/Database/Connection.php');

class PreOrder
{
    private function formatFrenchDate($timestamp)
    {
        // Tableau de traduction des noms de mois en français et en minuscule
        $frenchMonths = [
            'January' => 'janvier',
            'February' => 'février',
            'March' => 'mars',
            'April' => 'avril',
            'May' => 'mai',
            'June' => 'juin',
            'July' => 'juillet',
            'August' => 'août',
            'September' => 'septembre',
            'October' => 'octobre',
            'November' => 'novembre',
            'December' => 'décembre',
        ];

    if (!class_exists('IntlDateFormatter')) {
        $dateTime = new \DateTime($timestamp);
        $englishMonth = $frenchMonths[$dateTime->format('F')] ?? $dateTime->format('F');
        $time = $dateTime->format('H\hi');
        return " " . $dateTime->format('j') . " " . $englishMonth . " " . $dateTime->format('Y') . " à " . $time;
    }

    $dateTime = new \DateTimeImmutable($timestamp, new \DateTimeZone('UTC')); 
        
    $formatter = new \IntlDateFormatter(
        'fr_FR',
        \IntlDateFormatter::LONG, 
        \IntlDateFormatter::SHORT,
        'America/Montreal', 
        \IntlDateFormatter::GREGORIAN,
        "d MMMM yyyy 'à' HH'h'mm" // 
    );
    
    $formatted = $formatter->format($dateTime);
    
    return " " . mb_strtolower($formatted, 'UTF-8');
}

    public function getPreOrder()
    {
        $formattedTimestamp = (new \DateTime('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s'); 
        
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT * FROM preorder";
        $stmt = $pdo->prepare($sql);

        $openPreOrder = null; 
        $allPreOrders = [];
        $message = "Aucune précommande n'est présentement ouverte"; 
        $closestOpenTime = null;

        try {
            $stmt->execute();
            $preorders = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $allPreOrders = $preorders;

            foreach ($preorders as $key => $preorder) {
                $id = $preorder['id'];
                $status = $preorder['status'];
                $open_at = $preorder['open_at'];
                $close_at = $preorder['close_at'];
                
                if ((int)$status === 1) {
                    
                    $is_currently_open = ($formattedTimestamp >= $open_at && $formattedTimestamp <= $close_at);

                    if ($is_currently_open) {
                        
                        if ($openPreOrder === null) {
                            $openPreOrder = $preorder;
                            
                            $formattedCloseTime = $this->formatFrenchDate($close_at);
                            $message = "La précommande est présentement ouverte jusqu'au " . $formattedCloseTime ;
                        }
                        
                    } elseif ($formattedTimestamp > $close_at) {
                        
                        $updateSql = "UPDATE preorder SET status = 0 WHERE id = :id";
                        $updateStmt = $pdo->prepare($updateSql);
                        $updateStmt->bindParam(':id', $id, \PDO::PARAM_INT);
                        $updateStmt->execute();
                        
                        $allPreOrders[$key]['status'] = '0';
                    }
                }
            }
            
            if ($openPreOrder !== null) {
                // S'il y a une précommande ouverte, on s'assure de fermer toutes les autres actives
                foreach ($allPreOrders as $key => $preorder) {
                    if ((int)$preorder['status'] === 1 && (int)$preorder['id'] !== (int)$openPreOrder['id']) {
                        
                        $updateSql = "UPDATE preorder SET status = 0 WHERE id = :id";
                        $updateStmt = $pdo->prepare($updateSql);
                        $updateStmt->bindParam(':id', $preorder['id'], \PDO::PARAM_INT);
                        $updateStmt->execute();
                        
                        $allPreOrders[$key]['status'] = '0';
                    }
                }
            } else {
                // S'il n'y a pas de précommande ouverte, on cherche la prochaine
                foreach ($allPreOrders as $preorder) {
                    if ((int)$preorder['status'] === 1 && $preorder['open_at'] > $formattedTimestamp) {
                        
                        $currentOpenTime = $preorder['open_at'];
                        
                        if ($closestOpenTime === null || $currentOpenTime < $closestOpenTime) {
                            $closestOpenTime = $currentOpenTime;
                        }
                    }
                }
                
                if ($closestOpenTime !== null) {
                    $formattedOpenTime = $this->formatFrenchDate($closestOpenTime);
                    $message = "La précommande ouvrira le " . $formattedOpenTime;
                }
            }


            
             $response = [
                'success' => true, 
                'allPreOrders' => $allPreOrders,
                'openPreOrder' => $openPreOrder !== null ? [
                    [
                        'id' => $openPreOrder['id'],
                        'status' => $openPreOrder['status'],
                        'open_at' => $openPreOrder['open_at'], // Garder pour la compatibilité
                        'close_at' => $openPreOrder['close_at'], // Garder pour la compatibilité
                        'open_at_utc' => $openPreOrder['open_at'], // <-- NOUVEAU CHAMP (crucial)
                        'close_at_utc' => $openPreOrder['close_at'], // <-- NOUVEAU CHAMP (crucial)
                    ]
                ] : [],
                'message' => $message,
            ];
            
            header('Content-Type: application/json');
            echo json_encode($response);

        } catch (\PDOException $e) {
            $response = ['success' => false, 'message' => 'Erreur de base de données : ' . $e->getMessage()];
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode($response);
        }
    }

    public function returnPreOrder()
    {
        
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT * FROM preorder ORDER BY id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $preorders = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $formattedPreOrders = [];
        foreach ($preorders as $preorder) {
            // Appliquer la fonction de formatage aux dates
            // Nous ajoutons de NOUVEAUX champs pour garder les valeurs originales si besoin
            $preorder['open_at'] = $this->formatFrenchDate($preorder['open_at']);
            $preorder['close_at'] = $this->formatFrenchDate($preorder['close_at']);
            
            $formattedPreOrders[] = $preorder;
        }
        // ----------------------------------------------------

        return $formattedPreOrders ?? [];


    }

public function returnOpenPreOrderId()
    {
        
        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT * FROM preorder";
        $stmt = $pdo->prepare($sql);

        $openPreOrder = null; 
        $allPreOrders = [];
        // Nous n'avons pas besoin de message ni de closestOpenTime ici si nous retournons juste l'ID
        // $message = "Aucune précommande n'est présentement ouverte"; 
        // $closestOpenTime = null; 
        
        // Définir le timestamp actuel dans la fonction pour la logique temporelle
        $formattedTimestamp = (new \DateTime('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s'); 

        try {
            $stmt->execute();
            $preorders = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            $allPreOrders = $preorders;

            foreach ($preorders as $key => $preorder) {
                $id = $preorder['id'];
                $status = $preorder['status'];
                $open_at = $preorder['open_at'];
                $close_at = $preorder['close_at'];
                
                if ((int)$status === 1) {
                    
                    $is_currently_open = ($formattedTimestamp >= $open_at && $formattedTimestamp <= $close_at);

                    if ($is_currently_open) {
                        
                        // Nous cherchons seulement le premier (et le seul) ouvert
                        if ($openPreOrder === null) {
                            $openPreOrder = $preorder;
                            // On n'a plus besoin de formater la date ou de définir le message ici
                        }
                        
                    } elseif ($formattedTimestamp > $close_at) {
                        
                        // Si l'heure de fermeture est passée, on met à jour le statut
                        $updateSql = "UPDATE preorder SET status = 0 WHERE id = :id";
                        $updateStmt = $pdo->prepare($updateSql);
                        $updateStmt->bindParam(':id', $id, \PDO::PARAM_INT);
                        $updateStmt->execute();
                        
                        $allPreOrders[$key]['status'] = '0';
                    }
                }
            }
            
            // Logique de nettoyage : fermer les autres précommandes actives (si plus d'une est "active" en DB)
            if ($openPreOrder !== null) {
                foreach ($allPreOrders as $key => $preorder) {
                    if ((int)$preorder['status'] === 1 && (int)$preorder['id'] !== (int)$openPreOrder['id']) {
                        
                        $updateSql = "UPDATE preorder SET status = 0 WHERE id = :id";
                        $updateStmt = $pdo->prepare($updateSql);
                        $updateStmt->bindParam(':id', $preorder['id'], \PDO::PARAM_INT);
                        $updateStmt->execute();
                        
                        $allPreOrders[$key]['status'] = '0';
                    }
                }
            } 
            // Note: La logique de recherche du `closestOpenTime` est retirée car on ne retourne que l'ID ouvert
            
            // --- RETOUR DE L'ID ---
            if ($openPreOrder !== null) {
                // Si une précommande ouverte a été trouvée, retourne son ID
                return (int)$openPreOrder['id'];
            }
            
            // Sinon, retourne null
            return null;
            // ----------------------

        } catch (\PDOException $e) {
            // En cas d'erreur DB, retourne null pour indiquer qu'aucun ID n'a pu être récupéré
            return null;
        }
    }
}







