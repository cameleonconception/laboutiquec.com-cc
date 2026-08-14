let imagesToDelete = []; 
let existingImageNames = []; // Tableau qui conserve la liste officielle des images existantes du produit

// --- ÉCOUTEURS ET INITIALISATION ---
document.addEventListener('DOMContentLoaded', function() {
    const delBtn = document.querySelector('#deleteProduct');
    if (delBtn) {
        delBtn.onclick = deleteProduct;
    }
});

function deleteProduct() {
    if (!product || !product.id) {
        alert("Erreur: Les données du produit ne sont pas chargées.");
        return;
    }

    const confirmation = confirm(`Êtes-vous sûr de vouloir supprimer le produit ?`);
    if (!confirmation) return;

    const formData = new FormData();
    formData.append('id', product.id);
    formData.append('sku', product.sku);

    fetch("../api/superAdmin/DELETE/product", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Produit supprimé avec succès.");
            window.location.href = './../produits';
        } else {
            alert("Erreur : " + data.message);
        }
    })
    .catch(error => console.error('Erreur:', error));
}

function decodeBase64UTF8(base64String) {
    if (!base64String) return ""; 
    try {
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        return base64String; 
    }
}

// --- CHARGEMENT DU PRODUIT ---
window.addEventListener('productLoaded', function(e) {
    let superAdminCategoriesList = document.querySelector('#categories-list');
    let superAdminColorsList = document.querySelector('#colors-list');
    let superAdminSizesList = document.querySelector('#sizes-list');
    
    let data = e.detail;

    if (data.allSizes && superAdminSizesList) {
        data.allSizes.forEach(size => {
            superAdminSizesList.innerHTML += '<option value="' + size['name'] + '">';
        });
    }

    if (data.allColors && superAdminColorsList) {
        data.allColors.forEach(color => {
            superAdminColorsList.innerHTML += '<option value="' + color['name'] + '">';
        });
    }

    if (data.allCategories && superAdminCategoriesList) {
        data.allCategories.forEach(categorie => {
            superAdminCategoriesList.innerHTML += '<option value="' + categorie['name'] + '">';
        });
    }
    
    let form = document.querySelector('#superAdmin-newProductForm');
    let product = e.detail.productDetails;

    // Récupération sécurisée du tableau imgNames depuis la base de données
    existingImageNames = product.imgNames || [];
    if (typeof existingImageNames === 'string') {
        try { existingImageNames = JSON.parse(existingImageNames); } catch (err) { existingImageNames = []; }
    }

    // --- REMPLISSAGE DES CHAMPS TEXTES ---
    form.querySelector('input#name').value = product.name || '';
    form.querySelector('input#sku').value = product.sku || '';
    form.querySelector('textarea#description').value = decodeBase64UTF8(product.description);
    form.querySelector('textarea#personalization').value = product.personalization || '';
    form.querySelector('textarea#embroideryDetails').value = decodeBase64UTF8(product.embroideryDetails);
    form.querySelector('textarea#blankDetails').value = decodeBase64UTF8(product.blankDetails);
    form.querySelector('textarea#customPersonalizationDetails').value = decodeBase64UTF8(product.customPersonalizationDetails);
    form.querySelector('textarea#tampographieDetails').value = decodeBase64UTF8(product.tampographieDetails);
    form.querySelector('textarea#screenPrintDetails').value = decodeBase64UTF8(product.screenPrintDetails);
    form.querySelector('textarea#vividPrintDetails').value = decodeBase64UTF8(product.vividPrintDetails);
    form.querySelector('textarea#engravingDetails').value = decodeBase64UTF8(product.engravingDetails);
    form.querySelector('textarea#patchDetails').value = decodeBase64UTF8(product.patchDetails);
    form.querySelector('input#zoom').value = product.zoom || 1;

    // --- CATÉGORIES ET VARIANTES ---
    if (product.categories) {
        product.categories.forEach(category => addNewCategory(category));
    }

    if (product.variants) {
        Object.keys(product.variants).forEach(colorName => {
            product.variants[colorName].forEach(variant => {
                addVariantRow({
                    size: variant.size,
                    color: colorName,
                    price: variant.price,
                    stock: variant.stock,
                });
            });
        });
    }

    // Fournisseur
    let supplierSelect = document.querySelector('#supplier');
    if (data.allSuppliers && supplierSelect) {
        data.allSuppliers.forEach(supplier => {
            const isSelected = product.supplierId == supplier.id ? 'selected' : '';
            supplierSelect.innerHTML += `<option value="${supplier.id}" ${isSelected}>${supplier.name}</option>`;
        });
    }

    // --- GESTION DES SWITCHES ---
    const bindSwitch = (name, showFn) => {
        let input = form.querySelector(`.switch input[name="${name}"]`);
        if (input) {
            input.checked = parseInt(product[name]) === 1;
            if (showFn) {
                showFn(input.checked);
                input.addEventListener('change', function() { showFn(this.checked); });
            }
        }
    };

    bindSwitch('active');
    bindSwitch('blank', showBlankDetails);
    bindSwitch('customPersonalization', showCustomPersonalizationDetails);
    bindSwitch('dtf');
    bindSwitch('broderie', showEmbroideryDetails);
    bindSwitch('tampographie', showTampographieDetails);
    bindSwitch('vividPrint', showVividPrintDetails);
    bindSwitch('screenPrint', showScreenPrintDetails);
    bindSwitch('engraving', showEngravingDetails);
    bindSwitch('patch', showPatchDetails);
    bindSwitch('uvdtf');

    // Img input : attachement de l'événement au changement
    const imgInput = document.querySelector('#img');
    if (imgInput) {
        imgInput.onchange = function() { previewSelectedImages(this); };
    }

    displayExistingImages(form, product.sku);
    displayExistingTechnicalFile(product.sku);
    
    checkContainers();
    const varSearch = document.getElementById('variant-search');
    if (varSearch) {
        varSearch.value = '';
        filterVariants();
    }
});

