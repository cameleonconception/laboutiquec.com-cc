<?php
    http_response_code(403);

    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setTitle('503');
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
        <h1>Site web en maintenance</h1>
        <p>Revenez plus tard !</p>
            <?php 
            if(isset($message) && !empty($message)){
                echo 'Message : ' . $message;
            }
        ?>
    </div>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






