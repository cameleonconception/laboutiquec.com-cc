window.lastLoadedProductsImgNames = {};

function parseImageFilename(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return { prefix: "", position: 0, timestamp: 0, fullName: "" };
    }

    const cleanName = fileName.split('/').pop().trim();
    const nameWithoutExtension = cleanName.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExtension.split('-');

    const prefix = (parts[0] || "").trim();
    const position = parseInt(parts[1], 10) || 0;
    const timestamp = parts[2] ? (parseInt(parts[2], 10) || 0) : 0;

    return {
        prefix: prefix,
        position: position,
        timestamp: timestamp,
        fullName: cleanName
    };
}

/**
 * Trouve l'image correspondant à un préfixe (couleur ou "thumbnail") et une position donnée dans imgNames.
 * Si le préfixe n'est pas trouvé, retombe automatiquement sur "thumbnail".
 */
/**
 * Trouve l'image correspondant STRICTEMENT à un préfixe (couleur exacte ou "thumbnail")
 * et à une position donnée dans imgNames.
 */
function getProductImageUrl(imgNamesRaw, targetPrefix, targetPosition = 1) {
    let imgNames = imgNamesRaw || [];

    if (typeof imgNames === 'string') {
        try { imgNames = JSON.parse(imgNames); } catch (e) { imgNames = []; }
    }
    if (!Array.isArray(imgNames)) imgNames = [];
    if (imgNames.length === 0) return null;

    const parsedImages = imgNames.map(name => parseImageFilename(name));
    const cleanTargetPrefix = (targetPrefix || '').trim().toLowerCase();

    // 1. Recherche par correspondance EXACTE du préfixe et de la position
    let match = parsedImages.find(img => 
        img.prefix.trim().toLowerCase() === cleanTargetPrefix && img.position === targetPosition
    );

    // 2. Si non trouvé et qu'on cherchait une couleur, on retombe sur "thumbnail" à la MÊME position
    if (!match && cleanTargetPrefix !== 'thumbnail') {
        match = parsedImages.find(img => 
            img.prefix.trim().toLowerCase() === 'thumbnail' && img.position === targetPosition
        );
    }

    return match ? match.fullName : null;
}