// --- FONCTIONS DE VISIBILITÉ DES DÉTAILS ---
function toggleDisplay(selector, status) {
    const el = document.querySelector(selector);
    if (el) el.style.display = status ? "block" : "none";
}

function showCustomPersonalizationDetails(status) {
    toggleDisplay('#customPersonalizationDetailsLabel', status);
    toggleDisplay('#customPersonalizationDetails', status);
}

function showBlankDetails(status) {
    toggleDisplay('#blankDetailsLabel', status);
    toggleDisplay('#blankDetails', status);
}

function showEmbroideryDetails(status) {
    toggleDisplay('#embroideryDetailsLabel', status);
    toggleDisplay('#embroideryDetails', status);
}

function showTampographieDetails(status) {
    toggleDisplay('#tampographieDetailsLabel', status);
    toggleDisplay('#tampographieDetails', status);
}

function showVividPrintDetails(status) {
    toggleDisplay('#vividPrintDetailsLabel', status);
    toggleDisplay('#vividPrintDetails', status);
}

function showEngravingDetails(status) {
    toggleDisplay('#engravingDetailsLabel', status);
    toggleDisplay('#engravingDetails', status);
}

function showPatchDetails(status) {
    toggleDisplay('#patchDetailsLabel', status);
    toggleDisplay('#patchDetails', status);
}

function showScreenPrintDetails(status) {
    toggleDisplay('#screenPrintDetailsLabel', status);
    toggleDisplay('#screenPrintDetails', status);
}

// --- FONCTIONS GLOBALES (EXPOSITION À WINDOW) ---
window.toggleNewProductForm = function() {
    let screen = document.querySelector(".fullBlurBg");
    let addBtnImg = document.querySelector("#superAdmin-editProductBtn img");

    if (!screen) {
        console.error("Le formulaire (fullBlurBg) est introuvable dans le DOM.");
        return;
    }

    if (screen.style.display === 'none' || screen.style.display === '') {
        screen.style.display = 'flex';
        if (addBtnImg) addBtnImg.src = '../static-resources/default/icons/black/x.png';
    } else {
        screen.style.display = 'none';
        if (addBtnImg) addBtnImg.src = '../static-resources/default/icons/black/filter-2.png';
    }
};

/**
 * Affiche la liste des images déjà présentes en base de données.
 */
/**
 * Affiche la liste des images déjà présentes sur le serveur
 */
function displayExistingImages(form, sku) {
    const imgInput = form.querySelector('#img');
    if (!imgInput) return;

    let previewContainer = document.querySelector('#existing-images-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'existing-images-preview';
        previewContainer.style.cssText = "display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;";
        imgInput.after(previewContainer);
    }
    previewContainer.innerHTML = ''; 

    const cacheBuster = new Date().getTime();

    // On parcourt les images récupérées de la base de données
    existingImageNames.forEach(imageName => {
        const cleanPath = `../static-resources/products/${sku}/${imageName}`;
        const imgSrcWithCache = `${cleanPath}?v=${cacheBuster}`;

        // Wrapper pour chaque miniature
        const wrapper = document.createElement('div');
        wrapper.className = 'existing-image-item';
        wrapper.setAttribute('data-filename', imageName); // On stocke le nom du fichier ici
        wrapper.style.cssText = "position:relative; display:inline-block; width:80px;";

        wrapper.innerHTML = `
            <img src="${imgSrcWithCache}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:1px solid #ccc; position:relative;" title="${imageName}">
            <button type="button" class="deleteImgBtn" onclick="deleteServerImage('${cleanPath}', this)" style="position:absolute;top:0;right:0; height:25px; width:25px; margin:0;padding:0;">×</button>
        `;

        previewContainer.appendChild(wrapper);
    });
}

/**
 * Supprime visuellement la miniature et enregistre son chemin pour suppression physique
 */
function deleteServerImage(imagePath, btnElement) {
    if (confirm("Voulez-vous vraiment supprimer cette image ?")) {
        // Ajouter le chemin à la liste des fichiers à supprimer sur le serveur
        imagesToDelete.push(imagePath);

        // Retirer l'élément HTML de l'écran
        if (btnElement && btnElement.closest('.existing-image-item')) {
            btnElement.closest('.existing-image-item').remove();
        }
    }
}

/**
 * Renomme automatiquement les fichiers ajoutés en leur insérant un timestamp
 * et génère la prévisualisation visuelle.
 */
