document.addEventListener('DOMContentLoaded', function() {
    getCart();
});

let ssl_amount = 0;

/**
 * Mise à jour de l'affichage d'un produit spécifique (utilisé après modification)
 */
function updateCartItemDisplay(pid, color, personalizationValue, personalizationPrice, designSignature) {
    const storedCart = localStorage.getItem("cart/cc");
    // On normalise la signature pour le sélecteur
    const cleanSig = (designSignature === 'null' || !designSignature) ? 'null' : designSignature;
    const selector = `.cart-product-container[data-pid='${pid}'][data-color='${color}'][data-design-signature='${cleanSig}']`;
    const oldContainer = document.querySelector(selector);

    if (!storedCart) {
        if (oldContainer) oldContainer.remove();
        return;
    }

    let products = JSON.parse(storedCart);
    if(products.length == 0) { window.location.reload(); return; }

    const cartProduct = products.find(item => 
        String(item.id) === String(pid) && 
        item.color === color && 
        ((!item.designSignature && cleanSig === 'null') || item.designSignature === designSignature)
    );

    if (!cartProduct) {
        if (oldContainer) oldContainer.remove();
        return;
    }

    let designData = null;
    if (cartProduct.designSignature) {
        const savedDesign = localStorage.getItem(cartProduct.designSignature);
        if (savedDesign) designData = JSON.parse(savedDesign);
    }

    let totalProductPrice = 0;
    let sizesHtml = '';
    const sizesByPrice = {};
    
    cartProduct.sizes.forEach(size => {
        const tempItem = { ...cartProduct, sizes: [size] };
        const unitPrice = calculateCartPriceLogic(tempItem, products);
        const priceKey = unitPrice.toFixed(2);

        if (!sizesByPrice[priceKey]) {
            sizesByPrice[priceKey] = { sizes: [], unitPrice: unitPrice };
        }
        sizesByPrice[priceKey].sizes.push(size);
    });

    for (const priceKey in sizesByPrice) {
        const group = sizesByPrice[priceKey];
        sizesHtml += `
            <div class="size-row">
                <div>
                    ${group.sizes.map(s => `<span class="editableQte">${s.qte}</span><span>x(${s.size})</span>`).join(', ')}
                </div>
                <div class="size-prices">
                    <span style="display:none;">${group.unitPrice.toFixed(2)} $ ch</span>
                </div>
            </div>`;
        totalProductPrice += (group.unitPrice * group.sizes.reduce((sum, s) => sum + s.qte, 0));
    }

    const shortName = cartProduct.name.length > 25 ? cartProduct.name.substring(0, 25) + "..." : cartProduct.name;
    let productLink = 'details';

    if(designData != null){
        productLink = "studio";
    }

    let isPersonnalized = designData != null ? "Personnalisation : " + cartProduct.studioData.selectedPersonalizationOption : '';



    if (oldContainer) {
        // RÉINJECTION DU HTML ORIGINAL (Mode lecture)
        oldContainer.innerHTML = `
                    <summary onclick="toggleDetails(event)">
                        <div class="quickInfoSummary">
                        <span>${shortName} (${product.sku}) - ${product.color}</span>
                        <span>${isPersonnalized}</span>
                        </div>
                        <span Style="display:none;">${totalProductPrice.toFixed(2)} $</span>

                    </summary>
                    <div class="editableSizesContainer">
                        <div class="product-meta-detail">
                        </div>
                ${generateStudioHTML(cartProduct, designData)}
                ${(cartProduct.personalizationValue && cartProduct.personalizationValue !== 'Aucune personnalisation') ? `<span>Option : ${cartProduct.personalizationValue}</span>` : ''}
                ${sizesHtml}
                ${cartProduct.personalizationValue !== 'Aucune personnalisation' ? `<p><strong>Option :</strong> ${cartProduct.personalizationValue}</p>` : ''}

                <div class="cart-product-actions">
                    <button onclick="editProductCart('${cartProduct.id}', '${cartProduct.color}', '${cartProduct.personalizationValue}', '${cartProduct.personalizationPrice}', ${cleanSig !== 'null' ? `'${cleanSig}'` : 'null'})">Modifier</button> 
                    <button class='secondary' onclick="deleteProductCart('${cartProduct.id}', '${cartProduct.color}', '${cartProduct.personalizationValue}', '${cartProduct.personalizationPrice}', ${cleanSig !== 'null' ? `'${cleanSig}'` : 'null'})">Supprimer</button> 
                </div>
            </div>`;
        
        // On s'assure que le conteneur perd sa classe 'active' pour fermer le tiroir
        oldContainer.classList.remove('active');
        const details = oldContainer.querySelector('.editableSizesContainer');
        if (details) details.style.display = 'none';
    }
    updateCartTotals();
}

/**
 * Calcul des totaux de la commande basé sur les prix bruts enregistrés
 */