document.addEventListener('DOMContentLoaded', function() {
    let productContainer = document.getElementById('products-container');
    let filterSection = document.getElementById('filter-section');

    showSkeletons(productContainer, 10);
    
    const URL = window.location.search;
    const searchParams = new URLSearchParams(URL);
    const activePage = parseInt(searchParams.get("page")) || 1; 
    const query = searchParams.get("query") || '';
    let categoriesRaw = searchParams.get("categories") || '';
    let colorsRaw = searchParams.get("colors") || '';

    let categories = categoriesRaw ? categoriesRaw.split(",") : [];
    let colors = colorsRaw ? colorsRaw.split(",") : [];

    fetch('./api/GET/products?page=' + activePage +'&query='+query+'&categories='+categoriesRaw+'&colors='+colorsRaw)
        .then(response => response.json())
        .then(data => {
            if(data && data.success){
                let productsArray = data.products;
                let superAdminCategoriesList = document.querySelector('#categories-list');
                let superAdminColorsList = document.querySelector('#colors-list');
                let superAdminSizesList = document.querySelector('#sizes-list');

                data.sizes.forEach(size => {
                    if(superAdminSizesList){
                        superAdminSizesList.innerHTML += '<option value="'+size['name']+'">';
                    }      
                });

                    
                productsArray.forEach(p => {
                    window.lastLoadedProductsImgNames[p.sku] = p.imgNames;
                });

                // --- 1. GÉNÉRATION DES COULEURS (AVEC FILTRE INDISPONIBLE BARRÉ) ---
                let colorsHTML = '';
                if(data.colors.length == 0){
                    colorsHTML = '<div class="checkboxFilterContainer">Aucune couleur trouvée</div>';
                }
                
                data.colors.forEach(color => {
                    if(superAdminColorsList){
                        superAdminColorsList.innerHTML += '<option value="'+color['name']+'">';
                    }

                    let isChecked = colors.includes(color['name']);
                    // Si l'API fournit les couleurs valides restantes, on l'utilise, sinon fallback sur true
                    let isValid = data.validColors ? data.validColors.includes(color['name']) : true;
                    let isDisabled = !isChecked && !isValid;

                    let safeColorName = escapeHTML(color['name']);

                    colorsHTML += `
                        <div class='checkboxFilterContainer ${isDisabled ? 'disabled-filter' : ''}'>
                            <input type='checkbox' data-type='colors' data-name="${safeColorName}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                            <label>${color['name']}</label>
                            <img title="${safeColorName}" class="color-thumbnail-image"
                                src="./static-resources/products/colors/${encodeURIComponent(color['name'])}.webp" 
                                alt="Couleur ${safeColorName}" loading="lazy">
                        </div>`;
                });

                // --- 2. GÉNÉRATION DES CATÉGORIES (AVEC FILTRE INDISPONIBLE BARRÉ) ---
                let categoriesHTML = '';
                if(data.categories.length == 0){
                    categoriesHTML = '<div class="checkboxFilterContainer">Aucune categorie trouvée</div>';
                }
                
                data.categories.forEach(categorie => {
                    if(superAdminCategoriesList){
                        superAdminCategoriesList.innerHTML += '<option value="'+categorie['name']+'">';
                    }

                    let isChecked = categories.includes(categorie['name']);
                    // Si l'API fournit les catégories valides restantes, on l'utilise, sinon fallback sur true
                    let isValid = data.validCategories ? data.validCategories.includes(categorie['name']) : true;
                    let isDisabled = !isChecked && !isValid;

                    let safeCatName = escapeHTML(categorie['name']);

                    categoriesHTML += `
                        <div class='checkboxFilterContainer ${isDisabled ? 'disabled-filter' : ''}'>
                            <input type='checkbox' data-type='categories' data-name="${safeCatName}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                            <label>${categorie['name']}</label>
                        </div>`;
                });
              
                // --- 3. INJECTION DU CODE DANS LE FILTER SECTION ---
                filterSection.innerHTML = `
                    <details>
                        <summary>Catégories</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher une catégorie" 
                                   onkeyup="filterList(this, 'categories-container')">
                            <div id="categories-container">
                                ${categoriesHTML}
                            </div>
                            <button onclick='searchProduct()'>Filtrer</button>
                        </div>
                    </details>
                    <details>
                        <summary>Couleurs</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher une couleur" 
                                   onkeyup="filterList(this, 'colors-container')">
                            <div id="colors-container">
                                ${colorsHTML}
                            </div>
                            <button onclick='searchProduct()'>Filtrer</button>
                        </div>
                    </details>
                    <input id='searchBar' type='search' placeholder='Rechercher...' value='${query}'>
                    <button onclick='searchProduct()'>Filtrer</button>
                    <a class='toHideInBigScreen' href='./produits'>Supprimer les filtres</a>
                    <img onclick='window.location.href="./produits"' class='icons' src='static-resources/default/icons/black/reload.png'>
                `;

                const searchBarInput = document.querySelector('#searchBar');
                if (searchBarInput) {
                    searchBarInput.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            searchProduct();
                        }
                    });
                }

// --- 4. AFFICHAGE DES BADGES DE FILTRES ACTIFS (#ownedCategory) ---
                const ownedCategory = document.querySelector('#ownedCategory');
                if (ownedCategory) {
                    ownedCategory.innerHTML = ''; // Réinitialisation
                    
                    // Filtrage des éléments non vides
                    const activeCategories = categories.filter(cat => cat.trim() !== "");
                    const activeColors = colors.filter(col => col.trim() !== "");

                    // Masquer si aucun filtre n'est actif, sinon l'afficher
                    if (activeCategories.length === 0 && activeColors.length === 0) {
                        ownedCategory.style.display = 'none';
                    } else {
                        ownedCategory.style.display = 'flex'; // ou 'block' selon votre CSS

                        // Génération des badges pour les catégories sélectionnées
                        activeCategories.forEach(cat => {
                            addNewCategoryBadge(cat, 'categories');
                        });
                        
                        // Génération des badges pour les couleurs sélectionnées
                        activeColors.forEach(col => {
                            addNewCategoryBadge(col, 'colors');
                        });
                    }
                }

                if (productsArray.length === 0) {
    productContainer.innerHTML = `<div class='cartMessage'><p>Nous n'avons trouvé aucun produit</p>
    <div class="actionContainer" style="display:none;">
        <a href="catalogues" class="btn-primary">Voir tous nos produits (catalogues)</a>
        <a href="https://cameleonconception.com/contact" class="btn-secondary">Nous joindre</a>
    </div>    
    </div>`;
    return; 
} else {
    productContainer.innerHTML = '';

    productsArray.forEach(product => {
        const baseSku = product.sku;
        
        // Redirection vers la vue appropriée (details ou studio)
        let view = "details";
        if (product.dtf || product.broderie || product.uvdtf) {
            view = "studio";
        }

        // Calcul du prix
        product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
        const formattedPrice = parseFloat(product.lowestPrice).toFixed(2).replace('.', ',');
        let activeHtml = product.active == 0 ? 'notActive' : '';

        // 1. Identification des couleurs correspondantes aux filtres actifs
        let matchingColors = [];
        if (colors && colors.length > 0 && product.availableColors) {
            matchingColors = product.availableColors.filter(color => colors.includes(color));
        }

        // Si des couleurs sont filtrées, on crée une carte par couleur.
        // Sinon, une seule carte par défaut.
        let colorsToRender = matchingColors.length > 0 ? matchingColors : [null];

        // 2. Génération des cartes pour chaque couleur
        // 2. Génération des cartes pour chaque couleur
        colorsToRender.forEach((currentColor) => {
            
            // Identifiant DOM unique pour éviter les conflits
            const uniqueCardId = currentColor ? `${baseSku}-${currentColor.replace(/\s+/g, '_')}` : baseSku;

            // Préfixe recherché : la couleur si sélectionnée, sinon 'thumbnail'
            const targetPrefix = currentColor ? currentColor.trim() : 'thumbnail';
            
            // Récupération dynamique du nom d'image depuis product.imgNames
            const foundImageName = getProductImageUrl(product.imgNames, targetPrefix, 1);

            // Construction de l'URL finale
            let initialImageSrc = foundImageName 
                ? `static-resources/products/${baseSku}/${foundImageName}`
                : `./static-resources/default/products/introuvable.webp`;

            // Lien de redirection au clic
            let cardRedirectUrl = `./produits/${view}?pid=${product.id}`;
            if (currentColor) {
                cardRedirectUrl += `&selectedColor=${encodeURIComponent(currentColor)}`;
            }

            const card = document.createElement('div');
            card.className = `product-card ${activeHtml}`;
            card.onclick = () => window.location.href = cardRedirectUrl;

            // On stocke le préfixe actif sur le wrapper de miniatures
            card.innerHTML = `
                <div class="thumbnail-wrapper" data-sku="${uniqueCardId}" data-real-sku="${baseSku}" data-prefix="${targetPrefix}"> 
                    <div class="thumbnail-skeleton"></div> 
                    <img id="img-${uniqueCardId}" 
                        class="product-image"
                        src="${initialImageSrc}" 
                        alt="Image du produit ${product.name} ${currentColor ? '- ' + currentColor : ''}"
                        data-current-thumb="1"
                        loading="lazy" 
                        onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none';" 
                        onerror="this.src='./static-resources/default/products/introuvable.webp'; this.classList.add('loaded'); this.previousElementSibling.style.display='none';">
                    
                    <div class='thumb-nav-container'>
                        <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                        <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                    </div>
                </div>
                <div class="product-info-wrapper"></div>
                <div class="color-thumbnails-wrapper"></div>
            `;

            productContainer.appendChild(card);

            // Injection des textes
            setTimeout(() => {
                const infoWrapper = card.querySelector('.product-info-wrapper');
                infoWrapper.innerHTML = `
                    <div class="product-info">
                        <h3>${product.name} - ${baseSku}</h3>
                        <p>${product.supplier.name}</p>
                        <p style="display:none;">À partir de : ${formattedPrice} $</p>
                    </div>
                `;
            }, 50);

            // Injection des pastilles de couleurs
            setTimeout(() => {
                const colorWrapper = card.querySelector('.color-thumbnails-wrapper');
                let colorThumbnailBloc = '';
                
product.availableColors.forEach(color => {
    let isCurrentClass = (color === currentColor) ? 'active-color-thumb' : '';
    let safeColor = escapeHTML(color);
    let encodedColor = encodeURIComponent(color);

    colorThumbnailBloc += `<img title="${safeColor}"
        class="color-thumbnail-image ${isCurrentClass}"
        src="static-resources/products/colors/${encodedColor}.webp" 
        alt="Image de la couleur ${safeColor}"
        loading="lazy" 
        onclick="window.location.href='./produits/${view}?pid=${product.id}&selectedColor=${encodedColor}'; event.stopPropagation();"
    >`;
});
                
                colorWrapper.innerHTML = colorThumbnailBloc;
            }, 150);

            updateThumbnailNavVisibility(uniqueCardId);
        });
    });

let supplierSelect = document.querySelector('#supplier');
if (data.suppliers && supplierSelect) {
    let suppliers = data.suppliers;
    suppliers.forEach(supplier => {
        supplierSelect.innerHTML += "<option value='" + supplier.id + "'>" + supplier.name + "</option>";
    });
}

                    // Initialisation de la visibilité des flèches pour tous les produits
                    productsArray.forEach(product => {
                        updateThumbnailNavVisibility(product.sku); 
                    });

                    // ----------------------------------------------------------------------
                    // GESTION DE LA PAGINATION
                    // ----------------------------------------------------------------------
                    if (data.totalProducts !== undefined) {
    generatePagination(data.totalProducts, activePage);
    initInfiniteScroll(activePage, data.totalProducts);
}
                    // ----------------------------------------------------------------------
                }
            }
        })
        .catch(error => console.error('Erreur lors du chargement des produits:', error));
});

