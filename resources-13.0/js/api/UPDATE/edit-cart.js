

function hideEditProductCart(pid, color, personalizationValue, personalizationPrice) {
    const containerSelector = `.cart-product-container[data-pid='${pid}'][data-color='${color}'][data-personalization-value='${personalizationValue}'][data-personalization-price='${personalizationPrice}']`;
    let cartProductContainer = document.querySelector(containerSelector);

    if (cartProductContainer) {
        const errorMessage = cartProductContainer.querySelector('.product-error-message');
        
        if (errorMessage) {
            errorMessage.remove();
        }

        cartProductContainer.classList.remove('has-error');
        cartProductContainer.classList.remove('active');
    }
}


function editProductCart(pid, color, personalizationValue, personalizationPrice, designSignature) {
    let cart = localStorage.getItem("cart/cc");
    let products = cart ? JSON.parse(cart) : [];

    // 1. Normalisation de la signature pour le sélecteur DOM
    const cleanSig = (designSignature === 'null' || !designSignature || designSignature === null) ? 'null' : designSignature;
    
    // 2. Ciblage du conteneur
    let containerSelector = `.cart-product-container[data-pid='${pid}'][data-color='${color}'][data-design-signature='${cleanSig}']`;
    let cartProductContainer = document.querySelector(containerSelector);

    // 3. Recherche du produit dans le JSON (Comparaison flexible)
    const cartProduct = products.find(p => {
        const matchId = String(p.id) === String(pid);
        const matchColor = p.color === color;
        const pSig = (!p.designSignature || p.designSignature === 'null') ? 'null' : p.designSignature;
        return matchId && matchColor && pSig === cleanSig;
    });

    if (cartProductContainer && cartProduct) {
        // Sauvegarde de l'aperçu (si existant)
        const existingStudio = cartProductContainer.querySelector('.cart-studio-summary');
        const studioHtmlToPreserve = existingStudio ? existingStudio.outerHTML : '';

        // Structure du Header
        const headerHtml = `
            <div id="firstColumnProductSize" style="display:none;">
                <input class='hide' readonly><span class='hide'>x</span>
                <span class="col-head"></span>
                <span class="col-head"></span>
                <span class="col-head"></span>
                <span class="col-head"></span>
                <span class="col-head"></span>
            </div>
        `;

        // Génération des lignes de tailles
        const sizesHtml = cartProduct.availableSizes.map((size) => {
            const currentItem = cartProduct.sizes.find((s) => s.size === size.size);
            const currentQte = currentItem ? currentItem.qte : "";
            const rawPrice = parseFloat(size.rawPrice) || 0;

            return `
                <div class="variantDiv" 
                     data-raw-price="${rawPrice}" 
                     data-size-name="${size.size}" 
                     data-size-variant-id="${size.variantId}">
                    <input type="number" min="0" value="${currentQte}" inputmode="tel" placeholder="0"
                           oninput="updateCartLivePrice('${cartProduct.sku}')">
                    <span class='sizeName'>${size.size}</span>
                </div>
            `;
        }).join("");

        // On nettoie le conteneur pour injecter la grille
        const summary = cartProductContainer.querySelector('summary');
        cartProductContainer.innerHTML = '';
        cartProductContainer.appendChild(summary);

        const sigParam = (cleanSig !== 'null') ? `'${cleanSig}'` : 'null';

        cartProductContainer.innerHTML += `
            <div class="editableSizesContainer inEdit" style="display:flex; flex-direction:column;"> 
                ${studioHtmlToPreserve} 
                <div class="product-sizes" style="display:flex;">
                    ${headerHtml}
                    ${sizesHtml}
                    
                </div>
                ${(personalizationValue && personalizationValue !== 'Aucune personnalisation') ? `<span class="edit-subtitle"><strong>Option(s)</strong> : ${personalizationValue}</span>` : ''}
                <div class="update-cart-container">
                    <button onclick="updateProductCart('${pid}', '${color}', '${personalizationValue}', '${personalizationPrice}', ${sigParam})">Mettre à jour le panier</button> 
                    <button class="secondary" onclick="window.location.reload();">Annuler</button> 
                </div>
            </div>
        `;

        // Lancer le calcul immédiat (Important: s'assurer que updateCartLivePrice gère le cas sans studioData)
        updateCartLivePrice(cartProduct.sku);
    }
}
// --------------------------------------------------------------------------------------
// FONCTION D'AGRÉGATION (utilisée avant l'appel API)
// --------------------------------------------------------------------------------------
/**
 * Met à jour un produit dans le panier et déclenche la validation serveur
 */
