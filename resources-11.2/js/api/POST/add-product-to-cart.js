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
    addToCartButton.textContent = '✓';

    setTimeout(() => {
        addToCartButton.disabled = false;
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
    
    if (errorContainer && !errorContainer.contains(event.target)) {
        if (!event.target.closest('.product-sizes input[type="number"]')) {
            clearProductErrors();
        }
    }
}

// ------------------------------------------------------------------------------------------------

async function addProductToCart(details) {

    let supplierId = "";
    let supplierName = "";
    let supplierShippingCost = "";
    let freeShippingAt = "";

    if (details) {
        supplierId = 12;
        supplierName = "Sage";
        supplierShippingCost = 0;
        freeShippingAt = 0;
    } else {
        supplierId = product.supplier.id;
        supplierName = product.supplier.name;
        supplierShippingCost = product.supplier.shippingCost;
        freeShippingAt = product.supplier.freeShippingAt;
    }

    clearProductErrors(); 
    
    let addToCartButton = document.querySelector("#addToCartBtn");
    addToCartButton.disabled = true;
    addToCartButton.classList.add('loading');
        
    let productCard = document.querySelector(".product-card");
    let id = productCard.getAttribute("data-pid");
    let sku = productCard.getAttribute("data-psku");
    let name = productCard.getAttribute("data-pname");
    
    let colorSelect = productCard.querySelector(".product-colors");
    let color = colorSelect ? colorSelect.value : "";
    let sizeElements = productCard.querySelectorAll(".variantDiv");

    const supplierData = {
        id: supplierId, 
        name: supplierName,
        shippingCost: supplierShippingCost,
        freeShippingAt: freeShippingAt
    };
    
    // --- 1. VALIDATION DES OPTIONS ---
// --- 1. VALIDATION DES OPTIONS ---
    const activeOptionElement = document.querySelector('.personalization-option.active');
    const selectedStudioOption = activeOptionElement ? activeOptionElement.getAttribute('data-name') : null;

    let selectedValues = [];
    let personalizationPrice = 0;

    // A. Traitement des sélecteurs <select>
    const personalizationSelects = document.querySelectorAll('#dynamic-controls-block select.product-personalization-option, #personalization-details select');
    const visibleSelects = Array.from(personalizationSelects).filter(select => select.style.display !== 'none' && select.offsetParent !== null);

    for (const select of visibleSelects) {
        if (select.value === '') {
            displayProductError("Vous devez choisir une option pour chaque sélecteur de personnalisation.");
            return resetAddButton(addToCartButton);
        }

        const selectedOption = select.options[select.selectedIndex];
        const optionText = selectedOption.getAttribute('data-pvalue') || selectedOption.text || select.value;
        if (optionText && optionText.trim() !== '') {
            selectedValues.push(optionText.trim());
        }

        const optionPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
        personalizationPrice += optionPrice;
    }

    // B. Traitement des <textarea>
    const textareas = document.querySelectorAll('#personalization-details textarea, #dynamic-controls-block textarea');
    textareas.forEach(textarea => {
        const val = textarea.value ? textarea.value.trim() : '';
        if (val !== '') {
            selectedValues.push(val);
        }
    });

    // C. Traitement EXCLUSIF des <input> ayant l'attribut [data-pvalue]
    const pvalueInputs = document.querySelectorAll('#personalization-details input[data-pvalue], #dynamic-controls-block input[data-pvalue]');
    pvalueInputs.forEach(input => {
        if ((input.type === 'radio' || input.type === 'checkbox') && !input.checked) return;
        if (input.type === 'hidden' || input.style.display === 'none') return;

        const val = input.value ? input.value.trim() : '';
        const pvalueName = input.getAttribute('data-pvalue').trim();

        if (val !== '') {
            selectedValues.push(`${pvalueName}: ${val}`);
        }
    });

    let personalizationValue = selectedValues.length > 0 ? selectedValues.join(', ') : "Aucune personnalisation";

    // --- 1.1 VALIDATION DU PRODUIT VIERGE ---
    const logosOnCanvas = (typeof canvas !== 'undefined' && canvas) 
        ? canvas.getObjects().filter(obj => obj.imageOwner).length 
        : 0;

    if (parseInt(product.blank) === 0 || selectedStudioOption !== "Blank") {
        if (logosOnCanvas === 0 && selectedStudioOption !== "Blank") {
            displayProductError("Veuillez ajouter votre logo sur le produit");
            return resetAddButton(addToCartButton);
        }
    }
    
    if (selectedStudioOption === "Blank" && parseInt(product.blank) === 0) {
        displayProductError("Désolé, la vente sans logo n'est pas disponible pour cet article.");
        return resetAddButton(addToCartButton);
    }

    // --- 2. VALIDATION DES QUANTITÉS ---
    let newItemsToAdd = [];
    let availableSizes = [];
    let hasQuantities = false;

    if (details) {
        // En mode details : Lire la quantité dans l'input de la variantDiv
        let inputEl = productCard.querySelector(".variantDiv input[type='number']") || productCard.querySelector(".product-sizes input[type='number']");
        let inputQte = inputEl ? parseInt(inputEl.value) : 0;
        
        if (isNaN(inputQte) || inputQte <= 0) {
            displayProductError("Veuillez saisir une quantité.");
            if (typeof filterLogosByImage === 'function') filterLogosByImage();
            return resetAddButton(addToCartButton);
        }

        const customSizeData = {
            size: "Quantité tot.",
            variantId: 0,
            stock: 999,
            rawPrice: 0
        };
        availableSizes.push(customSizeData);
        newItemsToAdd.push({ ...customSizeData, qte: inputQte });
        hasQuantities = true;
    } else {
        // Mode normal : Parcours de toutes les variantes
        sizeElements.forEach(sizeEl => {
            const sizeData = {
                size: sizeEl.dataset.sizeName,
                variantId: parseInt(sizeEl.dataset.sizeVariantId),
                stock: sizeEl.dataset.sizeStock,
                rawPrice: 0 
            };
            availableSizes.push(sizeData);

            let inputQte = parseInt(sizeEl.querySelector("input")?.value || 0);
            if (inputQte > 0) {
                hasQuantities = true;
                newItemsToAdd.push({ ...sizeData, qte: inputQte });
            }
        });
    }

    if (!hasQuantities) {
        displayProductError("Veuillez saisir une quantité.");
        if (typeof filterLogosByImage === 'function') filterLogosByImage();
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
            let temporaryViews = [];

            if (details) {
                // Mode DETAILS : Pas de conversion Canvas toDataURL
                temporaryViews = uniqueViews.map(viewSrc => {
                    const logosOnThisView = allLogos.filter(l => l.imageOwner === viewSrc);
                    return {
                        viewImage: viewSrc,
                        previewWithLogos: viewSrc,
                        logos: logosOnThisView.map(l => ({
                            width: (l.getScaledWidth() / (typeof currentDynamicPPI !== 'undefined' ? currentDynamicPPI : 1)).toFixed(2),
                            height: (l.getScaledHeight() / (typeof currentDynamicPPI !== 'undefined' ? currentDynamicPPI : 1)).toFixed(2),
                            src: l.getElement().src
                        }))
                    };
                });
            } else {
                // Mode NORMAL : Rendu Canvas standard
                temporaryViews = await Promise.all(uniqueViews.map(async (viewSrc) => {
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
            }

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
    
    // Réinitialiser les champs
    productCard.querySelectorAll("input, textarea").forEach(field => {
        if (field.type === "checkbox" || field.type === "radio") {
            field.checked = false;
        } else {
            field.value = "";
        }
    });

    productCard.querySelectorAll("select").forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Vider le canvas
    if (typeof canvas !== 'undefined' && canvas) {
        canvas.clear();
        
        const listContainer = document.getElementById('logo-list-container');
        if (listContainer) {
            listContainer.innerHTML = '';
        }
        
        if (typeof updateTotalLogoCounter === 'function') updateTotalLogoCounter();
        if (typeof updateLivePriceDisplay === 'function') updateLivePriceDisplay();
    }

    clearAllThumbnailLogos(); 

    getCountCartElement();
    handleCartAnimation(productCard);
}

function clearAllThumbnailLogos() {
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!verticalContainer) return;

    const overlays = verticalContainer.querySelectorAll('.thumb-logo-overlay');
    overlays.forEach(overlay => {
        overlay.innerHTML = '';
    });
}

function resetAddButton(btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
}

async function uploadDesignToServer(signature, views) {
    const response = await fetch('../api/POST/addTemporaryDesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, views })
    });
    return await response.json();
}

async function getDesignPreviews() {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    const previews = [];

    for (const img of allImages) {
        const logosOnThisView = canvas.getObjects().filter(obj => obj.imageOwner === img.src);

        if (logosOnThisView.length > 0) {
            const preview = await new Promise((resolve) => {
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
                    originalStates.forEach(state => state.obj.visible = state.visible);
                    resolve(tempCanvas.toDataURL('image/jpeg', 1));
                };
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

        const MAX_WIDTH = 1800; 
        const baseWidth = imgElement.naturalWidth || canvas.width;
        const scale = Math.min(1, MAX_WIDTH / baseWidth);

        const targetWidth = Math.round(baseWidth * scale);
        const targetHeight = Math.round((imgElement.naturalHeight || canvas.height) * scale);

        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);

        const activeOptionElement = document.querySelector('.personalization-option.active');
        const selectedOptionName = activeOptionElement ? activeOptionElement.getAttribute('data-name') : null;

        if (selectedOptionName === "Personnalisé") {
            resolve(tempCanvas.toDataURL('image/jpeg', 0.90));
            return;
        }

        const originalStates = canvas.getObjects().map(obj => ({
            obj: obj,
            visible: obj.visible
        }));

        canvas.getObjects().forEach(obj => {
            obj.visible = logosOnView.includes(obj);
        });

        const studioImage = new Image();
        studioImage.onload = function() {
            ctx.drawImage(studioImage, 0, 0, targetWidth, targetHeight);
            originalStates.forEach(state => state.obj.visible = state.visible);
            if (typeof filterLogosByImage === 'function') filterLogosByImage();

            resolve(tempCanvas.toDataURL('image/jpeg', 0.90));
        };
        
        const fabricScale = targetWidth / canvas.width;
        studioImage.src = canvas.toDataURL({ 
            format: 'png',
            multiplier: fabricScale
        });
    });
}