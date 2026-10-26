<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setTitle('Confirmation');
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
        <h1>Merci !</h1>
            <?php 
            if(isset($message) && !empty($message)){
                echo $message;
            }
        ?>
    </div>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






