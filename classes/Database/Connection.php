<?php
    class Connection{

        private $pdo;
        public function __construct(){

            try{
                if(Config::getInstance()->getAppDatabase() === 'TRUE'){
                    $dsn = Config::getInstance()->getAppDatabaseConfig()['dsn'];
                    $username = Config::getInstance()->getAppDatabaseConfig()['username'];
                    $password = Config::getInstance()->getAppDatabaseConfig()['password'];

                    $pdo = new PDO($dsn, $username, $password);
                    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    $pdo->exec("set names utf8");
                    
                    $this->pdo = $pdo;
                   
                 }else{
                    $response = ['success' => false, 'message' => 'AppDatabase dans Controllers/Config n\'est pas défini à TRUE, et une tentative de connexion à la base de données a été effectuée.'];
                    echo json_encode($response);
                    exit;
                 }
                }catch (PDOException $e){
                    $response = ['success' => false, 'message' => 'Erreur de connexion à la base de données : ' . $e->getMessage()];
                    echo json_encode($response);
                    exit;

                }
        }

        public function getPDO() {
            return $this->pdo;
        }
    }
?>