function filterList(input, containerId) {
    const filter = input.value.toLowerCase(); // On récupère le texte en minuscule
    const container = document.getElementById(containerId);
    const items = container.getElementsByClassName('checkboxFilterContainer');

    for (let i = 0; i < items.length; i++) {
        // On récupère le texte du label à l'intérieur du container
        const label = items[i].getElementsByTagName('label')[0];
        const textValue = label.textContent || label.innerText;

        if (textValue.toLowerCase().indexOf(filter) > -1) {
            items[i].style.display = ""; // On affiche si ça correspond
        } else {
            items[i].style.display = "none"; // On masque si ça ne correspond pas
        }
    }
}

// ----------------------------------------------------------------------
// FONCTION DE PAGINATION (MODIFIÉE)
// ----------------------------------------------------------------------


function generatePagination(totalProducts, activePage) {
    updatePaginationDisplay(activePage, totalProducts);
}

function updatePaginationDisplay(activePage, totalProducts) {
    const productsPerPage = 20;
    const pageCount = Math.ceil(totalProducts / productsPerPage);
    const pagesSection = document.getElementById('pages-section');
    if (!pagesSection) return;

    pagesSection.innerHTML = '';

    // Flèche Précédent (<)
    const prevPage = activePage - 2;
    pagesSection.innerHTML += prevPage >= 1
        ? `<a class="page-nav" href="?page=${prevPage}">&lt;</a>`
        : `<a class="page-nav disabled" style="display:none;">&lt;</a>`;

    // Uniquement la page précédente (si elle existe)
    if (activePage - 1 >= 1) {
        pagesSection.innerHTML += `<a href='?page=${activePage - 1}'>${activePage - 1}</a>`;
    }

    // Page active actuelle
    pagesSection.innerHTML += `<a class='active' href='?page=${activePage}'>${activePage}</a>`;

    // Uniquement la page suivante (si elle existe)
    if (activePage + 1 <= pageCount) {
        pagesSection.innerHTML += `<a href='?page=${activePage + 1}'>${activePage + 1}</a>`;
    }

    // Flèche Suivant (>)
    const nextPage = activePage + 2;
    pagesSection.innerHTML += nextPage <= pageCount
        ? `<a class="page-nav" href="?page=${nextPage}">&gt;</a>`
        : `<a class="page-nav disabled" style="display:none;">&gt;</a>`;

    // Masque la pagination globale s'il n'y a qu'une seule page ou zéro
    if (pageCount <= 1) {
        pagesSection.querySelectorAll('.page-nav').forEach(el => el.style.display = 'none');
    }
}
// ----------------------------------------------------------------------
// Fonctions de Navigation des Miniatures (Inchangées)
// ----------------------------------------------------------------------

