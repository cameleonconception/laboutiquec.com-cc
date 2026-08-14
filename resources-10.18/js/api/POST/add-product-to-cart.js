// Fonction utilitaire pour afficher l'erreur
function displayProductError(message) {
    const errorContainer = document.getElementById('add-to-cart-error-container');

    if (errorContainer) {
        // Ajout de l'erreur
        errorContainer.style.display = 'block';
        errorContainer.innerHTML += `
            <div class="product-error-message">
                <p class="error-text">${message}</p>
            </div>`;
            
        // NOUVEAU : Ajouter l'écouteur de clic global
        document.addEventListener('click', hideErrorOnClickOutside, true); 
    }
}

// Fonction utilitaire pour nettoyer l'erreur
function clearProductErrors() {
    const errorContainer = document.getElementById('add-to-cart-error-container');
    if (errorContainer) {
        errorContainer.innerHTML = '';
        errorContainer.style.display = 'none';
        
        // NOUVEAU : Retirer l'écouteur après avoir caché l'erreur
        document.removeEventListener('click', hideErrorOnClickOutside, true);
    }
}

function getCountCartElement() {
    // Ceci est une version simplifiée, vous pouvez la remplacer par votre logique réelle
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    let totalItems = cart.reduce((total, product) => {
        const productQty = product.sizes.reduce((sum, size) => sum + size.qte, 0);
        return total + productQty;
    }, 0);

    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

function handleCartAnimation(productCard) {
    let addToCartButton = document.querySelector("#addToCartBtn");
    addToCartButton.disabled = true;
    addToCartButton.classList.remove('loading');
    addToCartButton.classList.add('active');
    // On sauvegarde le texte original pour le remettre plus tard si besoin
    addToCartButton.textContent = '✓';


    setTimeout(() => {
        
    addToCartButton.disabled = false;
    // On sauvegarde le texte original pour le remettre plus tard si besoin
    addToCartButton.textContent = 'Ajouter à ma demande';
    addToCartButton.classList.remove('active');

    }, 500);
}

/**
 * Cache les messages d'erreur si l'utilisateur clique en dehors du conteneur d'erreurs.
 * @param {Event} event - L'objet événement du clic.
 */
function hideErrorOnClickOutside(event) {
    const errorContainer = document.getElementById('add-to-cart-error-container');
    
    // Si l'élément cliqué (event.target) n'est PAS DANS le conteneur d'erreurs
    if (errorContainer && !errorContainer.contains(event.target)) {
        // Et si l'élément cliqué n'est pas l'input de quantité (pour ne pas cacher l'erreur
        // si l'utilisateur essaie de corriger une quantité immédiatement)
        if (!event.target.closest('.product-sizes input[type="number"]')) {
            clearProductErrors();
        }
    }
}

// ------------------------------------------------------------------------------------------------

async function addProductToCart() {
    clearProductErrors(); 
    
    let addToCartButton = document.querySelector("#addToCartBtn");
    addToCartButton.disabled = true;
    addToCartButton.classList.add('loading');
        
    let productCard = document.querySelector(".product-card");
    let id = productCard.getAttribute("data-pid");
    let sku = productCard.getAttribute("data-psku");
    let name = productCard.getAttribute("data-pname");
    let color = productCard.querySelector(".product-colors").value;
    let sizeElements = productCard.querySelectorAll(".variantDiv");

    const supplierData = {
        id: product.supplier.id,
        name: product.supplier.name,
        shippingCost: product.supplier.shippingCost,
        freeShippingAt: product.supplier.freeShippingAt
    };
    
// --- 1. VALIDATION DES OPTIONS ---
    const activeOptionElement = document.querySelector('.personalization-option.active');
    const selectedStudioOption = activeOptionElement ? activeOptionElement.getAttribute('data-name') : null;

    // Récupération de tous les sélecteurs de personnalisation dans le conteneur du studio
    const personalizationSelects = document.querySelectorAll('#dynamic-controls-block select.product-personalization-option');

    let personalizationValue = "Aucune personnalisation";
    let personalizationPrice = 0;

    // Filtrer pour ne garder que les sélecteurs réellement affichés à l'écran
    const visibleSelects = Array.from(personalizationSelects).filter(select => select.style.display !== 'none');

    if (visibleSelects.length > 0) {
        const selectedValues = [];

        for (const select of visibleSelects) {
            // Validation : si l'utilisateur n'a rien choisi dans l'un des champs
            if (select.value === '') {
                displayProductError("Vous devez choisir une option pour chaque sélecteur de personnalisation.");
                return resetAddButton(addToCartButton);
            }

            // Récupérer l'élément <option> actuellement sélectionné
            const selectedOption = select.options[select.selectedIndex];
            
            // Priorité au dataset custom (data-pvalue) si défini, sinon la valeur/texte du select
            const optionText = selectedOption.getAttribute('data-pvalue') || selectedOption.text || select.value;
            selectedValues.push(optionText.trim());

            // Additionner le prix supplémentaire de chaque option s'il existe
            const optionPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            personalizationPrice += optionPrice;
        }

        // Assembler toutes les valeurs séparées par une virgule (ex: "Horizontale, Bleu")
        personalizationValue = selectedValues.join(', ');
    }

    // --- 1.1 VALIDATION DU PRODUIT VIERGE (NOUVEAU) ---
    // Si le produit ne peut pas être vendu sans logo (blank == 0)
    // ET que l'option sélectionnée n'est pas "Blank" (cas où l'option Blank serait cachée ou interdite)
    // OU simplement si l'utilisateur essaie de commander sans logo sur le canvas
    
    const logosOnCanvas = (typeof canvas !== 'undefined' && canvas) 
        ? canvas.getObjects().filter(obj => obj.imageOwner).length 
        : 0;

    if (parseInt(product.blank) === 0 || selectedStudioOption !== "Blank") {
        if (logosOnCanvas === 0 && selectedStudioOption !== "Blank") {
            displayProductError("Veuillez ajouter votre logo sur le produit");
            return resetAddButton(addToCartButton);
        }
    }
    
    // Si l'utilisateur a choisi "SANS LOGO" explicitement mais que le produit l'interdit
    if (selectedStudioOption === "Blank" && parseInt(product.blank) === 0) {
        displayProductError("Désolé, la vente sans logo n'est pas disponible pour cet article.");
        return resetAddButton(addToCartButton);
    }

    // --- 2. VALIDATION DES QUANTITÉS ---
    let newItemsToAdd = [];
    let availableSizes = [];
    let hasQuantities = false;

    sizeElements.forEach(sizeEl => {
        const rawPrice = 0;
        const sizeData = {
            size: sizeEl.dataset.sizeName,
            variantId: parseInt(sizeEl.dataset.sizeVariantId),
            stock: sizeEl.dataset.sizeStock,
            rawPrice: 0 
        };
        availableSizes.push(sizeData);

        let inputQte = parseInt(sizeEl.querySelector("input").value);
        if (inputQte > 0) {
            hasQuantities = true;
            newItemsToAdd.push({ ...sizeData, qte: inputQte });
        }
    });

    if (!hasQuantities) {
        displayProductError("Veuillez saisir une quantité.");
        filterLogosByImage(); // <-- Re-filtrer pour s'assurer d'être synchro avec l'image visible actuelle
        return resetAddButton(addToCartButton);
    }

    // --- 3. CAPTURE ET UPLOAD ---
    let designSignature = null;
    let studioDataSummary = null; 

    if (logosOnCanvas > 0) {
        designSignature = "studio_" + Date.now();
        const allLogos = canvas.getObjects().filter(obj => obj.imageOwner);
        const uniqueViews = [...new Set(allLogos.map(l => l.imageOwner))];
        
        try {
            const temporaryViews = await Promise.all(uniqueViews.map(async (viewSrc) => {
                const logosOnThisView = allLogos.filter(l => l.imageOwner === viewSrc);
                const previewImage = await getSingleViewPreview(viewSrc, logosOnThisView);

                return {
                    viewImage: viewSrc,
                    previewWithLogos: previewImage, 
                    logos: logosOnThisView.map(l => ({
                        width: (l.getScaledWidth() / currentDynamicPPI).toFixed(2),
                        height: (l.getScaledHeight() / currentDynamicPPI).toFixed(2),
                        src: l.getElement().src
                    }))
                };
            }));

            const uploadResult = await uploadDesignToServer(designSignature, temporaryViews);

            if (uploadResult.status === 'success') {
                const designPayload = {
                    signature: designSignature,
                    timestamp: new Date().toISOString(),
                    views: uploadResult.views 
                };
                localStorage.setItem(designSignature, JSON.stringify(designPayload));

                studioDataSummary = { 
                    logoCount: allLogos.length, 
                    designSignature: designSignature,
                    selectedPersonalizationOption: selectedStudioOption,
                    views: uploadResult.views.map(v => ({
                        previewUrl: v.previewUrl,
                        logos: v.logos.map(l => ({ width: l.width, height: l.height }))
                    }))
                };
            }
        } catch (error) {
            console.error("Erreur lors de l'upload :", error);
            displayProductError("Erreur lors de la sauvegarde du design. Veuillez réessayer.");
            return resetAddButton(addToCartButton);
        }
    }

    // --- 4. MISE À JOUR DU PANIER ---
    let cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    let existingGroup = cart.find(p => 
        p.sku === sku && 
        p.color === color && 
        p.personalizationValue === personalizationValue &&
        p.designSignature === designSignature
    );

    if (existingGroup) {
        newItemsToAdd.forEach(newItem => {
            let existingSize = existingGroup.sizes.find(s => s.size === newItem.size);
            if (existingSize) { existingSize.qte += newItem.qte; } 
            else { existingGroup.sizes.push(newItem); }
        });
        existingGroup.availableSizes = availableSizes;
        if (existingGroup.studioData) {
            existingGroup.studioData.selectedPersonalizationOption = selectedStudioOption;
            existingGroup.studioData.views = studioDataSummary ? studioDataSummary.views : null;
        }
    } else {
        cart.push({
            id: id, sku: sku, name: name, color: color,
            supplierId: supplierData.id,
            supplier: supplierData,
            personalizationValue: personalizationValue,
            personalizationPrice: 0,
            designSignature: designSignature,
            studioData: studioDataSummary,
            sizes: newItemsToAdd,
            availableSizes: availableSizes 
        });

        
    }

   // --- 5. FINALISATION ---
    localStorage.setItem("cart/cc", JSON.stringify(cart));
    
    // 1. Réinitialiser les champs de quantité
    productCard.querySelectorAll(".variantDiv input").forEach(input => input.value = "");

    // 2. VIDER LE CANVAS (Suppression des logos)
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.clear(); // Efface tous les objets Fabric
        
        // 3. VIDER LA LISTE VISUELLE DES LOGOS
        const listContainer = document.getElementById('logo-list-container');
        if (listContainer) {
            listContainer.innerHTML = '';
        }
        
        // 4. METTRE À JOUR LE COMPTEUR ET LES PRIX
        updateTotalLogoCounter();
        updateLivePriceDisplay();
    }

    // REMPLACER updateActiveThumbnailWithLogos() PAR :
    clearAllThumbnailLogos(); 

    getCountCartElement();
    handleCartAnimation(productCard);
}