function updateProductCart(pid, color, personalizationValue, personalizationPrice, designSignature) {
    // 1. Nettoyer les messages d'erreur existants
    document.querySelectorAll(".product-error-message").forEach((el) => el.remove());

    let cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    
    // 2. Trouver l'index du produit (comparaison flexible pour la signature)
    const cartItemIndex = cart.findIndex(item => 
        String(item.id) === String(pid) && 
        item.color === color && 
        (item.designSignature === designSignature || (!item.designSignature && (!designSignature || designSignature === 'null')))
    );

    if (cartItemIndex === -1) {
        console.error("Produit non trouvé.");
        return;
    }

    // 3. Cibler le conteneur d'édition
    const cleanSig = (designSignature === 'null' || !designSignature) ? 'null' : designSignature;
    const containerSelector = `.cart-product-container[data-pid='${pid}'][data-color='${color}'][data-design-signature='${cleanSig}']`;
    const cartProductContainer = document.querySelector(containerSelector);

    if (!cartProductContainer) return;

    // 4. Récupérer les nouvelles quantités depuis la grille
    let newSelectedSizes = [];
    const sizeRows = cartProductContainer.querySelectorAll(".variantDiv");

    sizeRows.forEach((row) => {
        const qte = parseInt(row.querySelector("input").value) || 0;
        const sizeName = row.getAttribute("data-size-name");
        const sizeVariantId = row.getAttribute("data-size-variant-id");
        const rawPrice = parseFloat(row.getAttribute("data-raw-price")); // Spécifique à la taille

        if (qte > 0) {
            newSelectedSizes.push({
                size: sizeName,
                qte: qte,
                variantId: sizeVariantId,
                rawPrice: rawPrice,
                price: 0 // Sera recalculé par getCart au reload
            });
        }
    });

    // 5. Mise à jour ou suppression
    if (newSelectedSizes.length === 0) {
        if(confirm("Voulez-vous retirer cet article du panier ?")) {
            cart.splice(cartItemIndex, 1);
        } else {
            return;
        }
    } else {
        cart[cartItemIndex].sizes = newSelectedSizes;
    }

    cart.forEach(item => {
        item.sizes.forEach(sizeObj => {
            // On utilise la même logique de calcul que pour l'affichage (calculateCartPriceLogic)
            // On simule un item contenant uniquement cette taille pour avoir le prix unitaire spécifique
            const tempItem = { ...item, sizes: [sizeObj] };
            const unitPrice = calculateCartPriceLogic(tempItem, cart);
            
            // On assigne le prix calculé (le PHP comparera cette valeur)
            sizeObj.price = parseFloat(unitPrice.toFixed(2)); 
        });
    });

    // 6. Validation via l'API avant de sauvegarder
    const productsForValidation = aggregateCartForValidation(cart);
    
    fetch("api/VALIDATE/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsForValidation }),
    })
    .then((r) => r.json())
    .then((data) => {
        if (data && data.success) {
            // SAUVEGARDE DANS LE LOCALSTORAGE
            localStorage.setItem("cart/cc", JSON.stringify(cart));
            
            // RECHARGEMENT DE LA PAGE
            // Cela va relancer getCart() qui utilisera calculateCartPriceLogic pour tout recalculer
            location.reload(); 
        } else if (data && data.invalid_products) {
            // Affichage des erreurs (ex: rupture de stock)
            data.invalid_products.forEach((errorInfo) => {
                const target = cartProductContainer.querySelector(".editableSizesContainer");
                if (target) {
                    target.insertAdjacentHTML("beforeend", 
                        `<div class="product-error-message"><p class="error-text">${errorInfo.reason}</p></div>`
                    );
                }
            });
        }
    })
    .catch(err => console.error("Erreur de communication API :", err));
}

