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
    
    let mainImgEl = document.querySelector(".slideshowContainer img[style*='display: block']") || document.querySelector(".slideshowContainer img");
    let productImageSrc = mainImgEl ? mainImgEl.src : "";

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
        ? canvas.getObjects().filter(obj => obj.imageOwner && !obj.sourceFileMarker && !obj.logoLetterMarker).length
        : 0;
    const sourceOnlyFiles = window.pendingLogoSourceFiles || [];

    if (parseInt(product.blank) === 0 || selectedStudioOption !== "Blank") {
        if (logosOnCanvas === 0 && sourceOnlyFiles.length === 0 && selectedStudioOption !== "Blank") {
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
            size: "unité",
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

    if (logosOnCanvas > 0 || sourceOnlyFiles.length > 0) {
        designSignature = "studio_" + Date.now();
        const allCanvasItems = (typeof canvas !== 'undefined' && canvas)
            ? canvas.getObjects().filter(obj => obj.imageOwner && !obj.logoLetterMarker)
            : [];
        const allLogos = allCanvasItems.filter(obj => !obj.sourceFileMarker);
        const uniqueViews = [...new Set(allCanvasItems.map(item => item.imageOwner))];
        const originalSourceUploads = [];
        let sourceUploadIndex = 0;
        const registerSourceFile = (file, prefix = 'source') => {
            if (!file) return null;
            const key = `${prefix}_${++sourceUploadIndex}`;
            originalSourceUploads.push({ key, file });
            return key;
        };
        sourceOnlyFiles.forEach(source => {
            source.uploadKey = registerSourceFile(source.file, 'attachment');
        });
        
        try {
            let temporaryViews = [];

            if (details) {
                // Mode DETAILS : Pas de conversion Canvas toDataURL
                temporaryViews = uniqueViews.map(viewSrc => {
                    const logosOnThisView = allLogos.filter(l => l.imageOwner === viewSrc);
                    const markersOnThisView = allCanvasItems.filter(item => item.sourceFileMarker && item.imageOwner === viewSrc);
                    return {
                        viewImage: viewSrc,
                        previewWithLogos: viewSrc,
                        markers: markersOnThisView.map(marker => ({
                            sourceKey: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.uploadKey,
                            name: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.file.name,
                            letter: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.letter,
                            left: marker.left / canvas.width,
                            top: marker.top / canvas.height,
                            width: marker.getScaledWidth() / canvas.width,
                            height: marker.getScaledHeight() / canvas.height
                        })),
                        logos: logosOnThisView.map(l => ({
                            width: (l.getScaledWidth() / (typeof currentDynamicPPI !== 'undefined' ? currentDynamicPPI : 1)).toFixed(2),
                            height: (l.getScaledHeight() / (typeof currentDynamicPPI !== 'undefined' ? currentDynamicPPI : 1)).toFixed(2),
                            src: l.getElement().src,
                            sourceKey: registerSourceFile(l.logoSourceFile),
                            name: l.logoSourceFile ? l.logoSourceFile.name : 'Logo',
                            letter: l.logoLetter,
                            letterMarker: getLogoLetterMarkerData(l)
                        }))
                    };
                });
            } else {
                // Mode NORMAL : Rendu Canvas standard
                temporaryViews = await Promise.all(uniqueViews.map(async (viewSrc) => {
                    const logosOnThisView = allLogos.filter(l => l.imageOwner === viewSrc);
                    const markersOnThisView = allCanvasItems.filter(item => item.sourceFileMarker && item.imageOwner === viewSrc);
                    const previewItems = canvas.getObjects().filter(item => item.imageOwner === viewSrc);
                    const previewImage = await getSingleViewPreview(viewSrc, previewItems);

                    return {
                        viewImage: viewSrc,
                        previewWithLogos: previewImage, 
                        markers: markersOnThisView.map(marker => ({
                            sourceKey: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.uploadKey,
                            name: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.file.name,
                            letter: sourceOnlyFiles.find(source => source.id === marker.sourceFileId)?.letter,
                            left: marker.left / canvas.width,
                            top: marker.top / canvas.height,
                            width: marker.getScaledWidth() / canvas.width,
                            height: marker.getScaledHeight() / canvas.height
                        })),
                        logos: logosOnThisView.map(l => ({
                            width: (l.getScaledWidth() / currentDynamicPPI).toFixed(2),
                            height: (l.getScaledHeight() / currentDynamicPPI).toFixed(2),
                            src: l.getElement().src,
                            sourceKey: registerSourceFile(l.logoSourceFile),
                            name: l.logoSourceFile ? l.logoSourceFile.name : 'Logo',
                            letter: l.logoLetter,
                            letterMarker: getLogoLetterMarkerData(l)
                        }))
                    };
                }));
            }

            const uploadResult = await uploadDesignToServer(designSignature, temporaryViews, originalSourceUploads);

            if (uploadResult.status === 'success') {
                const designPayload = {
                    signature: designSignature,
                    timestamp: new Date().toISOString(),
                    views: uploadResult.views,
                    sourceFiles: uploadResult.sourceFiles
                };
                localStorage.setItem(designSignature, JSON.stringify(designPayload));

                studioDataSummary = { 
                    logoCount: allLogos.length, 
                    sourceFiles: uploadResult.sourceFiles,
                    designSignature: designSignature,
                    selectedPersonalizationOption: selectedStudioOption,
                    views: uploadResult.views.map(v => ({
                        previewUrl: v.previewUrl,
                        markers: v.markers,
                        logos: v.logos.map(l => ({
                            width: l.width,
                            height: l.height,
                            sourceUrl: l.sourceUrl,
                            sourceName: l.sourceName,
                            sourceFilename: l.sourceFilename,
                            name: l.name,
                            letter: l.letter,
                            letterMarker: l.letterMarker
                        }))
                    }))
                };
            } else {
                throw new Error(uploadResult.message || "La sauvegarde du design a échoué.");
            }
        } catch (error) {
            console.error("Erreur lors de l'upload :", error);
            const message = error instanceof Error && error.message
                ? error.message
                : "Erreur lors de la sauvegarde du design. Veuillez réessayer.";
            displayProductError(message);
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
        
        // Inclure imgUrl uniquement si details est vrai
        if (details) {
            existingGroup.imgUrl = productImageSrc;
        }

        if (existingGroup.studioData) {
            existingGroup.studioData.selectedPersonalizationOption = selectedStudioOption;
            existingGroup.studioData.views = studioDataSummary ? studioDataSummary.views : null;
        }
    } else {
        // Construction de l'objet produit de base
        const newCartItem = {
            id: id, sku: sku, name: name, color: color,
            supplierId: supplierData.id,
            supplier: supplierData,
            personalizationValue: personalizationValue,
            personalizationPrice: 0,
            designSignature: designSignature,
            studioData: studioDataSummary,
            sizes: newItemsToAdd,
            availableSizes: availableSizes 
        };

        // Ajouter imgUrl UNIQUEMENT si details est vrai (Sage/Détails)
        if (details) {
            newCartItem.imgUrl = productImageSrc;
        }

        cart.push(newCartItem);
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
    window.pendingLogoSourceFiles.forEach(source => {
        if (source.previewUrl) URL.revokeObjectURL(source.previewUrl);
    });
    window.pendingLogoSourceFiles = [];
    const sourceOnlyList = document.getElementById('source-only-logo-list');
    if (sourceOnlyList) sourceOnlyList.innerHTML = '';

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

async function uploadDesignToServer(signature, views, sourceUploads) {
    const uploadedSources = [];
    for (const source of sourceUploads) {
        const formData = new FormData();
        formData.append('signature', signature);
        formData.append('key', source.key);
        formData.append('sourceFile', source.file, source.file.name);

        const sourceResponse = await fetch('../api/POST/addTemporaryDesign', {
            method: 'POST',
            body: formData
        });
        const sourceResult = await sourceResponse.json();
        if (!sourceResponse.ok || sourceResult.status !== 'success') {
            throw new Error(sourceResult.message || `Impossible d'enregistrer ${source.file.name}.`);
        }

        uploadedSources.push(sourceResult.sourceFile);
    }

    const response = await fetch('../api/POST/addTemporaryDesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, views })
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || "La sauvegarde du design a échoué.");
    }

    const sourceByKey = new Map(uploadedSources.map(source => [source.key, source]));
    result.views = result.views.map(view => ({
        ...view,
        logos: view.logos.map(logo => {
            const source = sourceByKey.get(logo.sourceKey);
            return source ? {
                ...logo,
                sourceUrl: source.url,
                sourceName: source.name,
                sourceFilename: source.filename
            } : logo;
        })
    }));
    result.sourceFiles = uploadedSources.filter(source =>
        sourceUploads.some(upload => upload.key === source.key && upload.key.startsWith('attachment_'))
    );
    return result;
}

function getLogoLetterMarkerData(logo) {
    const badge = canvas && canvas.getObjects().find(obj => obj.logoLetterMarker && obj.logoId === logo.id);
    if (!badge || !canvas.width || !canvas.height) return null;
    return {
        left: badge.left / canvas.width,
        top: badge.top / canvas.height,
        width: badge.getScaledWidth() / canvas.width,
        height: badge.getScaledHeight() / canvas.height
    };
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