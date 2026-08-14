let product = {};

document.addEventListener('DOMContentLoaded', function() {
    let productContainer = document.getElementById('product-details-container');

    showDetailsSkeleton(productContainer);
    
    const URL = window.location.search;
    const searchParams = new URLSearchParams(URL);
    const pid = parseInt(searchParams.get("pid")) ?? null;
    const sku = searchParams.get("sku") ?? null

    const selectedColorFromURL = searchParams.get("selectedColor");

    fetch('./../api/GET/product-details?pid=' + pid + '&sku=' + sku)
        .then(response => response.json())
        .then(data => {

            if (data && data.success) {
                if (data.productDetails) {

                product = data.productDetails; 

                window.location.href=`./studio?pid=${product.id}&selectedColor=${selectedColorFromURL}`;
                        return;
                    /*
                    if (product.customPersonalization || product.dtf || product.broderie || product.tampographie || product.vividPrint || product.screenPrint || product.engraving || product.patch || product.uvdtf) {
                        window.location.href=`./studio?pid=${product.id}&selectedColor=${selectedColorFromURL}`;
                        return;
                    }*/
        
                
                    window.dispatchEvent(new CustomEvent('productLoaded', { 
                        detail: data
                    }));                    
                    
                    displayProductDetails(product, productContainer);

                    if (selectedColorFromURL && product.colors.includes(selectedColorFromURL)) {
                        const colorSelect = document.getElementById('color-select');
                        colorSelect.value = selectedColorFromURL;
                        
                        updateProductSize(selectedColorFromURL); 
                        // AJOUT ICI :
                        updateActiveThumbnail(selectedColorFromURL);
                    } else {
                        // Charger en mode "couleur vide" (mode miniatures séquence)
                        if(product.blank == 0){
                            updateProductSize("Blanc");
                        }else{
                        updateProductImage(""); 

                        }
                    }
            }
            
                } else {
                    window.location.href='404';
                }
        })
        .catch(error => console.error('Error fetching products:', error));
});

// ----------------------------------------------------------------------
// LOGIQUE CARROUSEL MISE À JOUR (Utilisation de la classe 'disabled')
// ----------------------------------------------------------------------

function decodeBase64UTF8(base64String) {
    if (!base64String) return ""; // Sécurité si la valeur est nulle
    try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        //console.error("Erreur de décodage Base64 :", e);
        return base64String; // Retourne la chaîne brute en cas d'erreur
    }
}

/**
 * Fait glisser l'image du produit et met à jour les flèches.
 * @param {number} direction -1 pour précédent, 1 pour suivant.
 */
function slideProductImage(direction) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    if (!slideshowContainer) return;

    const colorSelect = document.getElementById('color-select');
    const selectedColor = colorSelect.value;
    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));

    if (allImages.length <= 1) {
        updateArrowVisibility(selectedColor); 
        return; 
    } 

    const currentImageIndex = allImages.findIndex(img => img.style.display !== 'none');
    
    let startIndex = (currentImageIndex === -1) ? 0 : currentImageIndex; 
    let newIndex = startIndex + direction;

    const maxIndex = allImages.length - 1;

    // Limiter l'index à l'intérieur de [0, maxIndex] (mode séquence)
    if (newIndex > maxIndex) {
        newIndex = maxIndex;
    } else if (newIndex < 0) {
        newIndex = 0;
    }

    // Si on est à une extrémité et qu'on tente d'aller plus loin, on arrête.
    if (newIndex === startIndex) {
        updateArrowVisibility(selectedColor);
        return;
    }

    // Afficher la nouvelle image et masquer l'ancienne
    if (startIndex !== -1) {
        allImages[startIndex].style.display = 'none';
    }
    allImages[newIndex].style.display = 'block';

    const newImageSrc = allImages[newIndex].src;
    
    // * LOGIQUE DE SÉLECTION DE COULEUR PAR L'IMAGE (Conservée) *
    if (newImageSrc.includes('thumbnail')) { 
        if (selectedColor !== "") {
            colorSelect.value = "";
        }
    } else if (newImageSrc.includes('-1.webp')) {
        if (selectedColor === "" || !newImageSrc.includes(selectedColor)) {
            
            const parts = newImageSrc.split('/');
            const filename = parts[parts.length - 1]; 
            const color = filename.split('-')[0]; 

            if (product.colors.includes(color)) {
                colorSelect.value = color;
                colorSelect.dispatchEvent(new Event('change'));
            }
        }
    }
    
    updateArrowVisibility(selectedColor);
}

