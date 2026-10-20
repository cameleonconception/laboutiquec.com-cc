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

function getProductImageUrl(imgNamesRaw, targetPrefix, targetPosition = 1) {
    let imgNames = imgNamesRaw || [];

    if (typeof imgNames === 'string') {
        try { imgNames = JSON.parse(imgNames); } catch (e) { imgNames = []; }
    }
    if (!Array.isArray(imgNames)) imgNames = [];
    if (imgNames.length === 0) return null;

    const parsedImages = imgNames.map(name => parseImageFilename(name));
    const cleanTargetPrefix = (targetPrefix || '').trim().toLowerCase();

    let match = parsedImages.find(img => 
        img.prefix.trim().toLowerCase() === cleanTargetPrefix && img.position === targetPosition
    );

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

    let totalLoadedProducts = 0; // Compteur global de produits affichés

    // --- 1. CHARGEMENT DE VOS PRODUITS (PRIORITAIRES) ---
    fetch('./api/GET/products?page=' + activePage +'&query='+query+'&categories='+categoriesRaw+'&colors='+colorsRaw)
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                let productsArray = data.products;
                let superAdminCategoriesList = document.querySelector('#categories-list');
                let superAdminColorsList = document.querySelector('#colors-list');
                let superAdminSizesList = document.querySelector('#sizes-list');

                if (data.sizes) {
                    data.sizes.forEach(size => {
                        if (superAdminSizesList) {
                            superAdminSizesList.innerHTML += '<option value="'+size['name']+'">';
                        }      
                    });
                }

                productsArray.forEach(p => {
                    window.lastLoadedProductsImgNames[p.sku] = p.imgNames;
                });

                // Génération filtres couleurs
                let colorsHTML = '';
                if (data.colors && data.colors.length === 0) {
                    colorsHTML = '<div class="checkboxFilterContainer">Aucune couleur trouvée</div>';
                } else if (data.colors) {
                    data.colors.forEach(color => {
                        if (superAdminColorsList) {
                            superAdminColorsList.innerHTML += '<option value="'+color['name']+'">';
                        }

                        let isChecked = colors.includes(color['name']);
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
                }

                // Génération filtres catégories
                let categoriesHTML = '';
                if (data.categories && data.categories.length === 0) {
                    categoriesHTML = '<div class="checkboxFilterContainer">Aucune categorie trouvée</div>';
                } else if (data.categories) {
                    data.categories.forEach(categorie => {
                        if (superAdminCategoriesList) {
                            superAdminCategoriesList.innerHTML += '<option value="'+categorie['name']+'">';
                        }

                        let isChecked = categories.includes(categorie['name']);
                        let isValid = data.validCategories ? data.validCategories.includes(categorie['name']) : true;
                        let isDisabled = !isChecked && !isValid;
                        let safeCatName = escapeHTML(categorie['name']);

                        categoriesHTML += `
                            <div class='checkboxFilterContainer ${isDisabled ? 'disabled-filter' : ''}'>
                                <input type='checkbox' data-type='categories' data-name="${safeCatName}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                                <label>${categorie['name']}</label>
                            </div>`;
                    });
                }
              
                // Injection du code dans filterSection
                filterSection.innerHTML = `
                    <details>
                        <summary>Catégories</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher une catégorie" 
                                   onkeyup="filterList(this, 'categories-container')">
                            <div id="categories-container">${categoriesHTML}</div>
                            <button onclick='searchProduct()'>Filtrer</button>
                        </div>
                    </details>
                    <details>
                        <summary>Couleurs</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher une couleur" 
                                   onkeyup="filterList(this, 'colors-container')">
                            <div id="colors-container">${colorsHTML}</div>
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

                // Badges
                const ownedCategory = document.querySelector('#ownedCategory');
                if (ownedCategory) {
                    ownedCategory.innerHTML = '';
                    const activeCategories = categories.filter(cat => cat.trim() !== "");
                    const activeColors = colors.filter(col => col.trim() !== "");

                    if (activeCategories.length === 0 && activeColors.length === 0) {
                        ownedCategory.style.display = 'none';
                    } else {
                        ownedCategory.style.display = 'flex';
                        activeCategories.forEach(cat => addNewCategoryBadge(cat, 'categories'));
                        activeColors.forEach(col => addNewCategoryBadge(col, 'colors'));
                    }
                }

                productContainer.innerHTML = '';

                // Rendu des produits internes
                productsArray.forEach(product => {
                    const baseSku = product.sku;
                    let view = (product.dtf || product.broderie || product.uvdtf) ? "studio" : "details";

                    product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
                    const formattedPrice = parseFloat(product.lowestPrice).toFixed(2).replace('.', ',');
                    let activeHtml = product.active == 0 ? 'notActive' : '';

                    let matchingColors = [];
                    if (colors && colors.length > 0 && product.availableColors) {
                        matchingColors = product.availableColors.filter(color => colors.includes(color));
                    }
                    let colorsToRender = matchingColors.length > 0 ? matchingColors : [null];

                    colorsToRender.forEach((currentColor) => {
                        totalLoadedProducts++; // Incrémente le compteur

                        const uniqueCardId = currentColor ? `${baseSku}-${currentColor.replace(/\s+/g, '_')}` : baseSku;
                        const targetPrefix = currentColor ? currentColor.trim() : 'thumbnail';
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
                                <span class="product-tag-usine">Directement de l'usine</span>
                                <div class="thumbnail-skeleton"></div> 
                                <img id="img-${uniqueCardId}" 
                                    class="product-image"
                                    src="${initialImageSrc}" 
                                    alt="Image du produit ${product.name} ${currentColor ? '- ' + currentColor : ''}"
                                    data-current-thumb="1"
                                    loading="lazy" 
                                    onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';" 
                                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                                
                                <div class='thumb-nav-container'>
                                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                                    <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                                </div>
                            </div>
                            <div class="product-info-wrapper"></div>
                            <div class="color-thumbnails-wrapper"></div>
                        `;

                        productContainer.appendChild(card);

                        setTimeout(() => {
                            const infoWrapper = card.querySelector('.product-info-wrapper');
                            if (infoWrapper) {
                                infoWrapper.innerHTML = `
                                    <div class="product-info">
                                        <h3>${product.name}</h3>
                                        <p>${baseSku}</p>
                                        <p style="display:none;">À partir de : ${formattedPrice} $</p>
                                    </div>
                                `;
                            }
                        }, 50);

                        setTimeout(() => {
                            const colorWrapper = card.querySelector('.color-thumbnails-wrapper');
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
                            if (colorWrapper) colorWrapper.innerHTML = colorThumbnailBloc;
                        }, 150);

                        updateThumbnailNavVisibility(uniqueCardId);
                    });
                });

                let supplierSelect = document.querySelector('#supplier');
                if (data.suppliers && supplierSelect) {
                    data.suppliers.forEach(supplier => {
                        supplierSelect.innerHTML += "<option value='" + supplier.id + "'>" + supplier.name + "</option>";
                    });
                }

                if (data.totalProducts !== undefined) {
                    generatePagination(data.totalProducts, activePage);
                    initInfiniteScroll(activePage, data.totalProducts);
                }
            } else {
                productContainer.innerHTML = '';
            }

            // --- 2. APRES VOS PRODUITS, ON FETCH ET AJOUTE LES PRODUITS SAGE ---
            return fetch('./api/GET/sageProducts?page=' + activePage +'&query='+query+'&categories='+categoriesRaw+'&colors='+colorsRaw);
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if (data && data.ok && Array.isArray(data.products)) {
                let sageProductsArray = data.products;

                sageProductsArray.forEach(product => {
                    totalLoadedProducts++; // Incrémente le compteur

                    const baseSku = product.spc || product.prodEId;
                    const productName = product.name || '';
                    let initialImageSrc = product.thumbPic || './static-resources/default/products/introuvable.webp';
                    
                    if (product.thumbPic) {
                        initialImageSrc = product.thumbPic.replace('RS=150', 'RS=300');
                    }

                    window.lastLoadedProductsImgNames[baseSku] = product.thumbPic ? [product.thumbPic] : [];

                    let formattedPrice = '';
                    if (product.prc) {
                        const prices = product.prc.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
                        if (prices.length > 0) {
                            const lowest = (prices[0] / 1.6) * 1.3;
                            formattedPrice = lowest.toFixed(2).replace('.', ',');
                        }
                    }

                    const cardRedirectUrl = `./produits/details?eid=${product.prodEId}`;

                    const card = document.createElement('div');
                    card.className = `product-card`;
                    card.onclick = () => window.location.href = cardRedirectUrl;

                    card.innerHTML = `
                        <div class="thumbnail-wrapper" data-sku="${baseSku}" data-real-sku="${baseSku}" data-prefix="thumbnail"> 
                            <span class="product-tag-usine">Directement de l'usine</span>
                            <div class="thumbnail-skeleton"></div> 
                            <img id="img-${baseSku}" 
                                class="product-image"
                                src="${initialImageSrc}" 
                                alt="Image du produit ${escapeHTML(productName)}"
                                data-current-thumb="1"
                                loading="lazy" 
                                onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';" 
                                onerror="this.src='./static-resources/default/products/introuvable.webp'; this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                            
                            <div class='thumb-nav-container' style="display:none;">
                                <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${baseSku}', -1); event.stopPropagation();">&lt;</button>
                                <button class="thumb-nav thumb-next disabled" onclick="switchThumbnailOnDemand('${baseSku}', 1); event.stopPropagation();">&gt;</button>
                            </div>
                        </div>
                        <div class="product-info-wrapper"></div>
                        <div class="color-thumbnails-wrapper"></div>
                    `;

                    productContainer.appendChild(card);

                    setTimeout(() => {
                        const infoWrapper = card.querySelector('.product-info-wrapper');
                        if (infoWrapper) {
                            infoWrapper.innerHTML = `
                                <div class="product-info">
                                    <h3>${escapeHTML(productName)}</h3>
                                    <p>${baseSku}</p>
                                    <p style="display:none;">À partir de : ${formattedPrice} $</p>
                                </div>
                            `;
                        }
                    }, 50);
                });
            }

            // Vérification finale si aucun produit n'a été trouvé
            if (totalLoadedProducts === 0) {
                showNoProductsMessage(productContainer);
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des produits:', error);
            if (totalLoadedProducts === 0) {
                showNoProductsMessage(productContainer);
            }
        });
});