function updateCartTotals() {
    const storedCart = localStorage.getItem("cart/cc");
    const cartContainer = document.querySelector("#cart-container");

    if (!storedCart) return;

    let products = JSON.parse(storedCart);
    if (!Array.isArray(products) || products.length === 0) {
        document.querySelector("#paymentStep").innerHTML = "<div class='cartMessage'>Votre panier est vide</div>";
        return;
    }
    
    let subTotalCartPrice = 0;

    // On boucle sur chaque produit pour calculer le sous-total réel
    products.forEach((product) => {
        product.sizes.forEach(size => {
            subTotalCartPrice += (size.price * size.qte);
        });
    })

    // Calculs financiers
    // Seuil de livraison gratuite globale boutique (ex: 75$)
    let shipping = subTotalCartPrice >= 300 ? 0 : 15; 
    let tps = (subTotalCartPrice + shipping) * 0.05;
    let tvq = (subTotalCartPrice + shipping) * 0.09975;
    let totalCart = subTotalCartPrice + shipping + tps + tvq;

    /*
    const totalsHtml = `
        <div id="totalPriceContainer">
            <div class="total-row"><span>Sous-total :</span> <span style="">${subTotalCartPrice.toFixed(2)} $</span></div>
            <div class="total-row"><span>Livraison :</span> <span>${shipping.toFixed(2)} $</span></div>
            <div class="total-row"><span>TPS (5%) :</span> <span>${tps.toFixed(2)} $</span></div>
            <div class="total-row"><span>TVQ (9.975%) :</span> <span>${tvq.toFixed(2)} $</span></div>
            <hr>
            <div class="total-row grand-total"><span>Total :</span> <span>${totalCart.toFixed(2)} $</span></div>
        </div>
    `;
    */
    const totalsHtml = `
        <div id="totalPriceContainer">
            <p style="width:100%; max-width:500px;text-align:left;">
                Une fois votre demande de soumission reçue, vous recevrez une soumission détaillée contenant le prix de chaque produit.
            </p>
        </div>
    `;

    // Variable pour le paiement Converge
    //ssl_amount = totalCart.toFixed(2);

    let existingTotalsContainer = document.querySelector("#totalPriceContainer");
    if (existingTotalsContainer) {
        existingTotalsContainer.outerHTML = totalsHtml;
    } else {
        // On l'insère après le conteneur du panier
        cartContainer.insertAdjacentHTML('beforeend', totalsHtml);
    }
}

/**
 * Affichage principal du panier
 */
/**
 * Affichage principal du panier avec mise à jour automatique des prix stockés
 */
function getCart() {
    let cartContainer = document.querySelector("#cart-container");
    if (!cartContainer) return;
    cartContainer.innerHTML = ''; 

    try {
        const storedCart = localStorage.getItem("cart/cc");
        if (!storedCart) {
            cartContainer.innerHTML = "<div class='cartMessage'>Votre panier est vide</div>";
            document.querySelector("#paymentStep").innerHTML = "<div class='cartMessage'>Vous n'avez aucun produit dans le panier</div>";
            return;
        }

        let products = JSON.parse(storedCart);
        if (!Array.isArray(products) || products.length === 0) {
            cartContainer.innerHTML = "<div class='cartMessage'>Votre panier est vide</div>";
            document.querySelector("#paymentStep").innerHTML = "<div class='cartMessage'>Vous n'avez aucun produit dans le panier</div>";
            return;
        }

        // --- NOUVEAU : SYNCHRONISATION DES PRIX DANS LE LOCALSTORAGE ---
        // On s'assure que la propriété .price de chaque taille est à jour selon les paliers actuels
        products.forEach(product => {
            product.sizes.forEach(sizeObj => {
                // On simule l'item pour obtenir le prix unitaire calculé
                const tempItem = { ...product, sizes: [sizeObj] };
                const calculatedPrice = calculateCartPriceLogic(tempItem, products);
                
                // On met à jour la valeur réelle dans l'objet
                sizeObj.price = parseFloat(calculatedPrice.toFixed(2));
            });
        });
        // On sauvegarde le panier mis à jour pour que processPayment envoie les bons chiffres
        localStorage.setItem("cart/cc", JSON.stringify(products));
        // ---------------------------------------------------------------

        let productHtml = '';
        products.forEach((product) => {
            let designData = null;
            if (product.designSignature) {
                designData = JSON.parse(localStorage.getItem(product.designSignature));
            }

            let totalProductPrice = 0;
            let sizesHtml = '';

            // --- REGROUPEMENT DYNAMIQUE POUR L'AFFICHAGE ---
            const sizesByPrice = {};
            product.sizes.forEach(size => {
                // Ici, on utilise directement size.price qui vient d'être mis à jour au-dessus
                const priceKey = size.price.toFixed(2);

                if (!sizesByPrice[priceKey]) {
                    sizesByPrice[priceKey] = { sizes: [], unitPrice: size.price };
                }
                sizesByPrice[priceKey].sizes.push(size);
            });

            for (const priceKey in sizesByPrice) {
                const group = sizesByPrice[priceKey];
                sizesHtml += `
                    <div class="size-row">
                        <div>
                            ${group.sizes.map(s => `<span class="editableQte">${s.qte}</span><span>x(${s.size})</span>`).join(', ')}
                        </div>
                        <div class="size-prices">
                            <span class="dynamic-price-highlight"  style="display:none;">${group.unitPrice.toFixed(2)} $ ch</span>
                        </div>
                    </div>`;
                totalProductPrice += (group.unitPrice * group.sizes.reduce((sum, s) => sum + s.qte, 0));
            }

            const shortName = product.name.length > 25 ? product.name.substring(0, 25) + "..." : product.name;
            let productLink = designData != null ? "studio" : 'details';

            let isPersonnalized = designData != null ? "Personnalisation : " + product.studioData.selectedPersonalizationOption : '';

            productHtml += `
                <div class="cart-product-container" data-pid="${product.id}" data-sku="${product.sku}" data-color="${product.color}" data-design-signature="${product.designSignature || 'null'}"> 
                    <summary onclick="toggleDetails(event)">
                        <div class="quickInfoSummary">
                        <span>${shortName} (${product.sku}) - ${product.color}</span>
                        <span>${isPersonnalized}</span>
                        </div>
                        <span Style="display:none;">${totalProductPrice.toFixed(2)} $</span>
                    </summary>
                    <div class="editableSizesContainer">
                        <div class="product-meta-detail">
                        </div>
                        ${generateStudioHTML(product, designData)}
                        ${sizesHtml}
                        ${product.personalizationValue !== 'Aucune personnalisation' ? `<p><strong>Option :</strong> ${product.personalizationValue}</p>` : ''}

                        <div class="cart-product-actions">
                            <button onclick="editProductCart('${product.id}', '${product.color}', '${product.personalizationValue}', '${product.personalizationPrice}', '${product.designSignature}')">Modifier</button> 
                            <button class='secondary' onclick="deleteProductCart('${product.id}', '${product.color}', '${product.personalizationValue}', '${product.personalizationPrice}', '${product.designSignature}')">Supprimer</button> 
                        </div>
                    </div>
                </div>`;
        });

        cartContainer.innerHTML = productHtml;
        updateCartTotals(); 

    } catch (e) {
        console.error("Erreur panier :", e);
    }
}



