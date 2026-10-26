<?php
    http_response_code(403);

    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setTitle('403');
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
        <h1>Accès Interdit</h1>
        <p>Nous sommes désolés, vous n'avez pas la permission d'accéder à cette page</p>
        <?php 
            if(isset($message) && !empty($message)){
                echo 'Message : ' . $message;
            }
        ?>
        <div class="btnContainer">
            <?php 
            if(!$logged){
                echo `<button class='secondary' onclick="window.location.href='<?php echo $underLevelString?>se-connecter'">Se connecter</button>`;
            }
            ?>
            <button onclick="window.location.href='<?php echo $underLevelString?>accueil'">Revenir à l'accueil</button>
        </div>
    </div>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