function previewSelectedImages(input) {
    let previewContainer = document.querySelector('#new-images-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'new-images-preview';
        previewContainer.style.cssText = "display:flex; gap:12px; flex-wrap:wrap; border:1px dashed #ccc; padding:5px;";
        input.after(previewContainer);
    }

    previewContainer.innerHTML = ''; 

    if (input.files && input.files.length > 0) {
        const dataTransfer = new DataTransfer();
        const now = Date.now(); // Timestamp de base

        Array.from(input.files).forEach((file, index) => {
            let newFileName = file.name;

            // Découpage du nom et de l'extension
            const lastDotIndex = file.name.lastIndexOf('.');
            const nameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
            const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';

            // Si le fichier n'a pas encore de timestamp à la fin, on lui en ajoute un unique
            const parts = nameWithoutExt.split('-');
            const hasTimestamp = parts.length >= 3 && !isNaN(parts[parts.length - 1]);

            if (!hasTimestamp) {
                // Ex: Blanc-1.webp devient Blanc-1-1711900000001.webp
                newFileName = `${nameWithoutExt}-${now + index}${ext}`;
            }

            // Création du nouveau fichier renommé
            const renamedFile = new File([file], newFileName, { type: file.type });
            dataTransfer.items.add(renamedFile);

            // Prévisualisation graphique
            const reader = new FileReader();
            reader.onload = function(e) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = "width:80px; text-align:center;";
                wrapper.innerHTML = `
                    <img src="${e.target.result}" title="${renamedFile.name}" 
                         style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:2px solid #4CAF50;">
                    <span style="font-size:10px; word-break:break-all; display:block;">${renamedFile.name}</span>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(renamedFile);
        });

        // Remplacement des fichiers de l'input par les fichiers renommés
        input.files = dataTransfer.files;
    }
}

function addVariantRow(AutoAdd = null, targetRow = null) {
    removeErrorMessage();
    
    let values = {};
    const sizeInp = document.querySelector('#size');
    const colorInp = document.querySelector('#color');
    const priceInp = document.querySelector('#price');
    const stockInp = document.querySelector('#stock');
    const tableBody = document.querySelector('#variants-body');

    if (!tableBody) return;

    if (AutoAdd) {
        values = {
            size: String(AutoAdd.size).trim(),
            color: String(AutoAdd.color).trim(),
            price: String(AutoAdd.price).trim(),
            stock: String(AutoAdd.stock).trim(),
        };
    } else {
        values = {
            size: sizeInp ? sizeInp.value.trim() : '',
            color: colorInp ? colorInp.value.trim() : '',
            price: priceInp ? priceInp.value.trim() : '',
            stock: stockInp ? stockInp.value.trim() : ''
        };
    }

    if ([values.size, values.color, values.price, values.stock].some(val => val === "")) {
        if (!AutoAdd) {
            addElementAfterElementId('new-variant-div', 'Veuillez remplir Taille, Couleur, Prix et Stock.');
        }
        return; 
    }

    const row = document.createElement('tr');
    renderRowContent(row, values);

    // Insertion au-dessus de la ligne cible si elle existe, sinon à la fin du tableau
    if (targetRow && targetRow.parentNode === tableBody) {
        tableBody.insertBefore(row, targetRow);
    } else {
        tableBody.appendChild(row);
    }

    // ANIMATION : Couleur temporaire de 2 secondes
    row.style.transition = 'background-color 0.5s ease';
    row.style.backgroundColor = 'var(--light-light-accent-color)';
    setTimeout(() => {
        row.style.backgroundColor = '';
    }, 2000);

    if (!AutoAdd && sizeInp) {
        [sizeInp, colorInp, priceInp, stockInp].forEach(inp => { if (inp) inp.value = ''; });
        sizeInp.focus();
    }
    checkContainers();
    return row;
}

function renderRowContent(row, data) {
    let cleanPrice = String(data.price).replace('$', '').trim();
    let numericPrice = parseFloat(cleanPrice);

    row.dataset.basePrice = isNaN(numericPrice) ? "0.00" : numericPrice.toFixed(2);

    row.innerHTML = `
    <td style="text-align: center;">
        <input type="checkbox" class="variant-checkbox">
    </td>
    <td>
        <div class="actions-wrapper">
            <button type="button" class="copyBtn" title="Dupliquer"><img class='icons' src='../static-resources/default/icons/white/copy.png'></button>
            <button type="button" class="editBtn"><img class='icons' src='../static-resources/default/icons/white/filter-2.png'></button>
            <button type="button" class="deleteVariantBtn"><img class='icons' src='../static-resources/default/icons/white/x.png'></button>
        </div>
    </td>
    <td class="col-size">${data.size}</td>
    <td class="col-color">${data.color}</td>
    <td class="col-price-base">${!isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'}$</td>
    <td class="col-stock">${data.stock}</td>
    `;

    // Empêcher la propagation du clic sur la checkbox
    const checkbox = row.querySelector('.variant-checkbox');
    if (checkbox) {
        checkbox.onclick = (e) => e.stopPropagation();
    }

    // GESTION INTELLIGENTE DU BOUTON COPIER
    row.querySelector('.copyBtn').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        const selectedRows = getSelectedVariantRows();
        
        if (selectedRows.length > 1) {
            bulkDuplicateVariants();
        } else {
            duplicateVariant(data, row);
        }
    };

    // GESTION INTELLIGENTE DU BOUTON SUPPRIMER
    row.querySelector('.deleteVariantBtn').onclick = (e) => {
        e.stopPropagation();
        
        const selectedRows = getSelectedVariantRows();
        
        if (selectedRows.length > 1) {
            bulkDeleteVariants();
        } else {
            if (confirm(`Voulez-vous vraiment supprimer cette variante ?`)) {
                row.remove();
                checkContainers();
            }
        }
    };

const editAction = (e) => {
        if (e) e.stopPropagation();
        const selectedRows = getSelectedVariantRows();
        
        // Si plus d'une ligne est cochée, on passe toute la sélection en mode édition
        if (selectedRows.length > 1) {
            bulkEditVariants();
        } else {
            makeRowEditable(row, data);
        }
    };

    row.querySelector('.editBtn').onclick = editAction;
    row.ondblclick = editAction;
}

function makeRowEditable(row, oldData, groupEditContext = null) {
    row.innerHTML = `
    <td style="text-align: center;">
        <input type="checkbox" disabled>
    </td>
    <td>
        <div class="actions-wrapper">
            <button type="button" class="saveBtn"><img class='icons' src='../static-resources/default/icons/white/checkmark.png'></button>
            <button type="button" class="cancelBtn"><img class='icons' src='../static-resources/default/icons/white/x.png'></button>
        </div>
    </td>
    <td><input type="text" placeholder="M" list="sizes-list" value="${oldData.size}" class="edit-size" style="width:70px"></td>
    <td><input type="text" placeholder="Bleu" list="colors-list" value="${oldData.color}" class="edit-color" style="width:100px"></td>
    <td><input type="number" placeholder="0.00" step="0.01" value="${oldData.price}" class="edit-price" style="width:70px"></td>
    <td><input type="text" placeholder="-" value="${oldData.stock}" class="edit-stock" style="width:60px"></td>
    `;

    row.querySelector('.saveBtn').onclick = (e) => {
        e.stopPropagation();
        
        // Si on est dans un contexte d'édition groupée, on sauvegarde tout le groupe
        if (groupEditContext) {
            groupEditContext.saveAll();
        } else {
            const newData = {
                size: row.querySelector('.edit-size').value.trim(),
                color: row.querySelector('.edit-color').value.trim(),
                price: row.querySelector('.edit-price').value.trim(),
                stock: row.querySelector('.edit-stock').value.trim(),
            };

            if (!newData.size || !newData.color || !newData.price) {
                alert("Veuillez remplir au moins la taille, la couleur et le prix.");
                return;
            }
            renderRowContent(row, newData);
            
            // Animation de 2 sec
            row.style.transition = 'background-color 0.5s ease';
            row.style.backgroundColor = 'var(--light-light-accent-color)';
            setTimeout(() => { row.style.backgroundColor = ''; }, 2000);
        }
    };

    row.querySelector('.cancelBtn').onclick = (e) => {
        e.stopPropagation();
        if (groupEditContext) {
            groupEditContext.cancelAll();
        } else {
            if (!oldData.size && !oldData.color) {
                row.remove();
                checkContainers();
            } else {
                renderRowContent(row, oldData);
            }
        }
    };
}

function addNewCategory(AutoAdd) {
    removeErrorMessage();
    let newCategory = document.querySelector('#new-category');
    let ownedCategory = document.querySelector('#ownedCategory');

    let categoryValue = AutoAdd ? AutoAdd.trim() : (newCategory ? newCategory.value.trim() : '');

    if (categoryValue === '') {
        if (!AutoAdd) addElementAfterElementId('new-category-div', 'La catégorie ne peut pas être vide.');
        return;
    }

    if (ownedCategory && ownedCategory.querySelector(`[data-category="${categoryValue}"]`)) {
        if (!AutoAdd) addElementAfterElementId('new-category-div', 'Cette catégorie est déjà ajoutée.');
        return;
    }

    const categoryDiv = document.createElement('div');
    categoryDiv.setAttribute('data-category', categoryValue);
    categoryDiv.innerHTML = `<span>${categoryValue}</span><button type="button" class="deleteBtn">x</button>`;

    categoryDiv.querySelector('.deleteBtn').onclick = () => {
        categoryDiv.remove();
        checkContainers();
    };

    if (ownedCategory) ownedCategory.appendChild(categoryDiv);
    if (newCategory) newCategory.value = '';
    checkContainers();
}

/**
 * Enregistre et met à jour les données du produit via l'API backend.
 */
/**
 * Soumission du formulaire
 */
/**
 * Soumission complète du formulaire de mise à jour du produit.
 * Récupère tous les champs du formulaire, les catégories, les variantes
 * ainsi que les images visibles à l'écran + les nouveaux fichiers.
 */
function updateProduct() {
    const submitBtn = document.querySelector('#submitBtn');
    
    // 1. Vérification si des variantes sont en cours d'édition
    const activeInputs = document.querySelectorAll('#variants-body input');
    if (activeInputs.length > 0) {
        alert("Attention : Vous avez des variantes en cours d'édition. Veuillez valider ou annuler vos modifications avant d'enregistrer le produit.");
        if (submitBtn) submitBtn.classList.remove('loading');
        activeInputs[0].focus();
        return;
    }

    if (submitBtn) submitBtn.classList.add('loading'); 
    if (typeof removeErrorMessage === 'function') removeErrorMessage();
    
    let form = document.querySelector('#superAdmin-newProductForm');
    const formData = new FormData(form);

    // 2. Ajout des identifiants clés du produit
    formData.append('id', product.id);
    formData.append('old_sku', product.sku);

    // 3. Encodage en Base64 des descriptions et détails texte
    const fieldsToEncode = [
        'description', 'blankDetails', 'embroideryDetails',
        'customPersonalizationDetails', 'tampographieDetails',
        'vividPrintDetails', 'screenPrintDetails', 'engravingDetails', 'patchDetails'
    ];

    fieldsToEncode.forEach(fieldName => {
        const element = form.querySelector(`textarea[name="${fieldName}"]`);
        if (element) {
            formData.set(fieldName, btoa(unescape(encodeURIComponent(element.value))));
        }
    });

    // 4. Gestion sécurisée des commutateurs (Switches : 1 ou 0)
    const setCheckbox = (name) => {
        const cb = form.querySelector(`input[name="${name}"]`);
        if (cb) formData.set(name, cb.checked ? "1" : "0");
    };

    ['active', 'customPersonalization', 'blank', 'dtf', 'broderie', 'tampographie', 'vividPrint', 'screenPrint', 'engraving', 'patch', 'uvdtf'].forEach(setCheckbox);

    // 5. Collecte des catégories attribuées au produit
    const categories = [];
    document.querySelectorAll('#ownedCategory [data-category]').forEach(div => {
        categories.push(div.getAttribute('data-category'));
    });
    formData.append('categories', JSON.stringify(categories));

    // 6. Collecte du tableau des variantes (Taille, Couleur, Prix, Stock)
    const variants = [];
    document.querySelectorAll('#variants-body tr').forEach(row => {
        if (row.dataset.basePrice) {
            variants.push({
                size: row.querySelector('.col-size').textContent,
                color: row.querySelector('.col-color').textContent,
                price: row.dataset.basePrice,
                stock: row.querySelector('.col-stock').textContent,
            });
        }
    });
    formData.append('variants', JSON.stringify(variants));

    // 7. RECUPERATION DES IMAGES EXISTANTES VISIBLES A L'ECRAN
    const visibleExistingImages = [];
    document.querySelectorAll('#existing-images-preview .existing-image-item').forEach(item => {
        const fileName = item.getAttribute('data-filename');
        if (fileName) {
            visibleExistingImages.push(fileName);
        }
    });

    // 8. RECUPERATION DES NOUVELLES IMAGES DU INPUT FILE
    const imgInput = form.querySelector('#img');
    const newImageNames = [];
    if (imgInput && imgInput.files) {
        Array.from(imgInput.files).forEach(file => {
            newImageNames.push(file.name);
        });
    }

    // 9. FUSION DES LISTES D'IMAGES
    const finalImgNames = [...visibleExistingImages, ...newImageNames];

    // Transmettre la liste d'images et les chemins à supprimer au serveur
    formData.append('imgNames', JSON.stringify(finalImgNames));
    formData.append('deleteImages', JSON.stringify(imagesToDelete));

    // 10. Envoi au serveur API PHP
    fetch("../api/superAdmin/UPDATE/product", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (submitBtn) submitBtn.classList.remove('loading');
        if (data.success) {
            alert("Produit mis à jour avec succès !");
            if (imgInput) imgInput.value = "";
            location.reload(); 
        } else {
            if (typeof addElementAfterElementId === 'function') {
                addElementAfterElementId('submitBtn', data.message);
            } else {
                alert("Erreur : " + data.message);
            }
        }
    })
    .catch(error => {
        if (submitBtn) submitBtn.classList.remove('loading');
        console.error('Erreur réseau ou serveur:', error);
        alert('Une erreur est survenue lors de l\'enregistrement.');
    });
}

function checkContainers() {
    const ownedCategory = document.querySelector('#ownedCategory');
    const variantsContainer = document.querySelector('#variants-container');
    const variantsBody = document.querySelector('#variants-body');

    if (ownedCategory) {
        ownedCategory.classList.toggle('hidden', ownedCategory.children.length === 0);
    }
    if (variantsContainer && variantsBody) {
        variantsContainer.classList.toggle('hidden', variantsBody.children.length === 0);
    }
}

function removeErrorMessage() {
    document.querySelectorAll('span.error-message').forEach(span => span.remove());
}

function addElementAfterElementId(elementId, message) {
    let target = document.querySelector(`#${elementId}`);
    if (target) {
        let span = document.createElement('span');
        span.textContent = message;
        span.classList.add('error-message');
        target.after(span);
    }
}

function renderExistingImage(displaySrc, cleanFilePath, container) {
    const img = new Image();
    img.decoding = "async";
    img.src = displaySrc;
    
    const fileName = cleanFilePath.split('/').pop();

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 80;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const miniDataUrl = canvas.toDataURL('image/jpeg', 0.1);

        const wrapper = document.createElement('div');
        wrapper.className = 'existing-image-wrapper';
        wrapper.style.position = 'relative';

        wrapper.innerHTML = `
            <img src="${miniDataUrl}" 
                 title="${fileName}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; cursor: help;">
            <button type="button" 
                    class="deleteImgBtn" 
                    onclick="deleteServerImage('${cleanFilePath}', this)">
                x
            </button>
        `;
        container.appendChild(wrapper);
        img.src = "";
    };
    img.onerror = () => {}; 
}

function filterVariants() {
    const input = document.getElementById('variant-search');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById('variants-body');
    if (!tbody) return;
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let matchFound = false;

        for (let j = 1; j < cells.length; j++) {
            const cellText = cells[j].textContent || cells[j].innerText;
            if (cellText.toLowerCase().indexOf(filter) > -1) {
                matchFound = true;
                break; 
            }
        }
        row.style.display = matchFound ? "" : "none";
    }
}

function addNewEmptyVariantRow() {
    const tbody = document.getElementById('variants-body');
    const container = document.getElementById('variants-container');
    
    if (container) container.classList.remove('hidden');

    const row = document.createElement('tr');
    const emptyData = { size: "", color: "", price: "", stock: "" };

    makeRowEditable(row, emptyData);
    if (tbody) tbody.prepend(row);
    
    const firstInput = row.querySelector('input');
    if (firstInput) firstInput.focus();
}

function duplicateVariant(data) {
    const tbody = document.getElementById('variants-body');
    const newRow = document.createElement('tr');
    const dataCopy = JSON.parse(JSON.stringify(data));

    makeRowEditable(newRow, dataCopy);
    if (tbody) tbody.prepend(newRow);
    
    const sizeInput = newRow.querySelector('.edit-size');
    if (sizeInput) sizeInput.focus();
    
    checkContainers();
}

function displayExistingTechnicalFile(sku) {
    const technicalFileInput = document.querySelector('#technicalFile');
    if (!technicalFileInput) return;

    let previewContainer = document.querySelector('#existing-pdf-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'existing-pdf-preview';
        previewContainer.style.cssText = "display:none; gap:10px; margin-top:10px;";
        technicalFileInput.after(previewContainer);
    }
    
    previewContainer.innerHTML = ''; 
    previewContainer.style.display = 'none';

    const pdfSrc = `../static-resources/products/${sku}/Fiche technique.pdf`;

    fetch(pdfSrc, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                previewContainer.style.display = 'flex';
                
                const wrapper = document.createElement('div');
                wrapper.className = 'existing-image-wrapper';
                wrapper.style.position = 'relative';

                wrapper.innerHTML = `
                    <div style="width: 80px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; cursor: pointer;" 
                         onclick="window.open('${pdfSrc}', '_blank')" title="Ouvrir la fiche technique">
                        <img src="../static-resources/default/icons/black/file-pdf.png" style="width: 50px;">
                    </div>
                    <button type="button" class="deleteImgBtn" 
                            onclick="if(confirm('Supprimer le PDF ?')){ deleteServerImage('${pdfSrc}', this); document.querySelector('#existing-pdf-preview').style.display='none'; }">
                        x
                    </button>
                `;
                previewContainer.appendChild(wrapper);
            }
        })
        .catch(() => {
            previewContainer.style.display = 'none';
        });
}/**
 * Récupère les éléments HTML des lignes cochées
 */