/**
 * Met à jour le conteneur d'images en fonction de la couleur sélectionnée.
 * Les images non trouvées seront retirées du DOM par le onerror.
 * @param {string} selectedColor La couleur sélectionnée, ou "" pour les miniatures.
 */
function updateProductImage(selectedColor) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    if (!slideshowContainer) return; 

    slideshowContainer.innerHTML = '';
    
    const isValidColor = selectedColor && product.colors.includes(selectedColor);
    
    if (isValidColor) {
        // CAS 1: COULEUR SÉLECTIONNÉE
        for (let i = 1; i <= 5; i++) {
            const currentImageUrl = `../static-resources/products/${product.sku}/${selectedColor}-${i}.webp`;
            
            const imageElement = document.createElement('img');
            imageElement.src = currentImageUrl;
            imageElement.alt = `Image du produit, couleur ${selectedColor} vue ${i}`;
            imageElement.style.display = (i === 1) ? 'block' : 'none'; 
            
            imageElement.onerror = function() {
                // Si l'image n'existe pas, on la retire du DOM
                this.remove(); 
                updateArrowVisibility(selectedColor); 
            };
            
            slideshowContainer.appendChild(imageElement);
        }

    } else {
        // CAS 2: AUCUNE COULEUR SÉLECTIONNÉE (Miniatures de 1 à 5)
        for (let i = 1; i <= 5; i++) {
            const thumbnailFileName = `thumbnail-${i}`;
            const thumbnailImageUrl = `../static-resources/products/${product.sku}/${thumbnailFileName}.webp`;
            
            const imageElement = document.createElement('img');
            imageElement.src = thumbnailImageUrl;
            imageElement.alt = `Miniature du produit vue ${i}`;
            imageElement.style.display = (i === 1) ? 'block' : 'none'; 
            
            imageElement.onerror = function() {
                // Si l'image n'existe pas, on la retire du DOM
                this.remove(); 
                updateArrowVisibility(""); 
            };
            
            slideshowContainer.appendChild(imageElement);
        }
    }
    
    // Mettre à jour l'état des flèches après le chargement des images initiales
    updateArrowVisibility(selectedColor);
    window.scrollTo(top);
}

/**
 * Met à jour l'état (classe 'disabled') des flèches de navigation.
 * Se base sur le nombre d'images RÉELES dans le DOM (après `onerror`).
 * @param {string} selectedColor La couleur actuellement sélectionnée.
 */
function updateArrowVisibility(selectedColor) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!prevBtn || !nextBtn || !slideshowContainer) return;

    // Récupérer uniquement les images qui ont réussi à charger (sont dans le DOM)
    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    
    // Si moins de 2 images existent, désactiver les deux flèches.
    if (allImages.length <= 1) {
        prevBtn.classList.add('disabled');
        nextBtn.classList.add('disabled');
        return;
    }

    // Retirer la classe 'disabled' pour commencer les vérifications
    prevBtn.classList.remove('disabled');
    nextBtn.classList.remove('disabled');

    // Trouver l'index de l'image actuellement visible
    const currentImageIndex = allImages.findIndex(img => img.style.display !== 'none');

    // Assurer que la flèche Précédent est désactivée sur la première image (Index 0)
    if (currentImageIndex <= 0) {
        prevBtn.classList.add('disabled');
    }

    // Assurer que la flèche Suivant est désactivée sur la dernière image
    if (currentImageIndex >= allImages.length - 1) {
        nextBtn.classList.add('disabled');
    }
}


// ----------------------------------------------------------------------
// LOGIQUE AFFICHAGE PRODUIT (Non modifiée)
// ----------------------------------------------------------------------

