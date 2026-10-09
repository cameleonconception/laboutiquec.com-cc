<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Détail de commande');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('/api/GET/order-details.js');
    $HEADER->validateHeader();

    $activePage = "";

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');
?>
<main>
     <section class="contentPage">
        <div id="order-details-container">
        </div>
        <?php 
        if($admin){
            echo '
            <div class="actionsContainer"  style="">
                <button id="invoice" class="fitContent"  style="display:none;"> Imprimer la demande de soumission</button>
                <button id="epreuveBtn" class="fitContent" style="display:none;">Épreuve</button>
                <button id="packingSlip" class="fitContent" style="display:none;">Packing Slip</button>
                <button id="shippingLabel" class="fitContent" style="display:none;">Étiquette</button>
                <select name="" id="statusAction">
                    <option value="1">À produire</option>
                    <option value="2">En production</option>
                    <option value="3">En livraison</option>
                    <option value="4">Archivée</option>
                </select>
            </div>
        ';
        }else{
            echo '
                <div class="actionsContainer"  style="display:none;">
                <button id="invoice" class="fitContent">Imprimer la demande de soumission</button>
                <button id="epreuveBtn" class="fitContent" style="display:none;">Épreuve</button>
            </div>
            ';
        }
        ?>

     </section>
</main>


<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>