function getSelectedVariantRows() {
    const selectedRows = [];
    document.querySelectorAll('#variants-body tr').forEach(row => {
        const checkbox = row.querySelector('.variant-checkbox');
        if (checkbox && checkbox.checked) {
            selectedRows.push(row);
        }
    });
    return selectedRows;
}

/**
 * Duplique une seule variante (au-dessus d'une ligne spécifique si fournie)
 */
function duplicateVariant(data, targetRow = null) {
    addVariantRow({
        size: data.size,
        color: data.color,
        price: data.price,
        stock: data.stock
    }, targetRow);
}

/**
 * Duplique l'ensemble des variantes cochées et les insère au-dessus de la PREMIÈRE sélection
 */
function bulkDuplicateVariants() {
    const selectedRows = getSelectedVariantRows();

    if (selectedRows.length === 0) return;

    // La première ligne sélectionnée servira de repère pour l'insertion au-dessus
    const firstSelectedRow = selectedRows[0];

    // On parcourt chaque ligne pour récupérer les données
    selectedRows.forEach(row => {
        const data = {
            size: row.querySelector('.col-size')?.textContent.trim() || '',
            color: row.querySelector('.col-color')?.textContent.trim() || '',
            price: row.dataset.basePrice || '0.00',
            stock: row.querySelector('.col-stock')?.textContent.trim() || ''
        };
        
        // Insère chaque copie au-dessus de la première ligne sélectionnée
        duplicateVariant(data, firstSelectedRow);
    });

    // Décoche la case en-tête ainsi que toutes les lignes après duplication
    const masterCb = document.getElementById('select-all-variants');
    if (masterCb) masterCb.checked = false;
    
    selectedRows.forEach(row => {
        const cb = row.querySelector('.variant-checkbox');
        if (cb) cb.checked = false;
    });
}