/**
 * Calcule le prix final d'un item du panier en suivant la logique Studio
 */
function calculateCartPriceLogic(item, allProducts) {
    if (!item || !item.sizes || item.sizes.length === 0) return 0;

    const rawPrice = parseFloat(item.sizes[0].rawPrice) || 0;
    const initialCost = rawPrice / 1.6;
    const currentSupplierId = item.supplierId;
    
    let qtySameSupp = 0;
    let totalQtyGlobal = 0;
    let totalQtyCustomized = 0;

    allProducts.forEach(p => {
        const pQty = p.sizes.reduce((sum, s) => sum + (parseInt(s.qte) || 0), 0);
        totalQtyGlobal += pQty;
        if (String(p.supplierId) === String(currentSupplierId)) qtySameSupp += pQty;
        if (p.designSignature && p.designSignature !== 'null') totalQtyCustomized += pQty;
    });

    const supplier = item.supplier || {};
    const shippingFee = parseFloat(supplier.shippingCost) || 0;
    const freeAt = parseFloat(supplier.freeShippingAt) || 0;
    const currentShippingFee = (qtySameSupp * rawPrice >= freeAt && freeAt > 0) ? 0 : shippingFee;
    const shippingShare = currentShippingFee / Math.max(1, qtySameSupp);

    // --- LOGIQUE DE DÉCORATION SÉPARÉE ---
    let decorationCostUnit = 0;
    const personalizationOption = item.studioData ? item.studioData.selectedPersonalizationOption : null;
    
    if (item.designSignature) {
        if (personalizationOption === "DTF") {
            // Cette fonction ajoute .orderDtfIn à l'objet
            decorationCostUnit = 0;
        } else if (personalizationOption === "UV DTF") {
            // On utilise la logique simplifiée pour l'UV DTF (prix fixe 0.036)
            decorationCostUnit = 0;
        }
    } else {
        decorationCostUnit = parseFloat(item.personalizationPrice) || 0;
    }

    let multiplier = 1.6;
    if (totalQtyGlobal >= 50) multiplier = 1.3;
    else if (totalQtyGlobal >= 26) multiplier = 1.4;

    return (initialCost + decorationCostUnit + shippingShare) * multiplier;
}

/**
 * Calcul technique du DTF basé sur le LocalStorage
 */
/**
 * Calcul technique du DTF basé sur le LocalStorage
 * Détermine également si la commande doit être faite en "Standard" ou "GangSheet"
 */
