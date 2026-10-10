<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Studio');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('/api/GET/product-studio.js');
    $HEADER->addJsFile('/api/POST/add-product-to-cart.js');

    if($superAdmin){
        $HEADER->addJsFile('/superAdmin/api/UPDATE/product.js');
        $HEADER->addCssFile('/section/main/superAdmin.css');
    }

    $HEADER->validateHeader();

    $activePage = 'Produits';
    
    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');
?>
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

<main>
     <section class="contentPage">
 <?php if($superAdmin){
    $personalizationPlaceholder = '[{"option":"Finissant 2025-2026","price":2}]';
    $encodedPlaceholder = htmlspecialchars($personalizationPlaceholder, ENT_QUOTES);

    $personalizationDetailsPlaceholder = '<p>La gravure par laser est disponible pour ce produit !</p><p>Par contre, vous devrez faire une demande de soumission via le bouton plus bas en nous mentionnant le ou les produits souhaités, leur quantité et joindre votre logo. Un membre de notre équipe communiquera alors avec vous rapidement pour vous fournir une estimation.</p></ul><button>Demander une soumission</button><span>* Les prix affichés dans la grille sont pour le produit sans logo.</span>';
    $encodedPersonalizationDetailsPlaceholder = htmlspecialchars($personalizationDetailsPlaceholder, ENT_QUOTES);

    echo '<button id="superAdmin-editProductBtn" onclick="toggleNewProductForm()"><img class="icons" src="'.$underLevelString.'static-resources/default/icons/black/filter-2.png"></button>';
    echo '
    <div class="fullBlurBg">
        <form id="superAdmin-newProductForm" method="POST">
            <label for="name">Nom du produit</label>
            <input id="name" name="name" type="text" placeholder="Tuque classique">

            <label for="sku">SKU</label>
            <input id="sku" name="sku" type="text" placeholder="H8000-A">

            <label for="description">Description</label>
            <textarea id="description" name="description" placeholder="Notre tuque classique est ..."></textarea>

            <label for="supplier">Fournisseur</label>
            <select id="supplier" name="supplier" onchange="saveCurrentSelections()">
                <option value="">Choisir un fournisseur</option>
            </select>

            <label for="personalization" id="personalizationLabel">
                Option(s) de personnalisation 
                <img title="Copier la syntaxe" 
                     onclick="navigator.clipboard.writeText(\'' . $encodedPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="personalization" name="personalization" placeholder="' . $encodedPlaceholder . '"></textarea>

            <label for="">Méthodes de personnalisation</label>
            <div id="personalizationMethods">
                <div>
                    <label for="customPersonalization">Personnalisé</label>
                    <label class="switch">
                        <input name="customPersonalization" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="blank">Blank</label>
                    <label class="switch">
                        <input name="blank" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="dtf">DTF</label>
                    <label class="switch">
                        <input name="dtf" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="broderie">Broderie</label>
                    <label class="switch">
                        <input name="broderie" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="tampographie">Tampographie</label>
                    <label class="switch">
                        <input name="tampographie" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="vividPrint">VividPrint™</label>
                    <label class="switch">
                        <input name="vividPrint" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="screenPrint">Sérigraphie</label>
                    <label class="switch">
                        <input name="screenPrint" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="engraving">Gravure laser</label>
                    <label class="switch">
                        <input name="engraving" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="patch">Écusson</label>
                    <label class="switch">
                        <input name="patch" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div>
                    <label for="uvdtf">UV DTF</label>
                    <label class="switch">
                        <input name="uvdtf" type="checkbox" value="0">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <label for="customPersonalizationDetails" id="customPersonalizationDetailsLabel" style="display:none;">
                Détails de options personnalisées
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="customPersonalizationDetails" name="customPersonalizationDetails" placeholder="Mettre le html à afficher pour les options personnalisées"  style="display:none;"></textarea>

            <label for="blankDetails" id="blankDetailsLabel" style="display:none;">
                Détails du prix blank
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="blankDetails" name="blankDetails" placeholder="Mettre le html à afficher pour le prix sur demande"  style="display:none;"></textarea>

            <label for="embroideryDetails" id="embroideryDetailsLabel" style="display:none;">
                Détails de broderie
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="embroideryDetails" name="embroideryDetails" placeholder="Mettre le html à afficher pour la broderie"  style="display:none;"></textarea>

            <label for="tampographieDetails" id="tampographieDetailsLabel" style="display:none;">
                Détails de tampographie
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="tampographieDetails" name="tampographieDetails" placeholder="Mettre le html à afficher pour la tampographie"  style="display:none;"></textarea>
            
            <label for="vividPrintDetails" id="vividPrintDetailsLabel" style="display:none;">
                Détails de l\'impression vivid personnalisé
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="vividPrintDetails" name="vividPrintDetails" placeholder="Mettre le html à afficher pour l\'impression vivid"  style="display:none;"></textarea>
            
            <label for="screenPrintDetails" id="screenPrintDetailsLabel" style="display:none;">
                Détails de la sérigraphie personnalisé
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="screenPrintDetails" name="screenPrintDetails" placeholder="Mettre le html à afficher pour la sérigraphie"  style="display:none;"></textarea>
            
            <label for="engravingDetails" id="engravingDetailsLabel" style="display:none;">
                Détails de la gravure par laser personnalisé
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="engravingDetails" name="engravingDetails" placeholder="Mettre le html à afficher pour la gravure par laser"  style="display:none;"></textarea>

            <label for="patchDetails" id="patchDetailsLabel" style="display:none;">
                Détails de l\'écusson personnalisé
                <img title="Copier la syntaxe" 
                    onclick="navigator.clipboard.writeText(\'' . $encodedPersonalizationDetailsPlaceholder . '\')" 
                     src="'.$underLevelString.'static-resources/default/icons/black/copy.png" 
                     style="cursor: pointer; width: 16px; margin-left: 5px;">
            </label>
            <textarea id="patchDetails" name="patchDetails" placeholder="Mettre le html à afficher pour l\'écusson par laser"  style="display:none;"></textarea>

            <label for="zoom">Zoom du canva</label>
            <input id="zoom" name="zoom" type="number" placeholder="1.75">

            <label for="new-category">Catégories</label>
            <div class="flex-row" id="new-category-div">
                <input list="categories-list" id="new-category" name="new-category" placeholder="Vêtements">
                <button type="button" id="new-category-btn" onclick="addNewCategory()">+</button>
                <datalist id="categories-list"></datalist>
            </div>
            <div id="ownedCategory" class="hidden"></div>

            <label style="display: flex; align-items: center; gap: 10px;">Variantes 
                <button type="button" class="add-variant-main-btn" onclick="addNewEmptyVariantRow()" 
                        style="width: 25px; height: 25px; padding: 0; line-height: 1;">+</button>
            </label>

            <div class="table-search-wrapper">
                <input type="text" id="variant-search" placeholder="Rechercher une variante" onkeyup="filterVariants()">
            </div>

            <div id="variants-container" class="table-scroll-wrapper">
                <table id="variants-table" class="product-summary-table">
                    <thead>
                        <tr>
                            <th style="width: 30px; text-align: center;">
                                <input type="checkbox" id="select-all-variants" onclick="toggleSelectAllVariants(this)">
                            </th>
                            <th>Actions</th>
                            <th>Taille</th>
                            <th>Couleur</th>
                            <th>Prix</th>
                            <th>Stock</th>
                        </tr>
                    </thead>
                    <tbody id="variants-body">
                    </tbody>
                </table>
                <datalist id="sizes-list"></datalist>
                <datalist id="colors-list"></datalist>
            </div>

            <label for="img">Images</label>
            <input type="file" id="img" name="img[]" multiple>

            <label for="technicalFile">Fiche technique</label>
            <input id="technicalFile" name="technicalFile" type="file" accept=".pdf">

            <label for="color_imgs">Couleurs (WebP)</label>
            <input type="file" id="color_imgs" name="color_imgs[]" accept="image/*" multiple>

            <label for="active">Afficher sur la boutique</label>
            <label class="switch">
                <input name="active" type="checkbox" value="0">
                <span class="slider round"></span>
            </label>

            <button id="submitBtn" type="button" onclick="updateProduct();">Sauvegarder le produit</button>
            <button id="duplicateProductBtn" class="secondary" type="button" onclick="duplicateProduct()">Dupliquer le produit</button>
            <button id="" class="secondary" type="button" onclick="location.reload()">Annuler</button>
            <button id="deleteProduct" class="secondary" type="button" onclick="deleteProduct()">Supprimer le produit</button>
        </form>
    </div>';
}
?>
        <div id="product-details-container"></div>
     </section>
</main>

<script>
// Helper simple pour sélectionner/désélectionner toutes les cases à cocher des variantes
function toggleSelectAllVariants(masterCb) {
    const checkboxes = document.querySelectorAll('#variants-body .variant-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = masterCb.checked;
    });
}
</script>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>