/**
 * Supprime l'ensemble des variantes cochées
 */
function bulkDeleteVariants() {
    const selectedRows = getSelectedVariantRows();
    
    if (selectedRows.length === 0) return;

    if (confirm(`Voulez-vous vraiment supprimer les ${selectedRows.length} variantes sélectionnées ?`)) {
        selectedRows.forEach(row => row.remove());
        
        const masterCb = document.getElementById('select-all-variants');
        if (masterCb) masterCb.checked = false;

        checkContainers();
    }
}

/**
 * Passe l'ensemble des lignes cochées en mode édition simultané
 */
function bulkEditVariants() {
    const selectedRows = getSelectedVariantRows();
    if (selectedRows.length === 0) return;

    // Récupération des données d'origine pour chaque ligne sélectionnée
    const rowsData = selectedRows.map(row => ({
        row: row,
        oldData: {
            size: row.querySelector('.col-size')?.textContent.trim() || '',
            color: row.querySelector('.col-color')?.textContent.trim() || '',
            price: row.dataset.basePrice || '0.00',
            stock: row.querySelector('.col-stock')?.textContent.trim() || ''
        }
    }));

    // Gestionnaire partagé pour valider/annuler toutes les lignes cochées
    const groupEditContext = {
        saveAll: () => {
            let hasError = false;
            
            // Vérification de la validité de toutes les lignes
            rowsData.forEach(item => {
                const size = item.row.querySelector('.edit-size')?.value.trim();
                const color = item.row.querySelector('.edit-color')?.value.trim();
                const price = item.row.querySelector('.edit-price')?.value.trim();
                if (!size || !color || !price) {
                    hasError = true;
                }
            });

            if (hasError) {
                alert("Veuillez remplir au moins la taille, la couleur et le prix pour toutes les variantes en cours d'édition.");
                return;
            }

            // Enregistrement et animation des lignes
            rowsData.forEach(item => {
                const newData = {
                    size: item.row.querySelector('.edit-size').value.trim(),
                    color: item.row.querySelector('.edit-color').value.trim(),
                    price: item.row.querySelector('.edit-price').value.trim(),
                    stock: item.row.querySelector('.edit-stock').value.trim(),
                };
                renderRowContent(item.row, newData);

                // Animation visuelle de 2 secondes
                item.row.style.transition = 'background-color 0.5s ease';
                item.row.style.backgroundColor = 'var(--light-light-accent-color)';
                setTimeout(() => { item.row.style.backgroundColor = ''; }, 2000);
            });

            const masterCb = document.getElementById('select-all-variants');
            if (masterCb) masterCb.checked = false;
        },
        cancelAll: () => {
            rowsData.forEach(item => {
                renderRowContent(item.row, item.oldData);
            });
            const masterCb = document.getElementById('select-all-variants');
            if (masterCb) masterCb.checked = false;
        }
    };

    // Rendre toutes les lignes sélectionnées éditables
    rowsData.forEach(item => {
        makeRowEditable(item.row, item.oldData, groupEditContext);
    });
}

