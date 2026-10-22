<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Produits');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('api/GET/products.js');

    if($superAdmin){
        $HEADER->addJsFile('/superAdmin/api/POST/addProduct.js');
        $HEADER->addCssFile('/section/main/superAdmin.css');
    }

    $HEADER->validateHeader();

    $activePage = "Produits";

    
    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');
?>

<style>
    /* Style pour barrer et désactiver les filtres indisponibles */
    .checkboxFilterContainer.disabled-filter {
        opacity: 0.4;
        text-decoration: line-through;
        cursor: not-allowed;
    }
    .checkboxFilterContainer.disabled-filter input {
        cursor: not-allowed;
    }
</style>

<main>
    <section class="contentPage">
<?php if($superAdmin){
    $personalizationPlaceholder = '[{"option":"Finissant 2025-2026","price":2}]';
    $encodedPlaceholder = htmlspecialchars($personalizationPlaceholder, ENT_QUOTES);

    $personalizationDetailsPlaceholder = '<ul><li>Fichiers .png uniquement</li><li>Résolution de 300 dpi</li><li>Les dimensions sont en pouces (Largeur x Hauteur)</li><li>Les prix ci-dessous seront automatiquement mis à jour en fonction de la dimension des logos</li></ul><span>* Un fichier de faible qualité peut donner lieu à une personnalisation de mauvaise qualité.</span>';
    $encodedPersonalizationDetailsPlaceholder = htmlspecialchars($personalizationDetailsPlaceholder, ENT_QUOTES);

    echo '<button id="superAdmin-addProductBtn" onclick="toggleNewProductForm()">+</button>';
    echo '
    <div class="fullBlurBg">
        <form id="superAdmin-newProductForm" method="POST">
            <label for="name">Nom du produit</label>
            <input id="name" name="name" type="text" placeholder="Tuque classique">

            <label for="sku">SKU</label>
            <input id="sku" name="sku" type="text" placeholder="H8000-A">
            <button id="submitBtn" type="button" onclick="addProduct();">Ajouter le produit</button>
            <button class="secondary" type="button" onclick="toggleNewProductForm()">Annuler</button>
        </form>
    </div>
    ';
} ?>
<div id="welcomeContainer">
    <h1>Créez votre soumission</h1>
    <p>
        1. Sélectionnez un produit<br>
        2. Ajoutez votre logo et les quantités<br>
        3. Envoyez votre demande de soumission
    </p>
    <p>Une fois votre demande envoyée, un membre de notre équipe vous enverra la soumission par courriel en moins de 2h durant nos heures d'ouverture.</p>

    <div class="welcome-actions">
        <a href="catalogues" class="btn-primary">Voir tous nos produits (catalogues)</a>
        <a href="https://cameleonconception.com/contact" class="btn-secondary">
            Vous ne trouvez pas ?
        </a>
    </div>
</div>
        <div id="toggle-filter-section" onclick="toggleFilterSection()" class="">Filtres<img src="<?php echo $staticResources;?>/default/icons/white/filter-2.png"></div>
        <div id="filter-section"></div>
        
        <!-- AJOUT : Conteneur pour l'affichage des badges de filtres sélectionnés -->
        <div id="ownedCategory"></div>

        <div id="products-container"></div>

        <div id="pages-section"></div>
        <?php
            if($logged && $admin){
                echo `<button id='addPoductBtn'>+</button>`;
            }
        ?>
    </section>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>