<?php

class Config
{
    private static $instance = null;

    private $appTimezone;
    private $appVersion;
    private $appStatus;
    private $appEnvironment;
    private $appDatabase;
    private $appDatabaseConfig;
    private $appMail;
    private $appMailDefaultSender;
    private $appMailMarketingSender;
    private $appStripeStatus;
    private $appStripeKey;

    private function __construct() {}

    private function __clone() {}

    public function __wakeup() {}

    public static function getInstance(): Config
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function initialize(array $configData = []): void
    {
        $instance = self::getInstance();

        if (isset($configData['appTimezone'])) {
            $instance->setAppTimezone($configData['appTimezone']);
        }

        if (isset($configData['appVersion'])) {
            $instance->setAppVersion($configData['appVersion']);
        }

        if (isset($configData['appStatus'])) {
            $instance->setAppStatus($configData['appStatus']);
        }
        
        $instance->setAppEnvironment(); 
        
        if (isset($configData['appDatabase'])) {
            $instance->setAppDatabase($configData['appDatabase']);
        }

        if (isset($configData['appDatabaseConfig'])) {
            $instance->setAppDatabaseConfig($configData['appDatabaseConfig']);
        }

        if (isset($configData['appMail'])) {
            $instance->setAppMail($configData['appMail']);
        }
        
        if (isset($configData['appStripeStatus'])) {
            $instance->setAppStripeStatus($configData['appStripeStatus']);
        }
        if (isset($configData['appStripeKey'])) {
            $instance->setAppStripeKey($configData['appStripeKey']);
        }

        $instance->validateConfig();
    }

    public function setAppTimezone($appTimezone)
    {
        if (!is_string($appTimezone)) {
            throw new InvalidArgumentException('Lors de la configuration de appTimezone, la valeur doit être une chaîne de caractères comme "America/Montreal". <br>Reçu : ' . $appTimezone);
        } else {
            $this->appTimezone = $appTimezone;
        }
    }

    public function setAppVersion($appVersion)
    {
        if (!is_string($appVersion)) {
            throw new InvalidArgumentException('Lors de la configuration de appVersion, la valeur doit être une chaîne de caractères comme "1.0". <br>Reçu : ' . $appVersion);
        } else {
            $this->appVersion = $appVersion;
        }
    }

    public function setAppStatus($appStatus)
    {
        $possibleValue = ['OPEN', 'CLOSE', 'MAINTENANCE'];
        if (!in_array($appStatus, $possibleValue)) {
            throw new InvalidArgumentException('Lors de la configuration de appStatus, la valeur reçue n\'est pas valide. <br>Reçu : ' . $appStatus);
        } else {
            $this->appStatus = $appStatus;
        }
    }

    public function setAppEnvironment()
    {
        if (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'localhost') {
            $appEnvironment = 'DEV';
        } else {
            $appEnvironment = 'PROD';
        }
        $possibleValue = ['DEV', 'PROD'];
        if (!in_array($appEnvironment, $possibleValue)) {
            throw new InvalidArgumentException('Impossible de définir appEnvironment. Reçu : ' . $appEnvironment);
        } else {
            $this->appEnvironment = $appEnvironment;
        }
    }

