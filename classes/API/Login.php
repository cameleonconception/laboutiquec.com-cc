<?php

require_once('classes/Database/Connection.php');
require_once('vendor/autoload.php');

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Login {

    private $secretKey;

    // 🌟 Déclaration de la propriété pour le chemin du cookie
    public $cookiePath = '/laboutiquec.com/cc'; // en mode localhost
    //public $cookiePath = '/cc'; // en mode live

    private $tokenRefreshThreshold = 300; // 5 minutes

    public function __construct() {
        $this->secretKey = $_ENV['JWT_SECRET_KEY'];

        if (empty($this->secretKey)) {
            throw new Exception("La variable d'environnement 'JWT_SECRET_KEY' n'est pas définie.");
        }
    }

    public function UserAuthenticator($userData) {
        $email = $userData['email'];
        $password = $userData['password'];
        $password = html_entity_decode($password);

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();

        $sql = "SELECT id, password, role, loginAttempt FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);

        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $response = ['success' => false, 'message' => 'L\'adresse courriel ou le mot de passe est invalide.'];
            echo json_encode($response);
        } else {
            if($user['loginAttempt'] == null) {
                    $loginAttempt = 1;
                } else {
                    $loginAttempt = $user['loginAttempt'] + 1;
                }

                $sql = "UPDATE users SET loginAttempt = :loginAttempt WHERE email = :email"; 
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':loginAttempt', $loginAttempt); 
                $stmt->bindParam(':email', $userData['email']);
                $stmt->execute();

                if($loginAttempt >= 3){

                    $response = ['success' => false, 'message' => 'Vous avez atteint le nombre maximum de tentatives.', 'tooManyAttempt' => true];
                    echo json_encode($response);
                    
                }else{
                    if (password_verify($password, $user['password'])) {
                        unset($user['password']);

                        $sql = "UPDATE users SET loginAttempt = null WHERE email = :email"; 
                        $stmt = $pdo->prepare($sql);
                        $stmt->bindParam(':email', $userData['email']);
                        $stmt->execute();

                        $this->createConnection($user);

                    } else {
                        $response = ['success' => false, 'message' => 'L\'adresse courriel ou le mot de passe est invalide.'];
                        echo json_encode($response);
                    }
                }
        }
    }

    public function createConnectionFromSignup($user){
        $this->createConnection($user);
    }

    private function createConnection($user) {
        $issuedAt = time();
        // Le token sera valide pendant 15 minutes (900 secondes) après sa création.
        $expirationTime = $issuedAt + 900; // 15 min

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'id' => $user['id'],
            'role' => $user['role'],
        ];
        $jwt = JWT::encode($payload, $this->secretKey, 'HS256');

        $cookieName = 'jwt_token';
        $cookieValue = $jwt;
        $cookieExpiration = $expirationTime;
        $cookieDomain = '';
        $cookieSecure = true;
        $cookieHttpOnly = true;
        $cookieSameSite = 'Lax';

        setcookie(
            $cookieName,
            $cookieValue,
            [
                'expires' => $cookieExpiration,
                'path' => $this->cookiePath, // 🌟 Utilisation de la propriété de classe
                'domain' => $cookieDomain,
                'secure' => $cookieSecure,
                'httponly' => $cookieHttpOnly,
                'samesite' => $cookieSameSite,
            ]
        );

        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Connexion réussie']);
        exit;
    }

    public function validateAndDecodeToken() {
        $jwt = $_COOKIE['jwt_token'] ?? null;

        if (empty($jwt)) {
            return ['success' => false, 'message' => 'Token manquant dans le cookie.'];
        }
        try {
            $decoded = JWT::decode($jwt, new Key($this->secretKey, 'HS256'));

            $currentTime = time();
            if ($decoded->exp - $currentTime < $this->tokenRefreshThreshold) {
                $userToRefresh = [
                    'id' => $decoded->id,
                    'role' => $decoded->role
                ];
                $this->refreshToken($userToRefresh);
            }

            return ['success' => true, 'user' => (array) $decoded];
        } catch (Firebase\JWT\ExpiredException $e) {
            // 🌟 Correction ici : Le cookie expiré doit être supprimé avec le bon chemin
            setcookie('jwt_token', '', ['expires' => time() - 3600, 'path' => $this->cookiePath, 'httponly' => true, 'secure' => true, 'samesite' => 'Lax']);
            return ['success' => false, 'message' => 'Token expiré.'];
        } catch (Firebase\JWT\SignatureInvalidException $e) {
            return ['success' => false, 'message' => 'Signature du token invalide.'];
        } catch (Firebase\JWT\BeforeValidException $e) {
            return ['success' => false, 'message' => 'Token pas encore valide.'];
        } catch (Exception $e) {
            error_log("Erreur JWT : " . $e->getMessage());
            return ['success' => false, 'message' => 'Token invalide.'];
        }
    }

    public function refreshToken($user) {
        $issuedAt = time();
        $expirationTime = $issuedAt + 900; // 15 min

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'id' => $user['id'],
            'role' => $user['role'],
        ];
        $jwt = JWT::encode($payload, $this->secretKey, 'HS256');

        setcookie(
            'jwt_token',
            $jwt,
            [
                'expires' => $expirationTime,
                'path' => $this->cookiePath, // 🌟 Utilisation de la propriété de classe
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Lax',
            ]
        );
    }
}