function clearAllThumbnailLogos() {
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!verticalContainer) return;

    // Vider le conteneur overlay de chaque vignette
    const overlays = verticalContainer.querySelectorAll('.thumb-logo-overlay');
    overlays.forEach(overlay => {
        overlay.innerHTML = '';
    });
}

// Fonction utilitaire pour éviter la répétition du reset de bouton
function resetAddButton(btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
}
/**
 * Parcourt le panier et met à jour le .price de chaque taille 
 * basé sur la quantité totale du même SKU.
 */

async function uploadDesignToServer(signature, views) {
    const response = await fetch('../api/POST/addTemporaryDesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, views })
    });
    return await response.json();
}

// --- Nouvelle fonction utilitaire pour capturer le visuel complet ---
async function getDesignPreviews() {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    const previews = [];

    for (const img of allImages) {
        // On vérifie s'il y a des logos associés à CETTE image spécifique
        const logosOnThisView = canvas.getObjects().filter(obj => obj.imageOwner === img.src);

        if (logosOnThisView.length > 0) {
            const preview = await new Promise((resolve) => {
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;

                // 1. Dessiner le vêtement de cette vue
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 2. Créer une image temporaire des logos uniquement pour cette vue
                // On cache les logos qui n'appartiennent pas à cette image
                const originalStates = canvas.getObjects().map(obj => ({
                    obj: obj,
                    visible: obj.visible
                }));

                canvas.getObjects().forEach(obj => {
                    obj.visible = (obj.imageOwner === img.src);
                });

                const studioImage = new Image();
                studioImage.onload = function() {
                    ctx.drawImage(studioImage, 0, 0);
                    
                    // Restaurer la visibilité
                    originalStates.forEach(state => state.obj.visible = state.visible);
                    
                    resolve(tempCanvas.toDataURL('image/jpeg', 1));
                };
                // Capture du canvas avec seulement les logos filtrés
                studioImage.src = canvas.toDataURL({ format: 'png' });
            });
            previews.push(preview);
        }
    }
    return previews;
}