function getDTFCostUnitForCart(item, allProducts, totalQtyCustomized) {
    const designData = JSON.parse(localStorage.getItem(item.designSignature));
    if (!designData) return 0;

    let itemLogoCount = 0;
    let itemSurfaceStandard = 0;
    let itemSurfaceGang = 0;

    // 1. Calcul des surfaces de l'item actuel (pour 1 unité)
    designData.views.forEach(view => {
        view.logos.forEach(l => {
            itemLogoCount++;
            const w = parseFloat(l.width);
            const h = parseFloat(l.height);
            itemSurfaceStandard += (w * h);
            itemSurfaceGang += ((w + 0.125) * (h + 0.125));
        });
    });

    // 2. Calcul des surfaces globales du panier pour trouver les paliers (Rates)
    let globalAreaStandard = 0;
    let globalAreaGang = 0;
    
    allProducts.forEach(p => {
        if (p.designSignature) {
            const pQty = p.sizes.reduce((sum, s) => sum + s.qte, 0);
            const d = JSON.parse(localStorage.getItem(p.designSignature));
            if (d) {
                d.views.forEach(v => v.logos.forEach(l => {
                    const w = parseFloat(l.width);
                    const h = parseFloat(l.height);
                    globalAreaStandard += (w * h * pQty);
                    globalAreaGang += ((w + 0.125) * (h + 0.125) * pQty);
                }));
            }
        }
    });

    const getRate = (area) => {
        if (area >= 3000) return 0.017;
        if (area >= 1600) return 0.020;
        if (area >= 700) return 0.022;
        if (area >= 20) return 0.030;
        return 0.060;
    };

    // 3. Comparaison pour déterminer la méthode la moins chère
    const rateStandard = getRate(globalAreaStandard);
    const rateGang = getRate(globalAreaGang);

    const totalCostStandard = itemSurfaceStandard * rateStandard;
    const totalCostGang = itemSurfaceGang * rateGang;

    // --- AJOUT DE L'INFORMATION DANS L'ITEM ---
    if (item.studioData) {
        item.studioData.orderDtfIn = (totalCostGang < totalCostStandard) ? "GangSheet" : "Standard";
        // Optionnel : un petit log pour confirmer la décision en console
        // console.log(`DTF Method pour ${item.sku}: ${item.studioData.orderDtfIn}`);
    }

    // 4. Calcul final du coût de décoration
    const finalSurfaceCost = Math.min(totalCostStandard, totalCostGang);
    const decoShippingShare = 2.50 / (totalQtyCustomized || 1);
    const mainOeuvre = 1.67 * itemLogoCount;

    return Math.round((mainOeuvre + finalSurfaceCost + decoShippingShare) * 100) / 100;
}

/**
 * Calcul technique du UV DTF pour le panier (Basé sur le LocalStorage)
 * Prix fixe de 0.036$ / po² sans logique de Gang Sheet.
 */
function getUVDTFCostUnitForCart(item, allProducts, totalQtyCustomized) {
    const designData = JSON.parse(localStorage.getItem(item.designSignature));
    if (!designData) return 0;

    let itemLogoCount = 0;
    let itemSurfaceTotal = 0;

    // 1. Calcul de la surface réelle des logos de l'item actuel
    designData.views.forEach(view => {
        view.logos.forEach(l => {
            itemLogoCount++;
            const w = parseFloat(l.width);
            const h = parseFloat(l.height);
            // On utilise la surface brute (0.036$/po²)
            itemSurfaceTotal += (w * h);
        });
    });

    // 2. Main d'oeuvre fixe UV DTF (0.67$ par logo)
    const mainOeuvre = 0.67 * itemLogoCount;

    // 3. Calcul de la surface monétaire (Fixe : 0.036$)
    const costSurface = itemSurfaceTotal * 0.036;

    // 4. Partage des frais de 2.50$ sur la quantité totale personnalisée du panier
    const decoShippingShare = 2.50 / (totalQtyCustomized || 1);

    // --- RÉSULTAT FINAL ---
    return Math.round((mainOeuvre + costSurface + decoShippingShare) * 100) / 100;
}


// =================================================================================
// FONCTION POUR GÉRER LE TOGGLE (inchangée)
// =================================================================================
function toggleDetails(event) {
    let container = event.target.closest('.cart-product-container');
    let details = container.querySelector('.editableSizesContainer');
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'flex';
        container.classList.add('active');
    }else{
        details.style.display = 'none';
        container.classList.remove('active');
    }
}