function displayProductDetails(product, container) {
    document.title = product.name;

    let activeHtml = product.active == 0 ? 'notActive' : '';

    // 1. STRUCTURE ET IMAGES PRIORITAIRES (Priorité 1)
    container.innerHTML = `
        <div class="product-card ${activeHtml}" data-pid="${product.id}" data-pname="${product.name}" data-psku="${product.sku}">
            <div class="slideshowWrapper">
                <div class="slideshowContainer"></div>
                <div class='button-slideshow-container'>
                    <button id="prevBtn" onclick="slideProductImage(-1)">&lt;</button>
                    <button id="nextBtn" onclick="slideProductImage(1)">&gt;</button>
                </div>
            </div>
            <div class="productInfo">
                <div id="text-info-block" style="opacity: 0; transition: opacity 0.3s;">
                    </div>
                
                <div id="colorThumbnailsContainer" style="opacity: 0; transition: opacity 0.3s;">
                    </div>

                <div id="dynamic-controls-block" style="opacity: 0;">
                    <select id="color-select" class="product-colors">
                        <option value="">Choisir une couleur</option>
                        ${product.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                    </select>
                    <select id='personalization-select' style='display:none;'>
                        <option value=''>Choisir une option de personnalisation</option>
                        <option value='Aucune personnalisation' data-price='0'>Aucune personnalisation</option>
                    </select>
                    <div class="product-sizes" style='display:none;'></div>
                    <div id="studio-actions-container" style='display:none;'>
                        <div id="studio-personalization-options-container">
                        <div class="personalization-option" data-name="Blank" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">SANS LOGO <span class="additionnalInfo" onclick="openAdditionnalInfo(\`Vous pouvez à tout moment commander nos produits sans logo.\`)">?</span></div>
                        </div>
                        <div id="personalization-details">
                        </div>
                    </div>
                    <span id="smallProductSizeNote" style="display:none;">* Les prix affichés sont basés sur les quantités déjà dans votre panier...</span>
                    <div id="add-to-cart-error-container"></div> 
                    <div id="add-to-cart-container"></div>
                    <div id="technicalInfo">
                        <a href="./../static-resources/products/${product.sku}/Fiche technique.pdf">Fiche technique et grandeurs</a>
                        <p class="light">En cas de rupture de stock, nous vous contacterons par téléphone ou par courriel et votre commande sera temporairement mise en attente.</p>
                        <p class="light">Pour vérifier l'inventaire ou pour toutes questions : 438-317-0376</p>
                        <p class='light'>SKU : ${product.sku}</p>
                    </div> 
                </div>
            </div>
        </div>
    `;

    // Attachement immédiat des listeners sur les éléments injectés
    const colorSelect = document.getElementById('color-select');
    colorSelect.addEventListener('change', (e) => updateProductSize(e.target.value));

    const personalizationSelect = document.getElementById('personalization-select');
    personalizationSelect.addEventListener('change', () => updatePersonalizationPrice());

    // 2. TEXTE ET DESCRIPTION (Priorité 2 - 50ms)
    setTimeout(() => {
        const textBlock = document.getElementById('text-info-block');
        textBlock.innerHTML = `
            <h1 class="title">${product.name} - ${product.sku}</h1>
            <p>${decodeBase64UTF8(product.description)}</p>
        `;
        textBlock.style.opacity = '1';
        document.getElementById('dynamic-controls-block').style.opacity = '1';
    }, 50);

    // 3. VIGNETTES DE COULEURS (Priorité 3 - 150ms)
    setTimeout(() => {
        const colorContainer = document.getElementById('colorThumbnailsContainer');
        let colorThumbnailBloc = '';
        
        if (product.colors && product.colors.length > 0) {
            product.colors.forEach(color => {
                colorThumbnailBloc += `
                    <img title='${color}'
                        class="color-thumbnail-image"
                        src="../static-resources/products/colors/${color}.webp" 
                        alt="Couleur ${color}"
                        loading="lazy" 
                        onclick="document.getElementById('color-select').value='${color}'; updateProductSize('${color}');"
                    >`;
            });
        }
        
        colorContainer.innerHTML = colorThumbnailBloc;
        colorContainer.style.opacity = '1';

        // Vérification si une couleur est déjà active (ex: via URL)
        const currentSelected = document.getElementById('color-select').value;
        if(currentSelected) updateActiveThumbnail(currentSelected);
    }, 150);

    // Initialisation du carrousel d'images (Déjà géré par updateProductImage dans DOMContentLoaded)
    updateArrowVisibility(colorSelect.value);
}

// Définition de l'ordre des tailles pour le tri
const sizeOrder = [
    "XXS", "XS", "S", "M", "L", "XL", 
    "2XL", "3XL", "4XL", "5XL", 
    "2.5 X 2.25\"" , "3 X 2.69\"" , "3.5 X 3.14\"", "4 X 3.59\""
];