/**
 * Helper : demande à l'utilisateur s'il souhaite écraser collectivement certains champs
 */
function askForBulkOverrides() {
    const overrides = {};

    const fields = [
        { key: 'size', label: 'la taille' },
        { key: 'color', label: 'la couleur' },
        { key: 'price', label: 'le prix' },
        { key: 'stock', label: 'le stock' }
    ];

    fields.forEach(field => {
        if (confirm(`Voulez-vous modifier ${field.label} de TOUTES les variantes sélectionnées ?`)) {
            const newValue = prompt(`Entrez la nouvelle valeur pour ${field.label} :`);
            if (newValue !== null && newValue.trim() !== "") {
                overrides[field.key] = newValue.trim();
            }
        }
    });

    return overrides;
}

/**
 * Duplique l'ensemble des variantes cochées et les insère au-dessus de la PREMIÈRE sélection
 */
/**
 * Helper : demande à l'utilisateur s'il souhaite écraser collectivement certains champs
 */
function askForBulkOverrides() {
    const overrides = {};

    const fields = [
        { key: 'size', label: 'la taille' },
        { key: 'color', label: 'la couleur' },
        { key: 'price', label: 'le prix' },
        { key: 'stock', label: 'le stock' }
    ];

    fields.forEach(field => {
        if (confirm(`Voulez-vous modifier ${field.label} de TOUTES les variantes sélectionnées ?`)) {
            const newValue = prompt(`Entrez la nouvelle valeur pour ${field.label} :`);
            if (newValue !== null && newValue.trim() !== "") {
                overrides[field.key] = newValue.trim();
            }
        }
    });

    return overrides;
}