// =================================================================================
// FONCTION DE VALIDATION (MISE À JOUR pour afficher les erreurs)
// =================================================================================
// =================================================================================
// FONCTION DE VALIDATION (MISE À JOUR pour afficher les erreurs)
// =================================================================================
function validateCart() {
    return new Promise((resolve, reject) => {
        let storedCart = localStorage.getItem("cart/cc");
        
        if (!storedCart) {
            resolve(true); 
            return;
        }

        let products = JSON.parse(storedCart);

        // --- ENRICHISSEMENT DES DONNÉES ---
        // On crée une copie des produits en y injectant les détails du design
        const productsForValidation = products.map(product => {
            if (product.designSignature) {
                const savedDesign = localStorage.getItem(product.designSignature);
                if (savedDesign) {
                    const designData = JSON.parse(savedDesign);
                    
                    // On retourne le produit avec l'objet studioData complet (incluant les views)
                    // C'est ce que le PHP attend pour calculer le prix DTF
                    return {
                        ...product,
                        studioData: {
                            ...product.studioData,
                            views: designData.views // Contient les logos, largeurs et hauteurs
                        }
                    };
                }
            }
            return product;
        });

        fetch('./api/VALIDATE/cart', {
            'method': 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products: productsForValidation }) 
        })
        .then(response => response.json())
        .then(data => {
            let isValid = true;

            if (data && data.success) {
                let allProducts = document.querySelectorAll(".editableSizesContainer.inEdit");

                if (allProducts.length !== 0) {
                    document.querySelector("#paymentStep").insertAdjacentHTML('beforebegin', `
                        <div class='cartErrorMessage addedErrors'>
                            <p>Veuillez mettre à jour ou annuler la modification du produit avant de continuer</p>
                        </div>`);
                    scrollToFirstError();
                    isValid = false; 
                }

            } else if (data && data.invalid_products) {
                let invalidProductsArray = data.invalid_products;
                
                invalidProductsArray.forEach(errorInfo => {
                    const productId = errorInfo.id;
                    const sig = errorInfo.designSignature;
                    
                    // Ciblage par PID et Signature pour être précis
                    const selector = `.cart-product-container[data-pid="${productId}"][data-design-signature="${sig}"]`;
                    const container = document.querySelector(selector); 

                    if (container) {
                        const detailsContent = container.querySelector('.editableSizesContainer');
                        if (detailsContent) {
                            container.classList.add('has-error');
                            let errorHtml = `<div class="product-error-message"><p class="error-text">${errorInfo.reason}</p></div>`;
                            detailsContent.insertAdjacentHTML('beforeend', errorHtml); 
                            detailsContent.style.display = 'flex';
                            container.classList.add('active');
                        }
                    } else {
                        document.querySelector("#paymentStep").insertAdjacentHTML('beforebegin', `
                            <div class='cartErrorMessage addedErrors'><p>Erreur: ${errorInfo.reason}</p></div>`);
                    }
                });
                
                scrollToFirstError();
                isValid = false;

            } else {
                let errorMessage = (data && data.message) ? data.message : "Erreur de validation.";
                document.querySelector("#paymentStep").insertAdjacentHTML('beforebegin', `<div class='cartErrorMessage addedErrors'><p>${errorMessage}</p></div>`);
                scrollToFirstError();
                isValid = false;
            }
            
            if (isValid) resolve(true);
            else reject(false);
        })
        .catch(error => {
            console.error('Erreur API:', error);
            reject(false);
        });
    });
}

function validateUserInfo(step) {
    return new Promise((resolve, reject) => {
        if(step){
            let form = document.getElementById('paymentForm');
            let requiredFields = form.querySelectorAll('[required]');
            let requiredFieldsName = [];

            requiredFields.forEach(element => {
                requiredFieldsName.push(element.name);
            });

            const formData = new FormData(form);
            formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName));
            
            fetch("./api/VALIDATE/user-infos-step-" + step, {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success === false) {
                    if (data.errors && typeof data.errors === 'object') {
                        for (const fieldName in data.errors) {
                            if (data.errors.hasOwnProperty(fieldName)) {
                                const errorMessage = data.errors[fieldName];
                                addElementAfterInput(fieldName, errorMessage); 
                            }
                        }
                    }

                    if(data.message){
                        addElementAfterElementId('button-step-'+step, data.message); 
                    }
                    
                    reject(false); // Échec de la validation des infos
                } else if (data && data.success === true) {
                    resolve(true); // Succès
                } else {
                    reject(false); // Cas inattendu
                }
            })
            .catch(error => {
                console.error('Erreur réseau ou API:', error);
                addElementAfterElementId('button-step-'+step, 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
                reject(false); // Échec dû à une erreur réseau/serveur
            });
        } else {
            resolve(true); 
        }
    });
}