/**
 * Change la miniature affichée pour un SKU donné, en gérant le skeleton pendant le chargement de la nouvelle image.
 * @param {string} sku Le SKU du produit.
 * @param {number} direction -1 pour précédent, 1 pour suivant.
 */
/**
 * Change la miniature affichée pour une carte produit.
 */
/**
 * Change la miniature affichée pour une carte produit lors du clic sur les flèches.
 */
function switchThumbnailOnDemand(uniqueCardId, direction) {
    const imgElement = document.getElementById(`img-${uniqueCardId}`);
    if (!imgElement) return;

    const thumbnailWrapper = imgElement.closest('.thumbnail-wrapper');
    const realSku = thumbnailWrapper.getAttribute('data-real-sku') || uniqueCardId;
    const prefix = thumbnailWrapper.getAttribute('data-prefix') || 'thumbnail';

    let currentThumb = parseInt(imgElement.getAttribute('data-current-thumb')) || 1;
    const nextThumb = currentThumb + direction;

    if (nextThumb < 1) return;

    // Récupérer la liste des images enregistrées pour ce produit
    const rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];

    // Recherche de l'image suivante STRICTEMENT pour ce préfixe
    const foundImageName = getProductImageUrl(rawImgNames, prefix, nextThumb);

    // Si aucune image stricte n'existe pour cet incrément, on stoppe la navigation
    if (!foundImageName) return;

    const skeletonElement = imgElement.previousElementSibling;
    imgElement.classList.remove('loaded'); 
    if (skeletonElement && skeletonElement.classList.contains('thumbnail-skeleton')) {
        skeletonElement.style.display = 'block';
    }

    const nextSrc = `static-resources/products/${realSku}/${foundImageName}`;

    const tempImg = new Image();
    tempImg.onload = function() {
        imgElement.src = nextSrc;
        imgElement.setAttribute('data-current-thumb', nextThumb.toString());
        imgElement.classList.add('loaded');
        if (skeletonElement) skeletonElement.style.display = 'none'; 
        
        // Mise à jour de l'état (disabled/enabled) des flèches
        updateThumbnailNavVisibility(uniqueCardId); 
    };
    
    tempImg.onerror = function() {
        imgElement.src = './static-resources/default/products/introuvable.webp';
        imgElement.classList.add('loaded');
        if (skeletonElement) skeletonElement.style.display = 'none';
    };
    
    tempImg.src = nextSrc;
}
/**
 * Met à jour l'état (disabled/enabled) des flèches selon les images réelles du tableau imgNames.
 */