/**
 * Agrège le panier par Signature pour permettre au serveur de valider chaque design
 */
function aggregateCartForValidation(products) {
    const aggregatedProductsMap = new Map();

    products.forEach(product => {
        // Clé unique combinant ID, Couleur et Signature du design
        const key = `${product.id}-${product.color}-${product.designSignature}`; 

        if (!aggregatedProductsMap.has(key)) {
            aggregatedProductsMap.set(key, { ...product, sizes: [] });
        }

        const aggregatedProduct = aggregatedProductsMap.get(key);
        
        product.sizes.forEach(currentSize => {
            const existing = aggregatedProduct.sizes.find(s => s.size === currentSize.size);
            if (existing) {
                existing.qte += currentSize.qte;
            } else {
                aggregatedProduct.sizes.push({ ...currentSize });
            }
        });
    });

    return Array.from(aggregatedProductsMap.values());
}
// NOUVEAU: Suppression par ID et COULEUR
async function deleteProductCart(pid, color, personalizationValue, personalizationPrice, designSignature) {
    let cart = localStorage.getItem("cart/cc");
    if (cart) {
        let products = JSON.parse(cart);
        
        const cartItemIndex = products.findIndex((item) => 
            item.id == pid && 
            item.color === color && 
            (item.designSignature == designSignature || (!item.designSignature && (!designSignature || designSignature === 'null')))
        );

        if (cartItemIndex !== -1) {
            const itemToDelete = products[cartItemIndex];
            const signature = itemToDelete.designSignature;

            if (signature && signature !== 'null') {
                // 1. Nettoyage LocalStorage
                localStorage.removeItem(signature);
                
                // 2. Nettoyage Serveur (Appel API)
                try {
                    await fetch('api/POST/deleteTemporaryDesign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ signature: signature })
                    });
                    console.log(`Fichiers serveur supprimés pour : ${signature}`);
                } catch (error) {
                    console.error("Erreur lors de la suppression serveur:", error);
                }
            }

            // 3. Suppression du panier et rechargement
            products.splice(cartItemIndex, 1);
            localStorage.setItem("cart/cc", JSON.stringify(products));
            location.reload();
        } else {
            alert("Erreur : Article non trouvé dans le panier.");
        }
    }
}


function toggleDetails(event) {
    let container = event.target.closest('.cart-product-container');
    let details = container.querySelector('.editableSizesContainer');
    if (details.style.display === 'none' || details.style.display === '' || details.style.display === null) {
        details.style.display = 'flex';
        container.classList.add('active');
    }else{
        details.style.display = 'none';
        container.classList.remove('active');
    }
}