function updatePersonalizationPrice() {


    const personalizationSelect = document.getElementById('personalization-select');
    const selectedOption = personalizationSelect.options[personalizationSelect.selectedIndex];
    
    // Récupération du prix de personnalisation (0 si rien n'est choisi)
    const extraPrice = parseFloat(selectedOption.dataset.price) || 0;
    const personalizationValue = selectedOption.value;

    // Cibler toutes les lignes de variantes
    const variantRows = document.querySelectorAll('.variantDiv');

    variantRows.forEach(row => {
        // Optionnel : stocker le choix pour le panier plus tard
        row.dataset.personalizationPrice = extraPrice;
        row.dataset.personalizationValue = personalizationValue;

        // Récupérer les prix de base des paliers stockés dans le dataset
        const basePrices = [
            parseFloat(row.dataset.price1),
            parseFloat(row.dataset.price4),
            parseFloat(row.dataset.price26),
            parseFloat(row.dataset.price50)
        ];

        // Cibler les spans qui affichent les prix (ceux qui contiennent "$")
        const displaySpans = Array.from(row.querySelectorAll('span')).filter(s => s.textContent.includes('$'));

        // Mettre à jour chaque span avec (Prix Palier + Prix Extra)
        displaySpans.forEach((span, index) => {
            if (basePrices[index] !== undefined) {
                const newTotal = basePrices[index] + extraPrice;
                span.textContent = newTotal.toFixed(2) + ' $';
            }
        });
    });
}

function showDetailsSkeleton(container) {
    container.innerHTML = `
        <div class="skeleton-details">
            <div class="skeleton-image-side"></div>
            <div class="skeleton-info-side">
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text" style="width: 50%"></div>
                <div class="skeleton-text skeleton-price"></div>
                <div class="skeleton-text skeleton-button"></div>
            </div>
        </div>
    `;
}




/**
 * Met à jour la classe 'active' sur la miniature de couleur correspondante.
 * @param {string} selectedColor - La couleur provenant de l'URL ou de la sélection.
 */
function updateActiveThumbnail(selectedColor) {
    const thumbnails = document.querySelectorAll('#colorThumbnailsContainer .color-thumbnail-image');
    
    thumbnails.forEach(img => {
        // On retire la classe active de toutes les images
        img.classList.remove('active');
        
        // Si le titre de l'image (qui contient le nom de la couleur) correspond
        if (selectedColor && img.title === selectedColor) {
            img.classList.add('active');
        }
    });
}

/**
 * Met à jour les tailles et initialise la structure du tableau.
 */
/**
 * Met à jour les tailles et prépare la structure fixe du tableau.
 */
