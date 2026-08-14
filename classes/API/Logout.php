<?php

require_once('classes/Database/Connection.php');
require_once('vendor/autoload.php');

class Logout {

      public function logout() {
        setcookie(
            'jwt_token',
            '',
            [
                'expires' => time() - 3600,
                'path' => '/laboutiquec.com/cc', // en mode localhost
                //'path' => '/cc', // en mode live
                'domain' => '',
                'secure' => true,  
                'httponly' => true, 
                'samesite' => 'Lax',
            ]
        );
        return ['success'=>true];
    }

}








