<?php
    http_response_code(403);

    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setTitle('400');
    $HEADER->addCssFile('style.css');
    $HEADER->addCssFile('/section/nav/nav.css');

    $activePage = '';

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');

    if(isset($_GET['message'])){
        $message = htmlspecialchars($_GET['message']);
    }
?>

<main class="homePage">
    <div class="errorDocumentContainer">
        <h1>Une erreur s'est produite</h1>
        <p>Nous sommes désolés, votre requête n'a pas pu être traitée.<br>
        Veuillez réessayer, ou si le problème persiste, n'hésitez pas à communiquer avec nous à info@cameleonconception.com</p>
        <?php 
            if(isset($message) && !empty($message)){
                echo 'Message : ' . $message;
            }
        ?>
        <div class="btnContainer">
            <button onclick="window.location.href='<?php echo $underLevelString?>accueil'">Revenir à l'accueil</button>
        </div>
    </div>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