/**
 * Met à jour l'affichage et l'état des flèches de navigation des miniatures.
 * Masque totalement le bloc de flèches s'il n'y a qu'une seule image pour le préfixe donné.
 * 
 * @param {string} uniqueCardId L'identifiant unique de la carte produit (ex: "SKU-Couleur")
 */
function updateThumbnailNavVisibility(uniqueCardId) {
    const imgElement = document.getElementById(`img-${uniqueCardId}`);
    if (!imgElement) return;

    const thumbnailWrapper = imgElement.closest('.thumbnail-wrapper');
    if (!thumbnailWrapper) return;

    const navContainer = thumbnailWrapper.querySelector('.thumb-nav-container');
    const prevBtn = thumbnailWrapper.querySelector('.thumb-prev');
    const nextBtn = thumbnailWrapper.querySelector('.thumb-next');

    const realSku = thumbnailWrapper.getAttribute('data-real-sku') || uniqueCardId;
    const prefix = thumbnailWrapper.getAttribute('data-prefix') || 'thumbnail';
    const currentThumb = parseInt(imgElement.getAttribute('data-current-thumb')) || 1;

    // Récupération de la liste des images enregistrées pour ce produit
    let rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];
    if (typeof rawImgNames === 'string') {
        try { rawImgNames = JSON.parse(rawImgNames); } catch (e) { rawImgNames = []; }
    }

    // 1. Compter combien d'images correspondent exactement à ce préfixe
    const matchingImages = rawImgNames.filter(fileName => {
        const parsed = parseImageFilename(fileName);
        return parsed.prefix.toLowerCase() === prefix.toLowerCase();
    });

    // Fallback : Si aucune image n'est trouvée pour la couleur, on compte celles avec 'thumbnail'
    let count = matchingImages.length;
    if (count === 0 && prefix.toLowerCase() !== 'thumbnail') {
        count = rawImgNames.filter(fileName => {
            const parsed = parseImageFilename(fileName);
            return parsed.prefix.toLowerCase() === 'thumbnail';
        }).length;
    }

    // 2. Masquer totalement le conteneur s'il y a 1 seule image (ou moins)
    if (count <= 1) {
        if (navContainer) navContainer.style.display = 'none';
        return;
    }

    // Sinon, on s'assure que le conteneur est visible
    if (navContainer) navContainer.style.display = 'flex';

    // 3. Gestion de l'état désactivé/activé des flèches
    // Flèche Précédent
    if (prevBtn) {
        if (currentThumb <= 1) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
    }

    // Flèche Suivant : vérifie s'il existe une image pour la position suivante
    if (nextBtn) {
        const nextImageName = getProductImageUrl(rawImgNames, prefix, currentThumb + 1);
        if (!nextImageName) {
            nextBtn.classList.add('disabled');
        } else {
            nextBtn.classList.remove('disabled');
        }
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/'/g, "&#39;")
        .replace(/"/g, "&quot;");
}
// Fonction pour ajouter visuellement un Badge de filtre sélectionné (Modèle synchronisé sur Catalogues)
// Fonction pour ajouter visuellement un Badge de filtre sélectionné (Modèle synchronisé sur Catalogues)
function addNewCategoryBadge(value, type) {
    let ownedCategory = document.querySelector('#ownedCategory');
    if (!ownedCategory) return;

    const badgeDiv = document.createElement('div');
    badgeDiv.setAttribute('data-filter-value', value);
    badgeDiv.classList.add('badge-filter'); // Optionnel pour le CSS

    // Si c'est un filtre de couleur, on insère la balise <img> avant le texte
    let imageHtml = '';
    if (type === 'colors') {
        imageHtml = `<img title="${value}" class="color-thumbnail-image"
            src="./static-resources/products/colors/${value}.webp" 
            alt="Couleur ${value}" loading="lazy">`;
    }

    badgeDiv.innerHTML = `${imageHtml}<span>${value}</span><button type="button" class="deleteBtn">x</button>`;

    // Gestion du clic pour désélectionner et recharger
    badgeDiv.querySelector('.deleteBtn').onclick = () => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-type="${type}"][data-name="${value}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        badgeDiv.remove();
        searchProduct(); // Relance la recherche
    };

    ownedCategory.appendChild(badgeDiv);
}