/**
 * Duplique l'ensemble des variantes cochées et les insère au-dessus de la PREMIÈRE sélection
 */
function bulkDuplicateVariants() {
    const selectedRows = getSelectedVariantRows();

    if (selectedRows.length === 0) return;

    // Demande à l'utilisateur les surcharges éventuelles (taille, couleur, prix, stock)
    const overrides = askForBulkOverrides();

    // La première ligne sélectionnée servira de repère pour l'insertion au-dessus
    const firstSelectedRow = selectedRows[0];

    // On parcourt chaque ligne pour récupérer les données et appliquer les surcharges si présentes
    selectedRows.forEach(row => {
        const data = {
            size: overrides.size !== undefined ? overrides.size : (row.querySelector('.col-size')?.textContent.trim() || ''),
            color: overrides.color !== undefined ? overrides.color : (row.querySelector('.col-color')?.textContent.trim() || ''),
            price: overrides.price !== undefined ? overrides.price : (row.dataset.basePrice || '0.00'),
            stock: overrides.stock !== undefined ? overrides.stock : (row.querySelector('.col-stock')?.textContent.trim() || '')
        };
        
        // Insère chaque copie au-dessus de la première ligne sélectionnée
        duplicateVariant(data, firstSelectedRow);
    });

    // Décoche la case en-tête ainsi que toutes les lignes après duplication
    const masterCb = document.getElementById('select-all-variants');
    if (masterCb) masterCb.checked = false;
    
    selectedRows.forEach(row => {
        const cb = row.querySelector('.variant-checkbox');
        if (cb) cb.checked = false;
    });
}