function filterList(input, containerId) {
    const filter = input.value.toLowerCase();
    const container = document.getElementById(containerId);
    const items = container.getElementsByClassName('checkboxFilterContainer');

    for (let i = 0; i < items.length; i++) {
        const label = items[i].getElementsByTagName('label')[0];
        const textValue = label.textContent || label.innerText;

        if (textValue.toLowerCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

function generatePagination(totalProducts, activePage) {
    updatePaginationDisplay(activePage, totalProducts);
}

function updatePaginationDisplay(activePage, totalProducts) {
    const productsPerPage = 20;
    const pageCount = Math.ceil(totalProducts / productsPerPage);
    const pagesSection = document.getElementById('pages-section');
    if (!pagesSection) return;

    pagesSection.innerHTML = '';

    const prevPage = activePage - 2;
    pagesSection.innerHTML += prevPage >= 1
        ? `<a class="page-nav" href="?page=${prevPage}">&lt;</a>`
        : `<a class="page-nav disabled" style="display:none;">&lt;</a>`;

    if (activePage - 1 >= 1) {
        pagesSection.innerHTML += `<a href='?page=${activePage - 1}'>${activePage - 1}</a>`;
    }

    pagesSection.innerHTML += `<a class='active' href='?page=${activePage}'>${activePage}</a>`;

    if (activePage + 1 <= pageCount) {
        pagesSection.innerHTML += `<a href='?page=${activePage + 1}'>${activePage + 1}</a>`;
    }

    const nextPage = activePage + 2;
    pagesSection.innerHTML += nextPage <= pageCount
        ? `<a class="page-nav" href="?page=${nextPage}">&gt;</a>`
        : `<a class="page-nav disabled" style="display:none;">&gt;</a>`;

    if (pageCount <= 1) {
        pagesSection.querySelectorAll('.page-nav').forEach(el => el.style.display = 'none');
    }
}

function switchThumbnailOnDemand(uniqueCardId, direction) {
    const imgElement = document.getElementById(`img-${uniqueCardId}`);
    if (!imgElement) return;

    const thumbnailWrapper = imgElement.closest('.thumbnail-wrapper');
    const realSku = thumbnailWrapper.getAttribute('data-real-sku') || uniqueCardId;
    const prefix = thumbnailWrapper.getAttribute('data-prefix') || 'thumbnail';

    let currentThumb = parseInt(imgElement.getAttribute('data-current-thumb')) || 1;
    const nextThumb = currentThumb + direction;

    if (nextThumb < 1) return;

    const rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];
    const foundImageName = getProductImageUrl(rawImgNames, prefix, nextThumb);

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
        updateThumbnailNavVisibility(uniqueCardId); 
    };
    
    tempImg.onerror = function() {
        imgElement.src = './static-resources/default/products/introuvable.webp';
        imgElement.classList.add('loaded');
        if (skeletonElement) skeletonElement.style.display = 'none';
    };
    
    tempImg.src = nextSrc;
}

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

    let rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];
    if (typeof rawImgNames === 'string') {
        try { rawImgNames = JSON.parse(rawImgNames); } catch (e) { rawImgNames = []; }
    }

    const matchingImages = rawImgNames.filter(fileName => {
        const parsed = parseImageFilename(fileName);
        return parsed.prefix.toLowerCase() === prefix.toLowerCase();
    });

    let count = matchingImages.length;
    if (count === 0 && prefix.toLowerCase() !== 'thumbnail') {
        count = rawImgNames.filter(fileName => {
            const parsed = parseImageFilename(fileName);
            return parsed.prefix.toLowerCase() === 'thumbnail';
        }).length;
    }

    if (count <= 1) {
        if (navContainer) navContainer.style.display = 'none';
        return;
    }

    if (navContainer) navContainer.style.display = 'flex';

    if (prevBtn) {
        if (currentThumb <= 1) {
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.classList.remove('disabled');
        }
    }

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