    public function setAppDatabase($appDatabase)
    {
        $possibleValue = ['TRUE', 'FALSE'];
        if (!is_string($appDatabase)) {
            throw new InvalidArgumentException('appDatabase doit être une chaîne de caractères. <br>Reçu : ' . $appDatabase);
        } elseif (!in_array($appDatabase, $possibleValue)) {
            throw new InvalidArgumentException('Lors de la configuration de appDatabase, la valeur reçue n\'est pas valide. <br>Reçu : ' . $appDatabase);
        } else {
            $this->appDatabase = $appDatabase;
        }
    }

public function setAppDatabaseConfig($appDatabaseConfig)
{
    if (!is_array($appDatabaseConfig)) {
        throw new InvalidArgumentException('appDatabaseConfig doit être un tableau.');
    }

    $expectedKeys = ['DEV', 'PROD'];
    $receivedKeys = array_keys($appDatabaseConfig);

    sort($expectedKeys);
    sort($receivedKeys);

    if ($expectedKeys !== $receivedKeys) {
        throw new InvalidArgumentException(
            'Le tableau appDatabaseConfig doit contenir uniquement les clés "DEV" et "PROD". ' .
            'Clés reçues : [' . implode(', ', $receivedKeys) . ']'
        );
    }

    foreach ($expectedKeys as $env) {
        if (!is_array($appDatabaseConfig[$env])) {
            throw new InvalidArgumentException("La valeur pour '{$env}' dans appDatabaseConfig doit être un tableau.");
        }
        foreach (['dsn', 'username', 'password'] as $key) {
            if (
                !isset($appDatabaseConfig[$env][$key]) ||
                !is_string($appDatabaseConfig[$env][$key]) ||
                empty($appDatabaseConfig[$env][$key])
            ) {
                throw new InvalidArgumentException(
                    "La clé '{$key}' dans appDatabaseConfig['{$env}'] doit être une chaîne non vide."
                );
            }
        }
    }

    $this->appDatabaseConfig = $appDatabaseConfig;
}

public function setAppMail($appMail)
    {
        if (!is_array($appMail)) {
            throw new InvalidArgumentException('appMail doit être un tableau. Reçu : ' . gettype($appMail));
        }

        if (!isset($appMail['status'])) {
            throw new InvalidArgumentException('appMail doit avoir une clé nommée "status".');
        }

        $possibleStatusValues = ['TRUE', 'FALSE'];
        if (!in_array($appMail['status'], $possibleStatusValues)) {
            throw new InvalidArgumentException(
                'La clé "status" dans appMail ne peut être que "TRUE" ou "FALSE". ' .
                'Reçu : ' . $appMail['status']
            );
        }

        if ($appMail['status'] === 'TRUE') {
            if (!isset($appMail['emailAdress'])) {
                throw new InvalidArgumentException(
                    'appMail doit avoir une clé nommée "emailAdress" car appMail status est TRUE.'
                );
            }

            if (!is_array($appMail['emailAdress'])) {
                throw new InvalidArgumentException(
                    'La clé "emailAdress" dans appMail doit être un tableau. Reçu : ' . gettype($appMail['emailAdress'])
                );
            }

            if (
                !isset($appMail['emailAdress']['default']) ||
                empty($appMail['emailAdress']['default'])
            ) {
                throw new InvalidArgumentException(
                    'emailAdress doit avoir une clé nommée "default" et sa valeur ne peut pas être vide, car appMail status est TRUE.'
                );
            }

            if (!filter_var($appMail['emailAdress']['default'], FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException(
                    'L\'adresse email par défaut dans appMail n\'est pas un format valide. Reçu : ' . $appMail['emailAdress']['default']
                );
            }

            if (isset($appMail['emailAdress']['marketing'])) {
                 if (!filter_var($appMail['emailAdress']['marketing'], FILTER_VALIDATE_EMAIL)) {
                    throw new InvalidArgumentException(
                        'L\'adresse email marketing dans appMail n\'est pas un format valide. Reçu : ' . $appMail['emailAdress']['marketing']
                    );
                }
            }
        }
        
        $this->appMail = $appMail;
    }

public function setAppStripeStatus($appStripeStatus)
{
    if (!is_array($appStripeStatus)) {
        throw new InvalidArgumentException('appStripeStatus doit être un tableau.');
    }

    if (!isset($appStripeStatus['status'])) {
        throw new InvalidArgumentException(
            'Le tableau appStripeStatus doit contenir "status" TRUE ou FALSE.'
        );
    }

    if($appStripeStatus['status'] === 'TRUE'){
        if (!in_array($appStripeStatus['status'], ['TRUE', 'FALSE'])) {
            throw new InvalidArgumentException('La clé "status" dans appStripeStatus doit être "TRUE" ou "FALSE".');
        }

        if (!in_array($appStripeStatus['key'], ['TEST', 'LIVE'])) {
            throw new InvalidArgumentException('La clé "key" dans appStripeStatus doit être "TEST" ou "LIVE".');
        }
    }

    $this->appStripeStatus = $appStripeStatus;
}

public function setAppStripeKey($appStripeKey)
{
    if (!is_array($appStripeKey)) {
        throw new InvalidArgumentException('appStripeKey doit être un tableau.');
    }

    $expectedKeys = ['TEST', 'LIVE'];
    $receivedKeys = array_keys($appStripeKey);

    sort($expectedKeys);
    sort($receivedKeys);

    if ($expectedKeys !== $receivedKeys) {
        throw new InvalidArgumentException(
            'Le tableau appStripeKey doit contenir uniquement les clés "TEST" et "LIVE". ' .
            'Clés reçues : [' . implode(', ', $receivedKeys) . ']'
        );
    }

    foreach ($expectedKeys as $env) {
        if (!is_array($appStripeKey[$env])) {
            throw new InvalidArgumentException("La valeur pour '{$env}' dans appStripeKey doit être un tableau.");
        }
        foreach (['pk', 'sk'] as $key) {
            if (
                !isset($appStripeKey[$env][$key]) ||
                !is_string($appStripeKey[$env][$key]) ||
                empty($appStripeKey[$env][$key])
            ) {
                throw new InvalidArgumentException(
                    "La clé '{$key}' dans appStripeKey['{$env}'] doit être une chaîne non vide."
                );
            }
        }
    }

    $this->appStripeKey = $appStripeKey;
}
    public function getAppTimezone(): string
    {
        return $this->appTimezone;
    }

    public function getAppVersion(): string
    {
        return $this->appVersion;
    }

    public function getAppStatus(): string
    {
        return $this->appStatus;
    }

    public function getAppEnvironment(): string
    {
        return $this->appEnvironment;
    }

    public function getAppDatabase(): string
    {
        return $this->appDatabase;
    }

    public function getAppDatabaseConfig(): array
    {
        return $this->appDatabaseConfig[$this->getAppEnvironment()];
    }

    public function getAppMail()
    {
        return $this->appMail['emailAdress'];
    }


    public function getAppStripeStatus(): array
    {
        return $this->appStripeStatus;
    }

    public function getAppStripeKey(): array
    {
        return $this->appStripeKey;
    }

    public function getAppStripeKeyValue(): array
    {
        $key = $this->appStripeStatus['key'] ?? null;
        if ($key && isset($this->appStripeKey[$key])) {
            return $this->appStripeKey[$key];
        }
        throw new InvalidArgumentException('La clé Stripe n\'est pas définie ou invalide.');
    }

    

    public function validateConfig(): void
    {

        if (!$this->appTimezone) {
            throw new InvalidArgumentException('Vous devez définir appTimezone.');
        }

        if (!$this->appVersion) {
            throw new InvalidArgumentException('Vous devez définir appVersion.');
        }

        if (!$this->appStatus) {
            throw new InvalidArgumentException('Vous devez définir appStatus.' . $this->appStatus);
        }

        if (!$this->appEnvironment) {
            throw new InvalidArgumentException('Vous devez définir appEnvironment.');
        }

        if (!$this->appDatabase){
            throw new InvalidArgumentException('Vous devez définir appDatabase.');
        } else{
            if (!$this->appDatabaseConfig && $this->appDatabase === 'TRUE') {
            
            if (!isset($this->appDatabaseConfig['DEV']) && $this->appEnvironment === 'DEV' || empty($this->appDatabaseConfig['DEV']['dsn']) || empty($this->appDatabaseConfig['DEV']['username'] || empty($this->appDatabaseConfig['DEV']['password']))
            ) {
                throw new InvalidArgumentException('Vous devez définir appDatabaseConfig[\'DEV\'] (dsn, username et password) car appDatabaseConfig est TRUE et vous êtes en environnement DEV.');
            }
            if (!isset($this->appDatabaseConfig['PROD']) && $this->appEnvironment === 'PROD' || empty($this->appDatabaseConfig['PROD']['dsn']) || empty($this->appDatabaseConfig['PROD']['username'] || empty($this->appDatabaseConfig['PROD']['password']))
            ) {
                throw new InvalidArgumentException('Vous devez définir appDatabaseConfig[\'PROD\'] (dsn, username et password) car appDatabaseConfig est TRUE et vous êtes en environnement PROD.');
            }
            }
        }

        if (!$this->appMail) {
            throw new InvalidArgumentException('Vous devez définir appMail.');
        } elseif ($this->appMail['status'] === 'TRUE') {
            if (!isset($this->appMail['emailAdress']['default'])) {
                throw new InvalidArgumentException('Vous devez définir emailAdress et emailAdress default car appMail est TRUE.');
            }
        }

        if (!$this->appStripeStatus) {
            throw new InvalidArgumentException('Vous devez définir appStripeStatus.');
        } elseif ($this->appStripeStatus['status'] === 'TRUE') {
            if (!$this->appStripeKey) {
                throw new InvalidArgumentException('Vous devez définir appStripeKey car appStripeStatus est TRUE.');
            }
            if (
                $this->appStripeStatus['key'] === 'TEST'
                && (!isset($this->appStripeKey['TEST']) || empty($this->appStripeKey['TEST']['pk']) || empty($this->appStripeKey['TEST']['sk']))
            ) {
                throw new InvalidArgumentException('Vous devez définir appStripeKey[\'TEST\'] (pk et sk) car appStripeStatus est TRUE et key est TEST.');
            }
            if (
                $this->appStripeStatus['key'] === 'LIVE'
                && (!isset($this->appStripeKey['LIVE']) || empty($this->appStripeKey['LIVE']['pk']) || empty($this->appStripeKey['LIVE']['sk']))
            ) {
                throw new InvalidArgumentException('Vous devez définir appStripeKey[\'LIVE\'] (pk et sk) car appStripeStatus est TRUE et key est LIVE.');
            }
        }
    }

}

?>