/**
 * Supprime l'ensemble des variantes cochées
 */
function bulkDeleteVariants() {
    const selectedRows = getSelectedVariantRows();
    
    if (selectedRows.length === 0) return;

    if (confirm(`Voulez-vous vraiment supprimer les ${selectedRows.length} variantes sélectionnées ?`)) {
        selectedRows.forEach(row => row.remove());
        
        const masterCb = document.getElementById('select-all-variants');
        if (masterCb) masterCb.checked = false;

        checkContainers();
    }
}

/**
 * Passe l'ensemble des lignes cochées en mode édition simultané
 */
function bulkEditVariants() {
    const selectedRows = getSelectedVariantRows();
    if (selectedRows.length === 0) return;

    // Demande à l'utilisateur les surcharges éventuelles (taille, couleur, prix, stock)
    const overrides = askForBulkOverrides();

    // Récupération des données d'origine pour chaque ligne sélectionnée + application des surcharges
    const rowsData = selectedRows.map(row => {
        const defaultSize = row.querySelector('.col-size')?.textContent.trim() || '';
        const defaultColor = row.querySelector('.col-color')?.textContent.trim() || '';
        const defaultPrice = row.dataset.basePrice || '0.00';
        const defaultStock = row.querySelector('.col-stock')?.textContent.trim() || '';

        return {
            row: row,
            oldData: {
                size: defaultSize,
                color: defaultColor,
                price: defaultPrice,
                stock: defaultStock
            },
            editData: {
                size: overrides.size !== undefined ? overrides.size : defaultSize,
                color: overrides.color !== undefined ? overrides.color : defaultColor,
                price: overrides.price !== undefined ? overrides.price : defaultPrice,
                stock: overrides.stock !== undefined ? overrides.stock : defaultStock
            }
        };
    });

    // Gestionnaire partagé pour valider/annuler toutes les lignes cochées
    const groupEditContext = {
        saveAll: () => {
            let hasError = false;
            
            // Vérification de la validité de toutes les lignes
            rowsData.forEach(item => {
                const size = item.row.querySelector('.edit-size')?.value.trim();
                const color = item.row.querySelector('.edit-color')?.value.trim();
                const price = item.row.querySelector('.edit-price')?.value.trim();
                if (!size || !color || !price) {
                    hasError = true;
                }
            });

            if (hasError) {
                alert("Veuillez remplir au moins la taille, la couleur et le prix pour toutes les variantes en cours d'édition.");
                return;
            }

            // Enregistrement et animation des lignes
            rowsData.forEach(item => {
                const newData = {
                    size: item.row.querySelector('.edit-size').value.trim(),
                    color: item.row.querySelector('.edit-color').value.trim(),
                    price: item.row.querySelector('.edit-price').value.trim(),
                    stock: item.row.querySelector('.edit-stock').value.trim(),
                };
                renderRowContent(item.row, newData);

                // Animation visuelle de 2 secondes
                item.row.style.transition = 'background-color 0.5s ease';
                item.row.style.backgroundColor = 'var(--light-light-accent-color)';
                setTimeout(() => { item.row.style.backgroundColor = ''; }, 2000);
            });

            const masterCb = document.getElementById('select-all-variants');
            if (masterCb) masterCb.checked = false;
        },
        cancelAll: () => {
            rowsData.forEach(item => {
                renderRowContent(item.row, item.oldData);
            });
            const masterCb = document.getElementById('select-all-variants');
            if (masterCb) masterCb.checked = false;
        }
    };

    // Rendre toutes les lignes sélectionnées éditables avec pré-remplissage des valeurs choisies
    rowsData.forEach(item => {
        makeRowEditable(item.row, item.editData, groupEditContext);
    });
}

/**
 * Supprime l'ensemble des variantes cochées
 */
function bulkDeleteVariants() {
    const selectedRows = getSelectedVariantRows();
    
    if (selectedRows.length === 0) return;

    if (confirm(`Voulez-vous vraiment supprimer les ${selectedRows.length} variantes sélectionnées ?`)) {
        selectedRows.forEach(row => row.remove());
        
        const masterCb = document.getElementById('select-all-variants');
        if (masterCb) masterCb.checked = false;

        checkContainers();
    }
}

/**
 * Passe l'ensemble des lignes cochées en mode édition simultané
 */