// Fonction de recherche mise à jour pour lire les valeurs actuelles des inputs
// Fonction de recherche mise à jour pour inclure à la fois la catégorie/couleur et le mot-clé textuel
// Fonction de recherche mise à jour avec encodage sécurisé des caractères spéciaux et apostrophes
function searchProduct() {
    let searchBar = document.querySelector('#searchBar');
    let searchBarValue = searchBar ? searchBar.value.trim() : "";
    
    let checkedColors = [];
    let checkedCategories = [];

    // Récupérer les filtres cochés
    document.querySelectorAll('input[type="checkbox"][data-type="colors"]:checked').forEach(color => {
        checkedColors.push(color.dataset.name);
    });

    document.querySelectorAll('input[type="checkbox"][data-type="categories"]:checked').forEach(categorie => {
        checkedCategories.push(categorie.dataset.name);
    });

    // Encodage strict avec URLSearchParams pour gérer les apostrophes ('), espaces et caractères spéciaux sans cassure
    const params = new URLSearchParams();
    if (searchBarValue) params.set('query', searchBarValue);
    if (checkedCategories.length > 0) params.set('categories', checkedCategories.join(','));
    if (checkedColors.length > 0) params.set('colors', checkedColors.join(','));

    window.location.href = './produits?' + params.toString();
}

/**
 * Fonction pour actualiser l'état des cases à cocher côté client
 * après réception de la réponse du serveur (JSON)
 */
function syncUIWithServerResponse(response) {
    if (!response || !response.success) return;

    // Cocher dynamiquement les catégories suggérées par la recherche
    if (response.appliedCategories && Array.isArray(response.appliedCategories)) {
        response.appliedCategories.forEach(catName => {
            let el = document.querySelector(`input[type="checkbox"][data-type="categories"][data-name="${catName}"]`);
            if (el) el.checked = true;
        });
    }

    // Cocher dynamiquement les couleurs suggérées par la recherche
    if (response.appliedColors && Array.isArray(response.appliedColors)) {
        response.appliedColors.forEach(colorName => {
            let el = document.querySelector(`input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`);
            if (el) el.checked = true;
        });
    }
}
/**
 * Fonction à appeler lors de la réception des données API (ou au chargement de la page)
 * Elle coche automatiquement les catégories/couleurs enrichies côté PHP.
 */
