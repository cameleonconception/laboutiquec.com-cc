<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setTitle('Outils');
    $HEADER->addCssFile('style.css');
    $HEADER->addCssFile('/section/nav/nav.css');

    $activePage = 'Outils';

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');

?>

<main>
 <section class="cataloguesSection contentPage">
        <h1 class="title">OUTILS</h1>
        <p class="titleDesc">Voici quelques outils qui vous permettront de nous transmettre des logos de qualité !</p>
        <div id="linkContainer">
            <button onclick="window.location.href='https://www.affinity.studio/fr_ca'">Logiciel de graphisme gratuit</button>
            <button style="display:none;" onclick="window.location.href='https://laboutiquec.com/cc/produits/studio?sku=VI'">Vectoriser une image</button>
            <button onclick="window.location.href='https://www.iloveimg.com/jpg-to-image'">Convertir une image en .png</button>
            <button onclick="window.location.href='https://www.iloveimg.com/resize-image'">Améliorer une image</button>
        </div>
</section>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