function validateStep(step) {
    // Nettoyage global des erreurs (Anciennes erreurs, messages produits, etc.)
    document.querySelectorAll('.error-message, .cartErrorMessage, .product-error-message').forEach(el => el.remove());
    document.querySelectorAll('.cart-product-container').forEach(el => el.classList.remove('has-error'));
    
    const currentButton = document.getElementById('button-step-' + step);

    // Activation du mode chargement
    if (currentButton) {
        currentButton.disabled = true;
        currentButton.classList.add('loading');
        // On sauvegarde le texte original pour le remettre plus tard si besoin
        currentButton.dataset.originalText = currentButton.textContent;
        currentButton.textContent = 'Validation...';
    }

    // Lancement des validations simultanées (Panier + Infos Utilisateur)
    Promise.all([
        validateCart(),        
        validateUserInfo(step) 
    ])
    .then(() => {
        // Succès de la validation
        if (currentButton) currentButton.classList.remove('loading');

        if (step === 3) {
            // Étape finale : on lance le processus de paiement
            const payBtn = document.getElementById('paymentBtn');
            processPayment(payBtn);
        } else if (step === 2) {
           nextStep(step);
        } else if (step === 1) {
            nextStep(step);
        } else {
            nextStep(step);
        }
    })
    .catch(() => {
        // Échec : on réactive le bouton pour que l'utilisateur corrige ses erreurs
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.classList.remove('loading');
            currentButton.textContent = currentButton.dataset.originalText || 'Continuer';
        }
    });
}
/**
 * Affiche l'épreuve interactive pour validation avant paiement
 * Uniquement si des produits personnalisés avec données existent.
 */


function generateStudioHTML(product, designData = null) {
    // 1. Récupération des données du design (depuis LocalStorage ou paramètre)
    if (!designData && product.designSignature) {
        const savedDesign = localStorage.getItem(product.designSignature);
        if (savedDesign) {
            try {
                designData = JSON.parse(savedDesign);
            } catch (e) {
                console.error("Erreur de lecture de designData:", e);
            }
        }
    }

    // Sécurité : si aucune donnée de vue n'est disponible, on retourne une chaîne vide
    if (!designData || !designData.views) return '';

    // 2. Détermination du mode de personnalisation sélectionné
    // On vérifie les différents endroits où cette valeur peut se trouver
    const selectedOption = product.selectedPersonalizationOption 
        || (product.studioData && product.studioData.selectedPersonalizationOption)
        || (designData && designData.selectedPersonalizationOption);

    const isCustomMode = selectedOption === "Personnalisé";

    // 3. Construction des rangées par vue
    let viewRows = designData.views.map((view, index) => {
        
        // Génération de la liste HTML pour chaque logo présent sur cette vue
        const logosHtml = view.logos.map((l, logoIndex) => {
            // Chemin absolu ou relatif vers l'image source enregistrée
            const logoPath = `static-resources/temp-designs/${product.designSignature}/logo_v${index + 1}_n${logoIndex + 1}.png`;
            
            if (isCustomMode) {
                // Mode Personnalisé : On affiche uniquement le lien de téléchargement source (sans dimensions)
                return `
                    <li>
                        <span>Logo #${logoIndex + 1} ....</span> 
                        <a href="${logoPath}" target="_blank" title="Voir l'image source originale">
                            (source)
                        </a>
                    </li>`; 
            } else {
                // Autres modes (DTF, UV DTF, Broderie...) : On affiche les dimensions + le lien source
                const dimW = l.width || '0';
                const dimH = l.height || '0';
                return `
                    <li>
                        </span> ${dimW}" x ${dimH}" ....</span>  
                        <a href="${logoPath}" target="_blank" title="Voir l'image source originale">
                            (source)
                        </a>
                    </li>`; 
            }

        }).join('');
        
        return `
            <div class="cart-studio-row" style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center;">
                <div class="cart-preview-item">
                    <img src="${view.previewUrl}" 
                        alt="Aperçu Vue ${index + 1}" 
                        style="width: 100px; height: auto; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;"
                        onclick="openPreviewModal('${view.previewUrl}')">
                </div>
                <div class="cart-logos-info-pale">
                    <p style="font-weight: bold; margin-bottom: 5px;">Vue ${index + 1}</p>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em; line-height: 1.5;">
                        ${logosHtml}
                    </ul>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="cart-studio-summary" style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
            <div class="cart-studio-container">
                ${viewRows}
            </div>
        </div>
    `;
}

async function processPayment(currentButton) {
    if (currentButton) {
        currentButton.disabled = true;
        currentButton.classList.add('loading');
        currentButton.textContent = 'Envoie de la demande...';
    }

    const form = document.querySelector('#paymentForm');
    if (!form) {
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.classList.remove('loading');
            currentButton.textContent = 'Envoyer ma demande';
        }
        return;
    }

    const formData = new FormData(form);
    let cart = JSON.parse(localStorage.getItem('cart/cc') || '[]');

    // Enrichissement du panier avec les données complètes du design (images source)
    cart = cart.map(item => {
        if (item.designSignature && item.designSignature !== 'null') {
            const designData = localStorage.getItem(item.designSignature);
            if (designData) {
                item.fullDesignData = JSON.parse(designData); 
            }
        }
        return item;
    });

    formData.append('products', JSON.stringify(cart));

    try {
        const response = await fetch("./api/POST/initOrder", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // On passe à la passerelle Converge
            // Le loading reste actif pendant que la popup Converge charge
            //pay(data.id, data.variantsToUpdate, data.email);
            localStorage.removeItem("cart/cc");
            window.location.href = 'confirmation?message=' + "Votre demande de soumission a bien été reçue ! Un membre de notre équipe communiquera avec vous rapidement pour vous transmettre la soumission détaillée et l'épreuve visuelle.";
        } else {
            // Erreur serveur (ex: stock épuisé entre-temps)
            if (currentButton) {
                currentButton.classList.remove('loading');
                currentButton.disabled = false;
                currentButton.textContent = 'Envoyer ma demande';
            }
            //window.location.href = '500?message=' + encodeURIComponent(data.message);
        }
    } catch (err) {
        console.error("Erreur lors de initOrder:", err);
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.classList.remove('loading');
            currentButton.textContent = 'Payer';
            addElementAfterElementId('paymentBtn', "Une erreur réseau est survenue.");
        }
    } 
}