function addNewCategoryBadge(value, type) {
    let ownedCategory = document.querySelector('#ownedCategory');
    if (!ownedCategory) return;

    const badgeDiv = document.createElement('div');
    badgeDiv.setAttribute('data-filter-value', value);
    badgeDiv.classList.add('badge-filter');

    let imageHtml = '';
    if (type === 'colors') {
        imageHtml = `<img title="${value}" class="color-thumbnail-image"
            src="./static-resources/products/colors/${value}.webp" 
            alt="Couleur ${value}" loading="lazy">`;
    }

    badgeDiv.innerHTML = `${imageHtml}<span>${value}</span><button type="button" class="deleteBtn">x</button>`;

    badgeDiv.querySelector('.deleteBtn').onclick = () => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-type="${type}"][data-name="${value}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        badgeDiv.remove();
        searchProduct();
    };

    ownedCategory.appendChild(badgeDiv);
}

function searchProduct() {
    let searchBar = document.querySelector('#searchBar');
    let searchBarValue = searchBar ? searchBar.value.trim() : "";
    
    let checkedColors = [];
    let checkedCategories = [];

    document.querySelectorAll('input[type="checkbox"][data-type="colors"]:checked').forEach(color => {
        checkedColors.push(color.dataset.name);
    });

    document.querySelectorAll('input[type="checkbox"][data-type="categories"]:checked').forEach(categorie => {
        checkedCategories.push(categorie.dataset.name);
    });

    const params = new URLSearchParams();
    if (searchBarValue) params.set('query', searchBarValue);
    if (checkedCategories.length > 0) params.set('categories', checkedCategories.join(','));
    if (checkedColors.length > 0) params.set('colors', checkedColors.join(','));

    window.location.href = './produits?' + params.toString();
}

