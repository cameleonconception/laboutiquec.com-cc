<!DOCTYPE html>
<html lang="<?php echo $HEADER->getLanguage(); ?>">
<head>
    <?php echo $HEADER->getNoIndex(); ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Caméléon conception Inc.">
    <title><?php echo $HEADER->getTitle(); ?></title>
    <meta name="description" content="<?php echo $HEADER->getDescription(); ?>">
    <meta name="og:title" content="<?php echo $HEADER->getTitle(); ?>">
    <meta name="og:description" content="<?php echo $HEADER->getDescription(); ?>">
    <link rel="canonical" href="https:/<?php echo $rootPath . $view['PATH'];?>" />
    <meta name="og:image" content="<?php echo $staticResources; ?>/default/favicon/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo $staticResources; ?>/default/favicon/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="<?php echo $staticResources; ?>/default/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="<?php echo $staticResources; ?>/default/favicon/favicon-16x16.png">
    <link rel="manifest" href="<?php echo $staticResources; ?>/default/favicon/site.webmanifest">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/style.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/main/main.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/footer/footer.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/cookies/preferences.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/form/style.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/cookies/politics.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/main/noscript.css">
    <link rel="stylesheet" href="<?php echo $relativeResources; ?>/css/section/nav/nav.css">
   
    <?php 
        $cssFiles = $HEADER->getCssFiles();
        if(count($cssFiles) > 0) {
            foreach($cssFiles as $cssFile) {
                echo '<link rel="stylesheet" href="'. $relativeResources. '/css/'. $cssFile. '">';
            }
        }
        echo PHP_EOL . "\t";

        if((isset($logged) &&  $logged) || (isset($admin) &&  $admin)){
            echo '<script src="'. $relativeResources. '/js/api/keepAlive.js" defer></script>';
        }

        $jsFiles = $HEADER->getJsFiles();
        if(count($jsFiles) > 0) {
            foreach($jsFiles as $jsFile) {
                
                echo '<script src="'. $relativeResources. '/js/'. $jsFile. '" defer></script>';
            }
        }
        
    ?>
    <script src="<?php echo $relativeResources; ?>/js/cookies/preferences.js" defer></script>
    <script src="<?php echo $relativeResources; ?>/js/script.js" defer></script>
    <!--

    <script src="<?php //echo $relativeResources; ?>/js/nav/nav.js" defer></script>    


    Ajout de google analytics
    
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-0M83KR00QH"></script>
    <script>
            if (localStorage.getItem('cookiePreference') === 'accepted') {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-0M83KR00QH');
        }
    </script>

    -->
</head>
<body>
<noscript>
    <p>Vous devez activer JavaScript dans les paramètres de votre navigateur pour accéder au site web.</p>
</noscript>