function pay(orderId, variantsToUpdate, email) {
            var token = document.getElementById('token').value;
            var card = document.getElementById('card').value;
            var exp = document.getElementById('exp').value;
            var cvv = document.getElementById('cvv').value;
            var gettoken = document.getElementById('gettoken').value;
            var addtoken = document.getElementById('addtoken').value;
            var invoice = orderId;
            var firstname = document.getElementById('fname').value;
            var company = document.getElementById('company').value;
            var lastname = document.getElementById('lname').value;
            var address1 = document.getElementById('address').value;
            var address2 = '';
            var city = document.getElementById('city').value;
            var state = document.getElementById('province').value;
            var zip = document.getElementById('postalCode').value;
            var email = document.getElementById('email').value;
            var phone = document.getElementById('phone').value;
            
            // Les données de carte et d'adresse sont envoyées à Converge Checkout.js (Frontend)
            var paymentData = {
                ssl_txn_auth_token: token,
                ssl_card_number: card,
                ssl_exp_date: exp,
                ssl_get_token: gettoken,
                ssl_add_token: addtoken,
                ssl_invoice_number: invoice,
                ssl_first_name: firstname,
                ssl_last_name: lastname,
                ssl_cvv2cvc2: cvv,
                ssl_avs_address: address1,
                ssl_address2: address2,
                ssl_city: city,
                ssl_state: state,
                ssl_avs_zip: zip,
                ssl_email: email,
                ssl_phone: phone,
            };

            var callback = {
                onError: function (error) {
                    let paymentError = error['errorName'];
                    
                    switch (errorMessage) {
                      case "Credit Card Number Invalid":
                        paymentError = "Le numéro de carte est invalide";
                        break;
                      case "Exp Date Invalid":
                        paymentError = "La date d'expiration n'est pas valide (MMYY)";
                        break;
                      case "Invalid CVV2 Value":
                        paymentError = "Le CVV est invalide";
                        break;
                      default:
                        paymentError = error['errorName'];
                    }
                    
                    updatePaymentStatus(false, orderId, paymentError, variantsToUpdate, email);
                    
                },
                onDeclined: function (response) {
                    let paymentCardCompany = response['ssl_card_short_description'];
                    let paymentCardNumber = response['ssl_card_number'];
                    let paymentId = response['ssl_txn_id'];
                    
                    let paymentError = response['errorName'];
                    
                    switch (paymentError) {
                      case "Credit Card Number Invalid":
                        paymentError = "Le numéro de carte est invalide";
                        break;
                      case "Exp Date Invalid":
                        paymentError = "La date d'expiration n'est pas valide (MMYY)";
                        break;
                      case "Invalid CVV2 Value":
                        paymentError = "Le CVV est invalide";
                        break;
                      default:
                        paymentError = 'Votre carte à été refusée';
                    }
                    
                    updatePaymentStatus(false, orderId, paymentError, variantsToUpdate, email, paymentCardCompany, paymentCardNumber, paymentId);
                },
                onApproval: function (response) {
                    let paymentCardCompany = response['ssl_card_short_description'];
                    let paymentCardNumber = response['ssl_card_number'];
                    let paymentId = response['ssl_txn_id'];
                    updatePaymentStatus(true, orderId, null, variantsToUpdate, email, paymentCardCompany, paymentCardNumber, paymentId);
                }
            };
            
            ConvergeEmbeddedPayment.pay(paymentData, callback);
            return false;
        }