function updateProductSize(selectedColor) {
    const currentSupplierId = product.supplier.id;
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    
    let countInCartSameSupp = 0;
    let totalCartQtyGlobal = 0;

    cart.forEach(item => {
        const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
        totalCartQtyGlobal += itemQty;
        if (item.supplierId === currentSupplierId) {
            countInCartSameSupp += itemQty;
        }
    });

    let personalizationSelect = document.getElementById('personalization-select');
    let productSizesContainer = document.querySelector('.product-sizes');
    let addToCartContainer = document.getElementById('add-to-cart-container');


    // Gestion URL et Images
    const url = new URL(window.location.href);
    if (selectedColor !== "") {
        url.searchParams.set('selectedColor', selectedColor);
        updateProductImage(selectedColor); 
        updateActiveThumbnail(selectedColor);
        
        let personalizationData = [];
        try { personalizationData = product.personalization ? JSON.parse(product.personalization) : []; } catch (e) {}

        if (personalizationSelect) {
            if (personalizationData.length > 0) {
                personalizationSelect.innerHTML = `<option value='' data-price='0'>Choisir une option de personnalisation</option>`;
                personalizationData.forEach(choice => {
                    personalizationSelect.innerHTML += `<option value='${choice.option}' data-price='${choice.price}'>${choice.option} (+${choice.price}$)</option>`;
                });
                personalizationSelect.style.display = 'block';
            } else {
                personalizationSelect.style.display = 'none';
            }
        }
    } else {
        url.searchParams.delete('selectedColor');
        updateProductImage(""); 
        if (personalizationSelect) personalizationSelect.style.display = 'none';
    }
    history.replaceState(null, '', url.toString());

    if (!productSizesContainer) return;
    
    // On vide le conteneur une seule fois au chargement de la couleur
    productSizesContainer.innerHTML = '';
    
    if (selectedColor !== "" && product.blank == 1) {
        let sizes = product.variants[selectedColor];
        sizes.sort((a, b) => (sizeOrder.indexOf(a.size.toUpperCase()) === -1 ? 99 : sizeOrder.indexOf(a.size.toUpperCase())) - (sizeOrder.indexOf(b.size.toUpperCase()) === -1 ? 99 : sizeOrder.indexOf(b.size.toUpperCase())));

        // 1. Création de l'en-tête FIXE avec 5 emplacements de colonnes
        const headerDiv = document.createElement('div');
        headerDiv.id = 'firstColumnProductSize';
        headerDiv.innerHTML = `
            <input class='hide' readonly><span class='hide'>x</span>
            <span class="col-head" data-idx="0"></span>
            <span class="col-head" data-idx="1"></span>
            <span class="col-head" data-idx="2"></span>
            <span class="col-head" data-idx="3"></span>
            <span class="col-head" data-idx="4"></span>
        `;
        productSizesContainer.appendChild(headerDiv);

        // 2. Création des lignes de variantes FIXES
        sizes.forEach(size => {
            const sizeDiv = document.createElement('div');
            sizeDiv.classList.add('variantDiv');
            sizeDiv.dataset.rawPrice = size.price;
            sizeDiv.dataset.sizeName = size.size;

            sizeDiv.innerHTML = `
                <input type="number" min="0" value="" inputmode="tel" placeholder='0'>
                <span class='sizeName'>${size.size}</span>
                <span class="col-price" data-idx="0"></span>
                <span class="col-price" data-idx="1"></span>
                <span class="col-price" data-idx="2"></span>
                <span class="col-price" data-idx="3"></span>
                <span class="col-price" data-idx="4"></span>
            `;

            // L'event listener ne sera jamais supprimé, donc le focus restera
            sizeDiv.querySelector('input').addEventListener('input', updateLivePriceDisplay);
            productSizesContainer.appendChild(sizeDiv);
        });

        // Premier rendu des textes
        updateLivePriceDisplay();
        
        if (addToCartContainer) {
            addToCartContainer.style.display = 'flex';
            addToCartContainer.innerHTML = `<button id="addToCartBtn" onclick="addProductToCart()">Ajouter à ma demande</button>`;
        }
        productSizesContainer.style.display = 'flex';


    }else if(selectedColor !== "" && product.blank == 0){
        let colorSelect = document.querySelector('#color-select');
                colorSelect.style.display = "none";

        let colorThumbnailsContainer = document.querySelector('#colorThumbnailsContainer');
        colorThumbnailsContainer.style.display = "none";
        let studioActionsContainer = document.querySelector('#studio-actions-container');
        studioActionsContainer.style.display = "flex";
        let personalizationOptionsContainer = document.querySelector('#studio-personalization-options-container');
        
        personalizationOptionsContainer.innerHTML = ''; // On vide au cas où
                personalizationOptionsContainer.style.display = "flex";
                personalizationOptionsContainer.innerHTML += `
                    <div class="personalization-option active" data-name="" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Solution personnalisée</div>
                `;
        let personalizationDetails = document.querySelector('#personalization-details');
            personalizationDetails.innerHTML = decodeBase64UTF8(product.blankDetails) || "<p>Nous pouvons réaliser ce produit !</p><p>Par contre, vous devrez faire une demande de soumission via le bouton plus bas en nous mentionnant le ou les produits souhaités, leur quantité et joindre votre logo. Un membre de notre équipe communiquera alors avec vous rapidement pour vous fournir une estimation.</p><button onclick=\"window.location.href='https://cameleonconception.com/soumission'\">Demander une soumission</button>";        
        }
}

/**
 * Gère l'affichage dynamique des textes dans les colonnes SANS recréer le HTML.
 */
/**
 * Met à jour l'affichage des prix en direct.
 * Surligne la colonne correspondant à la quantité totale (Panier + Saisie) pour ce SKU.
 */
