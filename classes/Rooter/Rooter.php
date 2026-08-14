<?php

require_once('classes/API/Login.php');

class Rooter
{
    private $rootPath;
    private $rootDirectory;

    private $views = [];

    public function setRootPath($rootPath)
    {
        if ($rootPath === '/' || $rootPath === '/localhost/') {
            throw new InvalidArgumentException('setRootDirectory ne peut pas être vide.');
        } else {
            $this->rootPath = $rootPath;
        }
    }

    public function setRootDirectory($rootDirectory)
    {
        $this->rootDirectory = $rootDirectory;
    }


    public function addViews($method, $path, $file, $queryAccepted, $queryDefined, $hasToBeLogged, $hasToBeAdmin, $inMaintenace, $inSitemaps)
    {

        $viewsAlreadyAdded = $this->views;
        $possibleMethod = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        $possibleQueryAccepted = ['NONE', 'ALL', 'DEFINED', 'STRICT_DEFINED'];
        $possibleHasToBe = ['TRUE', 'FALSE'];

        if (!in_array($method, $possibleMethod)) {
            throw new InvalidArgumentException('La méthode de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        foreach ($viewsAlreadyAdded as $view) {
            if ($path === $view['PATH']) {
                throw new InvalidArgumentException('Le chemin de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est déjà utilisé par une autre vue. Chemin : "' . $path . '"');
            }
        }

        if (empty($path)) {
            throw new InvalidArgumentException('Le chemin de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est vide.');
        }

        if (empty($file)) {
            throw new InvalidArgumentException('La valeur du fichier de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est vide.');
        }

        if (!in_array($queryAccepted, $possibleQueryAccepted)) {
            throw new InvalidArgumentException('Le paramètre queryAccepted de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        if ($queryAccepted === 'NONE' || $queryAccepted === 'ALL') {
            $queryDefined = '';
        } elseif ($queryAccepted === 'DEFINED') {
            if (!is_array($queryDefined)) {
                throw new InvalidArgumentException('Le paramètre queryDefined de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas un tableau.');
            } elseif (empty($queryDefined)) {
                throw new InvalidArgumentException('Le paramètre queryDefined de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est vide.');
            }

            foreach ($queryDefined as $paramName => $regexPattern) {
                if (!is_string($paramName) || empty($paramName)) {
                    throw new InvalidArgumentException('Un nom de paramètre dans queryDefined pour la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est invalide ou vide.');
                }
                if (!is_string($regexPattern) || empty($regexPattern)) {
                    throw new InvalidArgumentException('Un motif regex pour le paramètre "' . $paramName . '" dans queryDefined pour la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' est invalide ou vide.');
                }
            }
        }

        if (!in_array($hasToBeLogged, $possibleHasToBe)) {
            throw new InvalidArgumentException('Le paramètre hasToBeLogged de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        if (!in_array($hasToBeAdmin, $possibleHasToBe)) {
            throw new InvalidArgumentException('Le paramètre hasToBeAdmin de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        if (!in_array($inMaintenace, $possibleHasToBe)) {
            throw new InvalidArgumentException('Le paramètre inMaintenace de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        if (!in_array($inSitemaps, $possibleHasToBe)) {
            throw new InvalidArgumentException('Le paramètre inSitemaps de la vue numéro ' . (Count($viewsAlreadyAdded) + 1) . ' n\'est pas valide.');
        }

        $this->views[] = [
            'METHOD' => $method, # GET, POST, PUT, PATCH, DELETE
            'PATH' => $path,
            'FILE' => $file,
            'QUERY_ACCEPTED' => $queryAccepted, # NONE, ALL, DEFINED, STRICT_DEFINED (DEFINED means that the query must be there and respect the regex but it can have other param that will be ignored ... for the STRICT_DEFINED, this means it can only have the same index/param and must respect the regex)
            'QUERY_DEFINED' => $queryDefined,
            'HAS_TO_BE_LOGGED' => $hasToBeLogged, # TRUE, FALSE
            'HAS_TO_BE_ADMIN' => $hasToBeAdmin,
            'IN_MAINTENANCE' => $inMaintenace,
            'IN_SITEMAPS' => $inSitemaps,
        ];

        $this->generateSitemaps();

    }

    public function generateSitemaps(){
        
        $sitemapsLocation = __DIR__ . "/../../sitemaps.xml";

        $content = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';
        
        foreach($this->views as $view){

        if($view['IN_SITEMAPS'] === 'TRUE'){
        $content .= '
            <url>
                <loc>https:/'.$this->rootPath . $view['PATH'] . '</loc>
                <lastmod>' . date('c') . '</lastmod>
                <priority>1.00</priority>
            </url>';
        }

        }

        $content .='
        </urlset>
        ';

        if (file_put_contents($sitemapsLocation, $content, LOCK_EX) !== false) {
        }else{
            echo 'erreur sitemaps;'; 
        }

    }

    public function getRootPath()
    {
        return $this->rootPath;
    }

    public function getRootDirectory()
    {
        return $this->rootDirectory;
    }


    public function getRequestUri()
    {
        $requestUri = strtok($_SERVER['REQUEST_URI'], '?');

        $rootDirectoryClean = rtrim($this->getRootDirectory(), '/');
        if (!empty($rootDirectoryClean) && strpos($rootDirectoryClean, '/') !== 0) {
            $rootDirectoryClean = '/' . $rootDirectoryClean;
        }

        $requestUri = str_replace(
            [$rootDirectoryClean, $rootDirectoryClean . '/index.php'],
            '',
            $requestUri
        );

        $requestUri = '/' . ltrim($requestUri, '/');
        $requestUri = str_replace('//', '/', $requestUri);

        return $requestUri;
    }

    public function getRequestQuery()
    {
        if (!empty($_SERVER['QUERY_STRING'])) {
            $query = [];
            $queryStrings = explode('&', $_SERVER['QUERY_STRING']);

            foreach ($queryStrings as $queryString) {
                $index = explode('=', $queryString)[0];
                $value = explode('=', $queryString)[1];

                $query[$index] = $value;
            }

            return $query;
        }
    }


    public function getViews()
    {
        return $this->views;
    }

    public function loadView()
    {

        $rootPath = $this->rootPath;
        $found = false;
        
        $underLevelCount = substr_count($this->getRequestUri(), '/') - 1;
        $underLevelString = str_repeat('../', $underLevelCount);
        $relativeResources = $underLevelString. 'resources-' . Config::getInstance()->getAppVersion();
        $staticResources = $underLevelString. 'static-resources';

        header("Access-Control-Allow-Origin: https:/".$rootPath);
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");

        // Test les headers avant d'afficher la page
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $absoluteResources = 'resources-' . Config::getInstance()->getAppVersion();
        
        if(Config::getInstance()->getAppStatus() === 'MAINTENANCE'){
            require_once($absoluteResources . '/views/appStatus/503.php'); // website in maintenance (503)
            exit;
        }elseif(Config::getInstance()->getAppStatus() === 'CLOSE'){
            require_once($absoluteResources . '/views/appStatus/302.php'); // website close (302)
            exit;
        }elseif(Config::getInstance()->getAppStatus() === 'OPEN'){

            // ⭐️ Centralisation de l'authentification : Login créé une seule fois ⭐️
            $logged = false;
            $admin = false;
            $superAdmin = false;
            $login = new Login;
            $authResult = $login->validateAndDecodeToken();
            $userData = $authResult['success'] ? $authResult['user'] : null;

            if ($authResult['success']) {
                $logged = true;
                if (isset($userData['role']) && $userData['role'] == 1) {
                    $admin = true;
                }elseif(isset($userData['role']) && $userData['role'] == 2){
                    $admin = true;
                    $superAdmin = true;
                }
                
            }
            // ------------------------------------------

            foreach ($this->getViews() as $view) {
                if ($view['PATH'] === $this->getRequestUri() && !$found) {
                    $found = true;
                    // Redirection si déjà connecté ou admin sur /login ou /signup (utilise $logged et $admin)
                    if (($logged || $admin) && ($view['PATH'] === '/login' || $view['PATH'] === '/signup')) {
                        header('Location: profile');
                        exit;
                    }
                    // Vérification des exigences de connexion/admin (utilise $logged et $admin)
                    if ($view['HAS_TO_BE_LOGGED'] === 'TRUE' || $view['HAS_TO_BE_ADMIN'] === 'TRUE') {
                        
                        // Si pas connecté, accès refusé (401)
                        if (!$logged) {

                            $redirectPage = $_SERVER['REQUEST_URI'];

                            
                            echo "<script> localStorage.setItem('redirectPage', '" . $redirectPage . "');</script>";
                            require_once($absoluteResources . '/views/errorDocuments/401.php'); // Not Allowed (401) 
                            exit;
                        } else {
                            // Si l'utilisateur doit être admin et qu'il ne l'est pas, accès refusé (403)
                            if($view['HAS_TO_BE_ADMIN'] === 'TRUE'){
                                if(!$admin){
                                    require_once($absoluteResources . '/views/errorDocuments/403.php'); // Accès refusé (403) 
                                    exit;
                                }
                            }
                        }
                    }
                    
                    if($view['IN_MAINTENANCE'] === 'TRUE'){
                        require_once($absoluteResources . '/views/errorDocuments/503.php'); // In maintenance (503)
                        exit;
                    }elseif ($_SERVER['REQUEST_METHOD'] !== $view['METHOD']) {
                        require_once($absoluteResources . '/views/errorDocuments/405.php'); // Method Not Allowed (405)
                        exit;
                    }else { 
                        if ($view['QUERY_ACCEPTED'] === 'NONE') {

                            $userQuery = $this->getRequestQuery() ?? [];

                            if (count($userQuery) > 0) {
                                require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                exit;
                            }

                            require_once($absoluteResources . $view['FILE']);

                        } elseif ($view['QUERY_ACCEPTED'] === 'ALL') {
                            require_once($absoluteResources . $view['FILE']);
                        } elseif ($view['QUERY_ACCEPTED'] === 'DEFINED') {

                            $queryDefined = $view['QUERY_DEFINED'] ?? [];
                            $userQuery = $this->getRequestQuery() ?? [];

                            foreach ($queryDefined as $key => $regex) {
                                if (!isset($userQuery[$key]) || !is_string($userQuery[$key])) {
                                    require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                    exit;
                                }

                                if (!preg_match($regex, $userQuery[$key])) {
                                    require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                    exit;
                                }
                            }

                            require_once($absoluteResources . $view['FILE']);

                        } elseif ($view['QUERY_ACCEPTED'] === 'STRICT_DEFINED') {

                            $queryDefined = $view['QUERY_DEFINED'] ?? [];
                            $userQuery = $this->getRequestQuery() ?? [];

                            if (count($queryDefined) !== count($userQuery)) {
                                require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                exit;
                            }


                            $queryDefinedKeys = array_keys($queryDefined);
                            $userQueryKeys = array_keys($userQuery);

                            sort($queryDefinedKeys);
                            sort($userQueryKeys);

                            if ($queryDefinedKeys !== $userQueryKeys) {
                                require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                exit;
                            }


                            foreach ($queryDefined as $key => $regex) {
                                if (!isset($userQuery[$key]) || !is_string($userQuery[$key])) {
                                    require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                    exit;
                                }

                                if (!preg_match($regex, $userQuery[$key])) {
                                    require_once($absoluteResources . '/views/errorDocuments/400.php'); // Bad Request (400) 
                                    exit;
                                }
                            }
                            require_once($absoluteResources . $view['FILE']);

                        }

                    }
                }
            }

        if (!$found) {
            require_once($absoluteResources . '/views/errorDocuments/404.php'); // Page not Found (404)
            exit;
        }
        }
    }
}