function updateCartLivePrice(sku) {
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    
    document.querySelectorAll(`.cart-product-container[data-sku="${sku}"] .inEdit`).forEach(editContainer => {
        const container = editContainer.closest('.cart-product-container');
        const pid = container.getAttribute('data-pid');
        const color = container.getAttribute('data-color');
        const signature = container.getAttribute('data-design-signature');
        const cleanSig = (signature === 'null' || !signature) ? null : signature;

        // 1. Créer le panier de simulation
        let tempCart = JSON.parse(JSON.stringify(cart));
        
        let tempItem = tempCart.find(p => {
            const matchId = String(p.id) === String(pid);
            const matchColor = p.color === color;
            const pSig = (!p.designSignature || p.designSignature === 'null') ? null : p.designSignature;
            return matchId && matchColor && pSig === cleanSig;
        });

        if (!tempItem) return; 

        // 2. Calcul des quantités Live pour le surlignage
        let totalQtyLive = 0;
        const otherItemsSameSku = tempCart.filter(p => p.sku === sku && p !== tempItem);
        totalQtyLive += otherItemsSameSku.reduce((sum, item) => sum + item.sizes.reduce((s, sz) => s + sz.qte, 0), 0);

        const currentInputs = Array.from(editContainer.querySelectorAll('.variantDiv')).map(row => ({
            size: row.getAttribute('data-size-name'),
            qte: parseInt(row.querySelector('input').value) || 0,
            rawPrice: parseFloat(row.getAttribute('data-raw-price'))
        }));
        totalQtyLive += currentInputs.reduce((sum, s) => sum + s.qte, 0);

        // FORCE LE TYPE NUMBER pour éviter les doublons comme "50" vs 50
        const currentTotal = parseInt(totalQtyLive > 0 ? totalQtyLive : 1);

        // Configuration des paliers
        let fixedTiers = [1, 4, 26, 50];
        let displayTiers = [...fixedTiers];
        
        // On ajoute la colonne dynamique seulement si elle n'est pas déjà dans les paliers fixes
        if (!displayTiers.includes(currentTotal)) {
            displayTiers.push(currentTotal);
        }
        displayTiers.sort((a, b) => a - b);

        // 3. Mise à jour du Header
        const headerSpans = editContainer.querySelectorAll('.col-head');
        headerSpans.forEach((span, i) => {
            const qty = displayTiers[i];
            if (qty !== undefined) {
                span.style.display = "inline-block";
                span.textContent = qty;
                span.classList.toggle('showedPrice', qty === currentTotal);
            } else {
                // Cache le 5ème span si on n'a que 4 paliers (ex: si currentTotal est 50)
                span.style.display = "none";
            }
        });

        // 4. Mise à jour des Prix dans la grille
        editContainer.querySelectorAll('.variantDiv').forEach(row => {
            const sizeName = row.getAttribute('data-size-name');
            const rowRawPrice = parseFloat(row.getAttribute('data-raw-price'));
            const priceSpans = row.querySelectorAll('.col-price');

            priceSpans.forEach((span, idx) => {
                const qtyTier = displayTiers[idx];
                
                if (qtyTier !== undefined) {
                    span.style.display = "inline-block";
                    
                    // Simulation pour chaque colonne
                    let simCart = JSON.parse(JSON.stringify(tempCart));
                    let simItem = simCart.find(p => String(p.id) === String(pid) && p.color === color);
                    
                    if (simItem) {
                        simItem.sizes = [{ size: sizeName, qte: qtyTier, rawPrice: rowRawPrice }];
                    }

                    const price = calculateCartPriceLogic(simItem, simCart);
                    
                    span.textContent = price.toFixed(2) + " $";
                    span.classList.toggle('showedPrice', qtyTier === currentTotal);
                } else {
                    // Cache la cellule si pas de palier correspondant
                    span.style.display = "none";
                }
            });
        });
    });
}
/**
 * Parcourt le panier fourni et met à jour la propriété .price de chaque taille 
 * basé sur la quantité totale accumulée pour le même SKU.
 */
/**
 * Met à jour le prix de chaque taille dans le panier sans inclure les frais de décoration.
 * Le prix est basé uniquement sur la quantité totale accumulée pour le même SKU.
 */
function recalculateCartPrices(cart) {
    cart.forEach(item => {
        const isDTF = item.studioData && item.studioData.selectedPersonalizationOption === "DTF";
        
        if (isDTF) {
            const unitPrice = calculateGlobalDtfPrice(item, cart);
            item.sizes.forEach(size => {
                size.price = unitPrice;
            });
        } else {
            // Logique standard par paliers
            let totalSkuQty = cart.filter(i => i.sku === item.sku).reduce((sum, i) => sum + i.sizes.reduce((s, sz) => s + sz.qte, 0), 0);
            let tier = totalSkuQty >= 50 ? 50 : (totalSkuQty >= 26 ? 26 : (totalSkuQty >= 4 ? 4 : 1));
            
            item.sizes.forEach(size => {
                size.price = parseFloat(size.prices[tier]);
            });
        }
    });
}