function syncUIWithServerResponse(response) {
    if (!response || !response.success) return;

    if (response.appliedCategories && Array.isArray(response.appliedCategories)) {
        response.appliedCategories.forEach(catName => {
            let el = document.querySelector(`input[type="checkbox"][data-type="categories"][data-name="${catName}"]`);
            if (el) el.checked = true;
        });
    }

    if (response.appliedColors && Array.isArray(response.appliedColors)) {
        response.appliedColors.forEach(colorName => {
            let el = document.querySelector(`input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`);
            if (el) el.checked = true;
        });
    }
}

function autoSelectAppliedFilters(appliedCategories = [], appliedColors = []) {
    appliedCategories.forEach(catName => {
        let checkbox = document.querySelector(`input[type="checkbox"][data-type="categories"][data-name="${catName}"]`);
        if (checkbox) checkbox.checked = true;
    });

    appliedColors.forEach(colorName => {
        let checkbox = document.querySelector(`input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`);
        if (checkbox) checkbox.checked = true;
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

// --- INF SCROLL DYNAMIQUE MIS À JOUR PAR NOMBRE DE PRODUITS DEFILEMENT ---
function initInfiniteScroll(currentPage, totalProducts) {
  const productsPerPage = 20;
  const pageCount = Math.ceil(totalProducts / productsPerPage);

  const productContainer = document.getElementById('products-container');
  const pagesSection = document.getElementById('pages-section');
  if (!pagesSection || !productContainer) return;

  let loadingNext = false;
  let nextPage = currentPage + 1;

  // Observer basé sur la position exacte des cartes (calcul dynamique selon 20 cartes par page)
  const urlObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const allCards = Array.from(productContainer.children);
        const index = allCards.indexOf(entry.target);
        if (index !== -1) {
          // Calcul dynamique de la page selon l'index du produit défilé
          const calculatedPage = Math.floor(index / productsPerPage) + 1;
          const params = new URLSearchParams(window.location.search);
          
          if (params.get('page') != calculatedPage) {
            params.set('page', calculatedPage);
            window.history.replaceState(null, '', '?' + params.toString());
            updatePaginationDisplay(calculatedPage, totalProducts);
          }
        }
      }
    });
  }, { threshold: 0.5 });

  // Observer toutes les cartes actuellement dans le conteneur
  productContainer.querySelectorAll('.product-card').forEach(card => {
    urlObserver.observe(card);
  });

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

          data.products.forEach((product) => {
            const baseSku = product.sku;
            window.lastLoadedProductsImgNames[baseSku] = product.imgNames;

            let view = (product.dtf || product.broderie || product.uvdtf) ? 'studio' : 'details';
            product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
            const formattedPrice = parseFloat(product.lowestPrice).toFixed(2).replace('.', ',');
            let activeHtml = product.active == 0 ? 'notActive' : '';
            const supplierName = (product.supplier && product.supplier.name) ? product.supplier.name : '';

            let matchingColors = [];
            if (colors && colors.length > 0 && product.availableColors) {
              matchingColors = product.availableColors.filter(color => colors.includes(color));
            }
            let colorsToRender = matchingColors.length > 0 ? matchingColors : [null];

            colorsToRender.forEach((currentColor) => {
              const uniqueCardId = currentColor ? `${baseSku}-${currentColor.replace(/\s+/g, '_')}` : baseSku;
              const targetPrefix = currentColor ? currentColor.trim() : 'thumbnail';
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
                  <span class="product-tag-usine">Directement de l'usine</span>
                  <div class="thumbnail-skeleton"></div>
                  <img id="img-${uniqueCardId}"
                    class="product-image"
                    src="${initialImageSrc}"
                    alt="Image du produit ${product.name} ${currentColor ? '- ' + currentColor : ''}"
                    data-current-thumb="1"
                    loading="lazy"
                    onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.removeAttribute('onerror'); this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                  <div class='thumb-nav-container'>
                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                    <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                  </div>
                </div>
                <div class="product-info-wrapper"></div>
                <div class="color-thumbnails-wrapper"></div>
              `;

              productContainer.appendChild(card);
              urlObserver.observe(card); // Observer les nouvelles cartes pour la pagination

              setTimeout(() => {
                const infoWrapper = card.querySelector('.product-info-wrapper');
                if (infoWrapper) {
                  infoWrapper.innerHTML = `
                    <div class="product-info">
                      <h3>${product.name}</h3>
                      <p>${baseSku}</p>
                      <p style="display:none;">À partir de : ${formattedPrice} $</p>
                    </div>
                  `;
                }
              }, 50);

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
                const colorWrapper = card.querySelector('.color-thumbnails-wrapper');
                if (colorWrapper) colorWrapper.innerHTML = colorThumbnailBloc;
              }, 150);

              updateThumbnailNavVisibility(uniqueCardId);
            });
          });

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

function showNoProductsMessage(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="no-products-found" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
            <p>Aucun produit trouvé</p>
            <a href="./produits" class="btn-primary" style="display: inline-block; margin-top: 15px;  margin-top:10px; padding: 8px 16px; background-color: var(--accent-color); color: white; text-decoration: none; border-radius: 6px;">Réinitialiser la recherche</a>
        </div>
    `;
}