async function getSingleViewPreview(imgSrc, logosOnView) {
    return new Promise((resolve) => {
        const allImages = Array.from(document.querySelectorAll('.slideshowContainer img'));
        const imgElement = allImages.find(img => img.src === imgSrc);

        if (!imgElement) {
            console.error("Image source introuvable dans le DOM:", imgSrc);
            return resolve(null);
        }

        // --- AJUSTEMENT HAUTE QUALITÉ ---
        // 1800px offre un rendu très net (HD) idéal pour impression/validation
        const MAX_WIDTH = 1800; 
        
        // Utiliser la largeur réelle/naturelle de l'image si elle est chargée, sinon la taille max
        const baseWidth = imgElement.naturalWidth || canvas.width;
        const scale = Math.min(1, MAX_WIDTH / baseWidth);

        const targetWidth = Math.round(baseWidth * scale);
        const targetHeight = Math.round((imgElement.naturalHeight || canvas.height) * scale);

        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;

        // Lissage du contexte 2D pour éviter la pixellisation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Dessiner l'image du produit en Haute Définition
        ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);

        const activeOptionElement = document.querySelector('.personalization-option.active');
        const selectedOptionName = activeOptionElement ? activeOptionElement.getAttribute('data-name') : null;

        if (selectedOptionName === "Personnalisé") {
            // Qualité JPEG augmentée à 0.90
            resolve(tempCanvas.toDataURL('image/jpeg', 0.90));
            return;
        }

        // 2. Masquer les logos des autres vues
        const originalStates = canvas.getObjects().map(obj => ({
            obj: obj,
            visible: obj.visible
        }));

        canvas.getObjects().forEach(obj => {
            obj.visible = logosOnView.includes(obj);
        });

        // 3. Superposer la couche de logos avec le ratio ajusté
        const studioImage = new Image();
        studioImage.onload = function() {
            ctx.drawImage(studioImage, 0, 0, targetWidth, targetHeight);
            
            // Restaurer les états
            originalStates.forEach(state => state.obj.visible = state.visible);
            if (typeof filterLogosByImage === 'function') filterLogosByImage();

            // Exportation en JPEG Haute Qualité (0.90 = 90% netté / compression optimale)
            resolve(tempCanvas.toDataURL('image/jpeg', 0.90));
        };
        
        // Exporter le canvas Fabric au bon ratio de multiplicateur
        const fabricScale = targetWidth / canvas.width;
        studioImage.src = canvas.toDataURL({ 
            format: 'png',
            multiplier: fabricScale
        });
    });
}