function autoSelectAppliedFilters(appliedCategories = [], appliedColors = []) {
    // Cocher les catégories appliquées par la recherche
    appliedCategories.forEach(catName => {
        let checkbox = document.querySelector(`input[type="checkbox"][data-type="categories"][data-name="${catName}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });

    // Cocher les couleurs appliquées par la recherche
    appliedColors.forEach(colorName => {
        let checkbox = document.querySelector(`input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

function toggleFilterSection() {
    let toggleBtn = document.querySelector('#toggle-filter-section');
    let filterSection = document.querySelector('#filter-section');
    let icon = document.querySelector('#toggle-filter-section img');

    toggleBtn.classList.toggle('open');

    if (toggleBtn.classList.contains('open')) {
        filterSection.style.display = 'flex';
        icon.src = 'static-resources/default/icons/white/x.png';
        toggleBtn.classList.add("fullWidth");
    } else {
        filterSection.style.display = 'none';
        icon.src = 'static-resources/default/icons/white/filter-2.png';
        toggleBtn.classList.remove("fullWidth");
    }
}

function showSkeletons(container, count = 8) {
    let skeletonsHtml = '';
    for (let i = 0; i < count; i++) {
        skeletonsHtml += `<div class="skeleton-card"></div>`;
    }
    container.innerHTML = skeletonsHtml;
}

function initInfiniteScroll(currentPage, totalProducts) {
  const productsPerPage = 20;
  const pageCount = Math.ceil(totalProducts / productsPerPage);

  const productContainer = document.getElementById('products-container');
  const pagesSection = document.getElementById('pages-section');
  if (!pagesSection || !productContainer) return;

  let loadingNext = false;
  let nextPage = currentPage + 1;

  // ── Observer de l'URL : surveille data-page-end (dernière carte de chaque page) ──
  const urlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const page = parseInt(entry.target.dataset.pageEnd);
      if (!page) return;

      const params = new URLSearchParams(window.location.search);
      let newPage = null;

      if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
        newPage = page + 1;
      } else if (entry.isIntersecting) {
        newPage = page;
      }

      if (newPage) {
        params.set('page', newPage);
        window.history.replaceState(null, '', '?' + params.toString());
        updatePaginationDisplay(newPage, totalProducts);
      }
    });
  }, { threshold: 0 });

  // ── Marquer la dernière carte de la page courante ─────────
  const allCards = productContainer.querySelectorAll('.product-card');
  const lastCard = allCards[allCards.length - 1];
  if (lastCard) {
    lastCard.dataset.pageEnd = currentPage;
    urlObserver.observe(lastCard);
  }

  // ── SENTINEL BAS : fetch page suivante ────────────────────
  if (currentPage < pageCount) {
    const sentinelNext = document.createElement('div');
    sentinelNext.style.cssText = 'height:1px; margin-top:40px;';
    pagesSection.parentNode.insertBefore(sentinelNext, pagesSection.nextSibling);

    const observerNext = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || loadingNext) return;
      if (nextPage > pageCount) { observerNext.disconnect(); return; }

      loadingNext = true;

      const searchParams = new URLSearchParams(window.location.search);
      const query = searchParams.get('query') || '';
      const categoriesRaw = searchParams.get('categories') || '';
      const colorsRaw = searchParams.get('colors') || '';
      const colors = colorsRaw ? colorsRaw.split(",") : [];

      fetch(`./api/GET/products?page=${nextPage}&query=${query}&categories=${categoriesRaw}&colors=${colorsRaw}`)
        .then(r => r.json())
        .then(data => {
          if (!data || !data.success) return;

          let lastNewCard = null;

          data.products.forEach((product) => {
            const baseSku = product.sku;

            // 1. Sauvegarde des imgNames en mémoire pour la navigation par flèches
            window.lastLoadedProductsImgNames[baseSku] = product.imgNames;

            // Vue appropriée (details ou studio)
            let view = 'details';
            if (product.dtf || product.broderie || product.uvdtf) view = 'studio';

            // Calcul du prix
            product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
            const formattedPrice = parseFloat(product.lowestPrice).toFixed(2).replace('.', ',');
            let activeHtml = product.active == 0 ? 'notActive' : '';

            // Nom du fournisseur
            const supplierName = (product.supplier && product.supplier.name) ? product.supplier.name : '';

            // 2. Identification des couleurs filtrées
            let matchingColors = [];
            if (colors && colors.length > 0 && product.availableColors) {
              matchingColors = product.availableColors.filter(color => colors.includes(color));
            }

            let colorsToRender = matchingColors.length > 0 ? matchingColors : [null];

            // 3. Génération des cartes pour chaque couleur
            colorsToRender.forEach((currentColor) => {
              const uniqueCardId = currentColor ? `${baseSku}-${currentColor.replace(/\s+/g, '_')}` : baseSku;
              const targetPrefix = currentColor ? currentColor.trim() : 'thumbnail';

              // Recherche dynamique de l'image réelle
              const foundImageName = getProductImageUrl(product.imgNames, targetPrefix, 1);

              let initialImageSrc = foundImageName 
                ? `static-resources/products/${baseSku}/${foundImageName}`
                : `./static-resources/default/products/introuvable.webp`;

              let cardRedirectUrl = `./produits/${view}?pid=${product.id}`;
              if (currentColor) {
                cardRedirectUrl += `&selectedColor=${encodeURIComponent(currentColor)}`;
              }

              const card = document.createElement('div');
              card.className = `product-card ${activeHtml}`;
              card.onclick = () => window.location.href = cardRedirectUrl;

              card.innerHTML = `
                <div class="thumbnail-wrapper" data-sku="${uniqueCardId}" data-real-sku="${baseSku}" data-prefix="${targetPrefix}">
                  <div class="thumbnail-skeleton"></div>
                  <img id="img-${uniqueCardId}"
                    class="product-image"
                    src="${initialImageSrc}"
                    alt="Image du produit ${product.name} ${currentColor ? '- ' + currentColor : ''}"
                    data-current-thumb="1"
                    loading="lazy"
                    onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none';"
                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.removeAttribute('onerror'); this.classList.add('loaded'); this.previousElementSibling.style.display='none';">
                  <div class='thumb-nav-container'>
                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                    <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                  </div>
                </div>
                <div class="product-info-wrapper"></div>
                <div class="color-thumbnails-wrapper"></div>
              `;

              productContainer.appendChild(card);
              lastNewCard = card;

              // Injection des infos textuelles
              setTimeout(() => {
                card.querySelector('.product-info-wrapper').innerHTML = `
                  <div class="product-info">
                    <h3>${product.name} - ${baseSku}</h3>
                    <p>${supplierName}</p>
                    <p style="display:none;">À partir de : ${formattedPrice} $</p>
                  </div>
                `;
              }, 50);

              // Injection des pastilles de couleurs
              setTimeout(() => {
                let colorThumbnailBloc = '';
                if (product.availableColors) {
                 product.availableColors.forEach(color => {
    let isCurrentClass = (color === currentColor) ? 'active-color-thumb' : '';
    let safeColor = escapeHTML(color);
    let encodedColor = encodeURIComponent(color);

    colorThumbnailBloc += `<img title="${safeColor}"
        class="color-thumbnail-image ${isCurrentClass}"
        src="static-resources/products/colors/${encodedColor}.webp" 
        alt="Image de la couleur ${safeColor}"
        loading="lazy" 
        onclick="window.location.href='./produits/${view}?pid=${product.id}&selectedColor=${encodedColor}'; event.stopPropagation();"
    >`;
});
                }
                card.querySelector('.color-thumbnails-wrapper').innerHTML = colorThumbnailBloc;
              }, 150);

              // Mise à jour de la visibilité des flèches de miniatures
              updateThumbnailNavVisibility(uniqueCardId);
            });
          });

          // ── Marquer la dernière carte générée pour l'URL Observer ──
          if (lastNewCard) {
            lastNewCard.dataset.pageEnd = nextPage;
            urlObserver.observe(lastNewCard);
          }

          nextPage++;
          loadingNext = false;
          if (nextPage > pageCount) observerNext.disconnect();
        })
        .catch(err => {
          console.error('Erreur scroll infini:', err);
          loadingNext = false;
        });

    }, { rootMargin: '0px 0px 300px 0px' });

    observerNext.observe(sentinelNext);
  }
}