function updateLivePriceDisplay() {
    const currentSupplierId = product.supplier.id;
    const currentSku = product.sku; // On récupère le SKU du produit actuel
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    const shippingFee = parseFloat(product.supplier.shippingCost) || 0;
    
    // 1. Analyse du panier pour le fournisseur ET pour le SKU spécifique
    let countInCartSameSupp = 0;
    let countInCartSameSku = 0; // Quantité déjà au panier pour CE produit précis
    let totalCartQtyGlobal = 0;

    cart.forEach(item => {
        const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
        totalCartQtyGlobal += itemQty;

        // Quantité totale du fournisseur (pour les frais de port)
        if (item.supplierId === currentSupplierId) {
            countInCartSameSupp += itemQty;
        }

        // Quantité spécifique au SKU (pour le surlignage de la ligne)
        if (item.sku === currentSku) {
            countInCartSameSku += itemQty;
        }
    });

    // 2. Calcul de la quantité saisie dans les inputs
    let liveInputQty = 0;
    const variantRows = document.querySelectorAll('.variantDiv');
    variantRows.forEach(row => {
        liveInputQty += parseInt(row.querySelector('input').value) || 0;
    });

    // Quantité totale pour le calcul de prix (Panier Supp + Saisie)
    // Mais pour le surlignage, on utilise (Panier SKU + Saisie)
    const addedQty = (liveInputQty > 0) ? liveInputQty : 1;
    
    // C'est ce chiffre qui détermine quelle colonne est "Active" pour l'utilisateur
    const totalQtyForHighlight = countInCartSameSku + (liveInputQty > 0 ? liveInputQty : 0);
    // Si l'utilisateur n'a rien saisi et rien au panier, on surligne par défaut le palier 1
    const finalHighlightQty = totalQtyForHighlight > 0 ? totalQtyForHighlight : 1;

    // 3. Calcul des colonnes (1, 4, 26, 50 + Notre quantité totale)
    let tiers = [1, 4, 26, 50];
    if (!tiers.includes(finalHighlightQty)) tiers.push(finalHighlightQty);
    tiers.sort((a, b) => a - b);

    // 4. Mise à jour de l'en-tête
    const headerSpans = document.querySelectorAll('.col-head');
    headerSpans.forEach((span, idx) => {
        const qty = tiers[idx];
        if (qty !== undefined) {
            span.textContent = qty;
            span.style.display = "inline-block";
            // Surlignage si c'est notre quantité totale SKU
            span.classList.toggle('showedPrice', qty === finalHighlightQty);
        } else {
            span.style.display = "none";
        }
    });

    // 5. Mise à jour des prix dans chaque ligne
    variantRows.forEach(row => {
        const rawPrice = parseFloat(row.dataset.rawPrice);
        const priceSpans = row.querySelectorAll('.col-price');

        priceSpans.forEach((span, idx) => {
            const qtyCol = tiers[idx];
            if (qtyCol !== undefined) {
                // Le calcul de prix reste basé sur le volume fournisseur total (pour les escomptes)
                const simulatedAddedQty = qtyCol - countInCartSameSku; 
                
                const price = calculateFinalPrice(
                    rawPrice, 
                    simulatedAddedQty, 
                    countInCartSameSupp, 
                    (totalCartQtyGlobal - countInCartSameSupp), 
                    shippingFee
                );
                
                span.textContent = price.toFixed(2) + " $";
                span.style.display = "inline-block";
                // Surlignage de la cellule de prix
                span.classList.toggle('showedPrice', qtyCol === finalHighlightQty);
            } else {
                span.style.display = "none";
            }
        });
    });
}

/**
 * Formule : ((Prix_Initial / 1.6) + Part_Livraison) * Multiplicateur_Marge
 */
function calculateFinalPrice(rawPrice, addedQtySimulated, cartSuppQty, cartGlobalOtherSuppliersQty, shippingFee) {
    const initialCost = rawPrice / 1.6;
    
    // 1. Calcul de la quantité totale simulée pour ce fournisseur
    const totalSuppQtySimulated = cartSuppQty + addedQtySimulated;
    
    // 2. Vérification de la livraison gratuite
    const thresholdRaw = product.supplier.freeShippingAt;
    const freeShippingThreshold = parseFloat(thresholdRaw);
    
    // Estimation du montant pour comparer au seuil
    const estimatedTotalAmount = totalSuppQtySimulated * rawPrice;
    
    let shippingShare = 0;

    // LOGIQUE : 
    // Si le seuil est NULL, on applique TOUJOURS les frais de port.
    // Sinon, on vérifie si le montant estimé est inférieur au seuil.
    if (thresholdRaw === null || thresholdRaw === "" || estimatedTotalAmount < freeShippingThreshold) {
        shippingShare = shippingFee / (totalSuppQtySimulated > 0 ? totalSuppQtySimulated : 1);
    } else {
        // Livraison gratuite atteinte (seuil existe et montant suffisant)
        shippingShare = 0;
    }
    
    const subTotal = initialCost + shippingShare;
    
    // 3. Calcul du multiplicateur de marge basé sur la quantité globale
    const totalGlobal = cartGlobalOtherSuppliersQty + totalSuppQtySimulated;
    
    let multiplier = 1.6;
    if (totalGlobal >= 50) {
        multiplier = 1.3;
    } else if (totalGlobal >= 26) {
        multiplier = 1.4;
    }

    return subTotal * multiplier;
}


