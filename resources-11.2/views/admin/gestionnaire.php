<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Gestionnaire');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('api/UPDATE/user-infos.js');
    if($superAdmin){
            $HEADER->addJsFile('superAdmin/api/GET/users.js');
            $HEADER->addJsFile('superAdmin/api/POST/uploadColorImage.js');
            $HEADER->addJsFile('superAdmin/api/POST/suppliers-manager.js');
            $HEADER->addCssFile('section/main/superAdmin.css');
    }

    $HEADER->addJsFile('api/GET/admin/orders.js');
    $HEADER->validateHeader();


    $activePage = "Gestionnaire";

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');


?>
<main>
    <section class="contentPage">
        <h1 class="title">Gestionnaire</h1>
        <div id="viewSelectorContainer" style="display:<?php if(!$superAdmin){echo 'none';}?>;">
            <div onclick="selectView(event,'dash-ordersContainer')" class="active">
                Tableau de bord
            </div>
        <?php if($superAdmin){echo "
            <div onclick=\"selectView(event, 'dash-usersContainer');loadAndRenderUsers();\">
                Utilisateurs
            </div>
            <div onclick=\"selectView(event,'dash-suppliers');loadExistingSuppliers();\">
                Fournisseurs
            </div>
        ";
        }?>
        </div>
        <div id="profileContent">
            <div id="dash-ordersContainer" class="selectedView dash-container">
                <h1>Tableau de bord</h1>
                <p>Chargement...</p>
            </div>
            <?php if($superAdmin){echo '
            <div id="dash-usersContainer" class="notSelectedView dash-container">
                <h1>Utilisateurs</h1>
                <p>Chargement...</p>
            </div>
            <div id="dash-suppliers" class="notSelectedView dash-container">
                
                <label style="display: flex; align-items: center; gap: 10px; margin-bottom:0 !important;"><h1>Fournisseurs</h1> 
                    <button type="button" class="add-supplier-main-btn" onclick="addNewEmptySupplierRow()" style="width: 25px; height: 25px; padding: 0; line-height: 1;">+</button>
                </label>
                <div id="suppliers-container" class="table-scroll-wrapper">
                    <table id="suppliers-table" class="product-summary-table">
                        <thead>
                            <tr>
                                <th>Actions</th>
                                <th style="min-width:150px;">Nom</th>
                                <th>Coût de livraison</th>
                                <th>Livraison gratuite à partir de</th>
                            </tr>
                        </thead>
                        <tbody id="suppliers-body">
                            </tbody>
                    </table>
                </div>
            </div>
    </div>
            ';};
            ?>
        </div>
        
    

    </section>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






