<?php

// Intégration du .env
require_once('vendor/autoload.php');
use Dotenv\Dotenv;
$dotenv = Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once('classes/Config/Config.php');

try {
    Config::initialize([
        'appVersion' => '11.01',
        'appStatus' => 'OPEN',
        'appDatabase' => 'TRUE',
        'appDatabaseConfig' => [ 
            'DEV' => [
                'dsn' => $_ENV['DB_DEV_DSN'],
                'username' => $_ENV['DB_DEV_USERNAME'],
                'password' => $_ENV['DB_DEV_PASSWORD'],
                ],
            'PROD' => [
                'dsn' => $_ENV['DB_PROD_DSN'],
                'username' => $_ENV['DB_PROD_USERNAME'],
                'password' => $_ENV['DB_PROD_PASSWORD'],
            ]
        ],
        'appMail' => [
            'status' => 'FALSE',
        ],
        'appStripeStatus' => [
            'status' => 'TRUE',
            'key' => 'TEST', // 'TEST' or 'LIVE'
        ],'appStripeKey' => [
            'TEST'=>[
                'pk'=> $_ENV['STRIPE_TEST_PK'],
                'sk'=> $_ENV['STRIPE_TEST_SK'],
            ],
            'LIVE'=>[
                'pk'=> $_ENV['STRIPE_LIVE_PK'],
                'sk'=> $_ENV['STRIPE_LIVE_SK'],
            ],
        ],
        'appTimezone' => 'America/Montreal',
    ]);

    date_default_timezone_set(Config::getInstance()->getAppTimezone());

} catch (InvalidArgumentException $e) {
    echo "<b>Argument invalide</b> : <br>" . $e->getMessage() . "\n";
    exit;
} catch (Exception $e) {
    echo "<b>Exception</b> : <br>" . $e->getMessage() . "\n";
    exit;
}

?>