function updatePaymentStatus(success, orderId, paymentError, variantsToUpdate, email, paymentCardCompany, paymentCardNumber, paymentId) {
    const formData = new FormData();
    formData.append('success', success ? 1 : 0);
    formData.append('paymentError', paymentError || null);
    formData.append('paymentCardCompany', paymentCardCompany || null);
    formData.append('paymentId', paymentId || null);
    formData.append('paymentCardNumber', paymentCardNumber || null);
    formData.append('id', orderId);
    formData.append('variantsToUpdate', JSON.stringify(variantsToUpdate));
    formData.append('email', email);

    return fetch("./api/UPDATE/paymentStatus", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Succès total : on vide le panier et on redirige
            localStorage.removeItem("cart/cc");
            window.location.href = 'confirmation?message=' + encodeURIComponent(data.message);
        } else {
            // Le paiement a échoué (ou le serveur a refusé la mise à jour)
            // On retire le loading pour permettre une nouvelle tentative
            const payBtn = document.getElementById('paymentBtn');
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.classList.remove('loading');
                payBtn.textContent = 'Payer';
            }
            
            // On régénère un token Converge car l'ancien est souvent expiré ou lié à l'échec
            initiateCheckoutJS();
            addElementAfterElementId('paymentBtn', data.message); 
        }
    })
    .catch(err => {
        console.error("Erreur critique updatePaymentStatus:", err);
        const payBtn = document.getElementById('paymentBtn');
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.classList.remove('loading');
            payBtn.textContent = 'Payer';
        }
    });
}

/*function initiateCheckoutJS() {
    var tokenRequest = {
        ssl_amount: ssl_amount,
        ssl_first_name: document.getElementById('fname').value,
        ssl_last_name: document.getElementById('lname').value,
        ssl_email: document.getElementById('email').value,
        ssl_phone: document.getElementById('phone').value,
    };

    $.post("./api/createTokenForPayment", tokenRequest, function (data) {

        if (data && data.success === true) {
            const receivedToken = data.token;

            document.getElementById('token').value = receivedToken;
            transactionToken = receivedToken;
            nextStep(2);

        } else {
            const errorMessage = data.message || "Erreur inconnue lors de la génération du jeton.";
            // Redirection vers la page 500 avec le message d'erreur
            window.location.href = `500?message=${encodeURIComponent(errorMessage)}`;
        }

        

    }, 'json')
    .fail(function(jqXHR, textStatus, errorThrown) {
        // Gérer les erreurs de communication (404, 500)
        let failMessage = "Problème de communication avec le serveur (erreur réseau ou HTTP).";
        
        // Si le serveur a renvoyé un corps de réponse qui pourrait être utile
        if (jqXHR.responseText) {
            try {
                // Tenter de parser le JSON si le serveur a tenté d'envoyer un message structuré
                const errorData = JSON.parse(jqXHR.responseText);
                if (errorData.message) {
                    failMessage = errorData.message;
                }
            } catch (e) {
                // Si ce n'est pas du JSON, utiliser un message générique ou le statut HTTP
                failMessage = `Erreur AJAX ${jqXHR.status}: ${errorThrown}`;
            }
        }
        
        // Redirection vers la page 500 avec le message d'erreur de la requête échouée
        window.location.href = `500?message=${encodeURIComponent(failMessage)}`;
    });
}

*/

function nextStep(value){
    let toHide = document.querySelectorAll('.to-hide-in-next-step-' + value);
    let toShow = document.querySelectorAll('.to-show-in-next-step-'+ (parseInt(value) + 1));

    
    toHide.forEach(element => {
        element.style.display = 'none';
    });

    toShow.forEach(element => {
        element.style.display = ' block';
    });

}

function prevStep(value){
    let toHide = document.querySelectorAll('.to-hide-in-next-step-' + value);
    let toShow = document.querySelectorAll('.to-show-in-next-step-'+ (parseInt(value) + 1));
    let prevBtn = document.querySelector('#button-step-'+ parseInt(value));


    toHide.forEach(element => {
        element.style.display = 'block';
    });

    toShow.forEach(element => {
        element.style.display = ' none';
    });

    if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.textContent = 'Continuer';
    }
}





function scrollToFirstError() {
    // Cibler le premier conteneur d'erreur générale ou spécifique
    const firstError = document.querySelector('.cartErrorMessage.addedErrors, .cart-product-container.has-error');
    
    if (firstError) {
        firstError.scrollIntoView({
            behavior: 'smooth', // Pour une animation de défilement douce
            block: 'start'      // Défilement jusqu'au haut de l'élément
        });
    }

    window.scrollBy(0, -150); 
}



/**
 * Ouvre la modale et affiche l'image en grand
 * @param {string} src - La source de l'image (DataURL)
 */
function openPreviewModal(src) {
    // Vérifier si la modale existe déjà, sinon on la crée dynamiquement
    let modal = document.getElementById('previewModal');
    
    if (!modal) {
        createPreviewModalMarkup();
        modal = document.getElementById('previewModal');
    }

    const modalImg = document.getElementById('modalImage');
    modalImg.src = src;
    modal.style.display = "flex";
    
    // Empêcher le défilement de la page en arrière-plan
    document.body.style.overflow = "hidden";
}

/**
 * Ferme la modale d'aperçu
 */
function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/**
 * Crée le HTML de la modale s'il n'existe pas dans la page
 */
function createPreviewModalMarkup() {
    const modalHtml = `
        <div id="previewModal" class="preview-modal" onclick="closePreviewModal()">
            <span class="close-modal">&times;</span>
            <img class="modal-content" id="modalImage">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}


