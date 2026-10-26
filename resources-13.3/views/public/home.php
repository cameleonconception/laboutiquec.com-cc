<?php
require_once('classes/Layouts/Header.php');

$HEADER = new Header();
$HEADER->setLanguage('fr');
$HEADER->setTitle('Accueil');
$HEADER->setDescription('Description');
$HEADER->validateHeader();

$activePage = "Accueil";

require_once($absoluteResources . '/layouts/header.php');
require_once($absoluteResources . '/layouts/nav.php');


?>

<main class="homePage">

 <div class="welcomeContainer">
    <h1><img class='logo' src="<?php echo $staticResources; ?>/default/logos/Logo_complet_noir_orange.png"></h1>
        <p>Commandez nos articles à l'unité (vierges ou pré-personnalisés) ou explorez nos produits pour vous inspirer. <p></p>Vous avez un projet sur mesure pour votre entreprise ? Cliquez sur le bouton ci-dessous !</p>
        <div class="btnContainer">
            <button onclick="window.location.href='produits'">Découvrir nos produits</button>
            <button onclick="window.location.href='https://cameleonconception.com/soumission'" class="secondary">Projets personnalisés</button>
        </div>
    </div>

</main>

<?php
require_once($absoluteResources . '/layouts/footer.php');
?>




