<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('---');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('/api/GET/product-details.js');
    $HEADER->addJsFile('/api/POST/add-product-to-cart.js');

    $HEADER->validateHeader();

    $activePage = '';
    
    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');
?>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

<main>
     <section class="contentPage">
        <div id="product-details-container">

        </div>
     </section>
</main>


<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






