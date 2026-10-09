let imagesToDelete = []; 
let existingImageNames = []; // Tableau qui conserve la liste officielle des images existantes du produit
let lastCheckedCheckbox = null;

// --- FONCTIONS EXPOSÉES À WINDOW (DOIVENT ÊTRE EN HAUT) ---
window.addNewEmptyVariantRow = function() {
    const tbody = document.getElementById('variants-body');
    const container = document.getElementById('variants-container');
    
    if (container) container.classList.remove('hidden');

    const row = document.createElement('tr');
    const emptyData = { size: "", color: "", price: "", stock: "" };

    makeRowEditable(row, emptyData);
    if (tbody) tbody.prepend(row);
    
    const firstInput = row.querySelector('input');
    if (firstInput) firstInput.focus();
};

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

// --- ÉCOUTEURS ET INITIALISATION ---
document.addEventListener('DOMContentLoaded', function() {
    const delBtn = document.querySelector('#deleteProduct');
    if (delBtn) {
        delBtn.onclick = deleteProduct;
    }

    const addVariantBtn = document.querySelector('.add-variant-main-btn');
    if (addVariantBtn) {
        addVariantBtn.onclick = window.addNewEmptyVariantRow;
    }

    restoreSelections();
});

// --- GESTION DE LA PERSISTANCE DES SÉLECTIONS ---
function saveCurrentSelections() {
    const selectedSupplier = document.querySelector('#supplier')?.value;
    const selectedCategory = document.querySelector('#new-category')?.value;

    if (selectedSupplier) localStorage.setItem('edit_last_supplier', selectedSupplier);
    if (selectedCategory) localStorage.setItem('edit_last_category', selectedCategory);
}

function restoreSelections() {
    const lastSupplier = localStorage.getItem('edit_last_supplier');
    const supplierSelect = document.querySelector('#supplier');

    if (supplierSelect && lastSupplier) {
        supplierSelect.value = lastSupplier;
    }
}

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
    let productDetails = e.detail.productDetails;

    existingImageNames = productDetails.imgNames || [];
    if (typeof existingImageNames === 'string') {
        try { existingImageNames = JSON.parse(existingImageNames); } catch (err) { existingImageNames = []; }
    }

    // --- REMPLISSAGE DES CHAMPS TEXTES ---
    form.querySelector('input#name').value = productDetails.name || '';
    form.querySelector('input#sku').value = productDetails.sku || '';
    form.querySelector('textarea#description').value = decodeBase64UTF8(productDetails.description);
    form.querySelector('textarea#personalization').value = productDetails.personalization || '';
    form.querySelector('textarea#embroideryDetails').value = decodeBase64UTF8(productDetails.embroideryDetails);
    form.querySelector('textarea#blankDetails').value = decodeBase64UTF8(productDetails.blankDetails);
    form.querySelector('textarea#customPersonalizationDetails').value = decodeBase64UTF8(productDetails.customPersonalizationDetails);
    form.querySelector('textarea#tampographieDetails').value = decodeBase64UTF8(productDetails.tampographieDetails);
    form.querySelector('textarea#screenPrintDetails').value = decodeBase64UTF8(productDetails.screenPrintDetails);
    form.querySelector('textarea#vividPrintDetails').value = decodeBase64UTF8(productDetails.vividPrintDetails);
    form.querySelector('textarea#engravingDetails').value = decodeBase64UTF8(productDetails.engravingDetails);
    form.querySelector('textarea#patchDetails').value = decodeBase64UTF8(productDetails.patchDetails);
    form.querySelector('input#zoom').value = productDetails.zoom || 1;

    // --- CATÉGORIES ET VARIANTES ---
    if (productDetails.categories) {
        productDetails.categories.forEach(category => addNewCategory(category));
    }

    if (productDetails.variants) {
        Object.keys(productDetails.variants).forEach(colorName => {
            productDetails.variants[colorName].forEach(variant => {
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
            const isSelected = productDetails.supplierId == supplier.id ? 'selected' : '';
            supplierSelect.innerHTML += `<option value="${supplier.id}" ${isSelected}>${supplier.name}</option>`;
        });
    }

    // --- GESTION DES SWITCHES ---
    const bindSwitch = (name, showFn) => {
        let input = form.querySelector(`.switch input[name="${name}"]`);
        if (input) {
            input.checked = parseInt(productDetails[name]) === 1;
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

    const imgInput = document.querySelector('#img');
    if (imgInput) {
        imgInput.onchange = function() { previewSelectedImages(this); };
    }

    displayExistingImages(form, productDetails.sku);
    displayExistingTechnicalFile(productDetails.sku);
    
    checkContainers();
    const varSearch = document.getElementById('variant-search');
    if (varSearch) {
        varSearch.value = '';
        filterVariants();
    }
});

// --- FONCTIONS DE VISIBILITÉ ---
function toggleDisplay(selector, status) {
    const el = document.querySelector(selector);
    if (el) el.style.display = status ? "block" : "none";
}

function showCustomPersonalizationDetails(status) { toggleDisplay('#customPersonalizationDetailsLabel', status); toggleDisplay('#customPersonalizationDetails', status); }
function showBlankDetails(status) { toggleDisplay('#blankDetailsLabel', status); toggleDisplay('#blankDetails', status); }
function showEmbroideryDetails(status) { toggleDisplay('#embroideryDetailsLabel', status); toggleDisplay('#embroideryDetails', status); }
function showTampographieDetails(status) { toggleDisplay('#tampographieDetailsLabel', status); toggleDisplay('#tampographieDetails', status); }
function showVividPrintDetails(status) { toggleDisplay('#vividPrintDetailsLabel', status); toggleDisplay('#vividPrintDetails', status); }
function showEngravingDetails(status) { toggleDisplay('#engravingDetailsLabel', status); toggleDisplay('#engravingDetails', status); }
function showPatchDetails(status) { toggleDisplay('#patchDetailsLabel', status); toggleDisplay('#patchDetails', status); }
function showScreenPrintDetails(status) { toggleDisplay('#screenPrintDetailsLabel', status); toggleDisplay('#screenPrintDetails', status); }

// --- GESTION DES IMAGES SERVEUR (EXISTANTES) ---

/**
 * Affiche la liste des images déjà présentes sur le serveur avec overlay d'actions au survol.
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

    existingImageNames.forEach(imageName => {
        const cleanPath = `../static-resources/products/${sku}/${imageName}`;
        const imgSrcWithCache = `${cleanPath}?v=${cacheBuster}`;

        const wrapper = document.createElement('div');
        wrapper.className = 'existing-image-item';
        wrapper.setAttribute('data-filename', imageName);
        wrapper.style.cssText = "position:relative; display:inline-block; width:80px; text-align:center; overflow:hidden; border-radius:4px;";

        wrapper.innerHTML = `
            <img src="${imgSrcWithCache}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:1px solid #ccc; display:block;" title="${imageName}">
            <div class="img-overlay-actions">
                <button type="button" title="Renommer" onclick="promptRenameServerImage('${imageName}')">
                    <img class='icons' src='../static-resources/default/icons/white/filter-2.png'>
                </button>
                <button type="button" title="Dupliquer" onclick="duplicateServerImage('${imageName}')">
                    <img class='icons' src='../static-resources/default/icons/white/copy.png'>
                </button>
                <button type="button" title="Supprimer" onclick="deleteServerImage('${cleanPath}', this)">
                    <img class='icons' src='../static-resources/default/icons/white/x.png'>
                </button>
            </div>
            <span style="font-size:9px; word-break:break-all; display:block; margin-top:2px;">${imageName}</span>
        `;

        previewContainer.appendChild(wrapper);
    });
}

/**
 * Duplique une image serveur directement côté client et l'injecte dans input#img
 */
async function duplicateServerImage(imageName) {
    saveCurrentSelections();

    const imgInput = document.querySelector('#img');
    if (!imgInput) return;

    const lastDotIndex = imageName.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? imageName.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? imageName.substring(0, lastDotIndex) : imageName;

    const parts = nameWithoutExt.split('-');
    if (parts.length >= 3 && !isNaN(parts[parts.length - 1])) {
        parts.pop();
    }
    const cleanBaseName = parts.join('-');
    const newFileName = `${cleanBaseName}-${Date.now()}${ext}`;

    try {
        const imagePath = `../static-resources/products/${product.sku}/${imageName}`;
        const response = await fetch(imagePath);
        if (!response.ok) throw new Error("Impossible de charger l'image source.");

        const blob = await response.blob();
        const duplicatedFile = new File([blob], newFileName, { type: blob.type || 'image/webp' });

        const dataTransfer = new DataTransfer();
        if (imgInput.files && imgInput.files.length > 0) {
            Array.from(imgInput.files).forEach(f => dataTransfer.items.add(f));
        }

        dataTransfer.items.add(duplicatedFile);
        imgInput.files = dataTransfer.files;

        previewSelectedImages(imgInput);

    } catch (err) {
        console.error("Erreur lors de la duplication client :", err);
        alert("Impossible de dupliquer l'image.");
    }
}

/**
 * Renomme une image serveur via l'API
 */
function promptRenameServerImage(oldFileName) {
    const lastDotIndex = oldFileName.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? oldFileName.substring(lastDotIndex) : '';
    const oldNameWithoutExt = lastDotIndex !== -1 ? oldFileName.substring(0, lastDotIndex) : oldFileName;

    const userInput = prompt("Entrez la base du nom (ex: Couleur-Index) :", oldNameWithoutExt);
    
    if (userInput && userInput.trim() !== "") {
        let cleanInput = userInput.trim();

        if (ext && cleanInput.toLowerCase().endsWith(ext.toLowerCase())) {
            cleanInput = cleanInput.substring(0, cleanInput.length - ext.length);
        }

        const timestamp = Date.now();
        const formattedNewFileName = `${cleanInput}-${timestamp}${ext}`;

        saveCurrentSelections();
        
        fetch("../api/superAdmin/UPDATE/product", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rename_image',
                product_id: product.id,
                old_file_name: oldFileName,
                new_file_name: formattedNewFileName
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const index = existingImageNames.indexOf(oldFileName);
                if (index !== -1) {
                    existingImageNames[index] = data.newFileName;
                }
                displayExistingImages(document.querySelector('#superAdmin-newProductForm'), product.sku);
                restoreSelections();
            } else {
                alert("Erreur lors du renommage : " + (data.message || "Problème serveur"));
            }
        })
        .catch(err => console.error('Erreur réseau :', err));
    }
}

function deleteServerImage(imagePath, btnElement) {
    if (confirm("Voulez-vous vraiment supprimer cette image ?")) {
        imagesToDelete.push(imagePath);

        if (btnElement && btnElement.closest('.existing-image-item')) {
            btnElement.closest('.existing-image-item').remove();
        }
    }
}

// --- GESTION DES NOUVELLES IMAGES (INPUT FILE) ---

/**
 * Génère l'aperçu des nouvelles images avec overlay d'actions au survol.
 */
function previewSelectedImages(input) {
    let previewContainer = document.querySelector('#new-images-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'new-images-preview';
        previewContainer.style.cssText = "display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;";
        input.after(previewContainer);
    }

    previewContainer.innerHTML = ''; 

    if (input.files && input.files.length > 0) {
        const dataTransfer = new DataTransfer();
        const now = Date.now();

        Array.from(input.files).forEach((file, index) => {
            let newFileName = file.name;

            const lastDotIndex = file.name.lastIndexOf('.');
            const nameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
            const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';

            const parts = nameWithoutExt.split('-');
            const hasTimestamp = parts.length >= 3 && !isNaN(parts[parts.length - 1]);

            if (!hasTimestamp) {
                newFileName = `${nameWithoutExt}-${now + index}${ext}`;
            }

            const renamedFile = new File([file], newFileName, { type: file.type });
            dataTransfer.items.add(renamedFile);

            const reader = new FileReader();
            reader.onload = function(e) {
                const wrapper = document.createElement('div');
                wrapper.className = 'existing-image-item new-image-item';
                wrapper.style.cssText = "position:relative; display:inline-block; width:80px; text-align:center; overflow:hidden; border-radius:4px;";

                wrapper.innerHTML = `
                    <img src="${e.target.result}" style="width:80px; height:80px; object-fit:cover; border-radius:4px; border:2px solid #4CAF50; display:block;" title="${renamedFile.name}">
                    <div class="img-overlay-actions">
                        <button type="button" title="Renommer" onclick="promptRenameNewImage(${index})">
                            <img class='icons' src='../static-resources/default/icons/white/filter-2.png'>
                        </button>
                        <button type="button" title="Dupliquer" onclick="duplicateNewImage(${index})">
                            <img class='icons' src='../static-resources/default/icons/white/copy.png'>
                        </button>
                        <button type="button" title="Supprimer" onclick="removeNewImage(${index})">
                            <img class='icons' src='../static-resources/default/icons/white/x.png'>
                        </button>
                    </div>
                    <span style="font-size:9px; word-break:break-all; display:block; margin-top:2px;">${renamedFile.name}</span>
                `;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(renamedFile);
        });

        input.files = dataTransfer.files;
    }
}

function promptRenameNewImage(index) {
    const imgInput = document.querySelector('#img');
    if (!imgInput || !imgInput.files[index]) return;

    const file = imgInput.files[index];
    const lastDotIndex = file.name.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;

    const parts = nameWithoutExt.split('-');
    if (parts.length >= 3 && !isNaN(parts[parts.length - 1])) {
        parts.pop();
    }
    const cleanBaseName = parts.join('-');

    const userInput = prompt("Entrez la base du nom (ex: Couleur-Index) :", cleanBaseName);
    if (userInput && userInput.trim() !== "") {
        let cleanInput = userInput.trim();
        if (ext && cleanInput.toLowerCase().endsWith(ext.toLowerCase())) {
            cleanInput = cleanInput.substring(0, cleanInput.length - ext.length);
        }

        const newFileName = `${cleanInput}-${Date.now()}${ext}`;
        const renamedFile = new File([file], newFileName, { type: file.type });

        const dataTransfer = new DataTransfer();
        Array.from(imgInput.files).forEach((f, i) => {
            if (i === index) {
                dataTransfer.items.add(renamedFile);
            } else {
                dataTransfer.items.add(f);
            }
        });

        imgInput.files = dataTransfer.files;
        previewSelectedImages(imgInput);
    }
}

function duplicateNewImage(index) {
    const imgInput = document.querySelector('#img');
    if (!imgInput || !imgInput.files[index]) return;

    const file = imgInput.files[index];
    const lastDotIndex = file.name.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex) : '';
    const nameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;

    const parts = nameWithoutExt.split('-');
    if (parts.length >= 3 && !isNaN(parts[parts.length - 1])) {
        parts.pop();
    }
    const cleanBaseName = parts.join('-');
    const newFileName = `${cleanBaseName}-${Date.now()}${ext}`;

    const duplicatedFile = new File([file], newFileName, { type: file.type });

    const dataTransfer = new DataTransfer();
    Array.from(imgInput.files).forEach((f, i) => {
        dataTransfer.items.add(f);
        if (i === index) {
            dataTransfer.items.add(duplicatedFile);
        }
    });

    imgInput.files = dataTransfer.files;
    previewSelectedImages(imgInput);
}

function removeNewImage(index) {
    const imgInput = document.querySelector('#img');
    if (!imgInput) return;

    const dataTransfer = new DataTransfer();
    Array.from(imgInput.files).forEach((f, i) => {
        if (i !== index) {
            dataTransfer.items.add(f);
        }
    });

    imgInput.files = dataTransfer.files;
    previewSelectedImages(imgInput);
}

// --- GESTION DES VARIANTES ET DU FORMULAIRE ---

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

    if (targetRow && targetRow.parentNode === tableBody) {
        tableBody.insertBefore(row, targetRow);
    } else {
        tableBody.appendChild(row);
    }

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

function handleCellBulkEdit(fieldType, selectedRows) {
    const fieldLabels = {
        size: 'la grandeur/taille',
        color: 'la couleur',
        price: 'le prix',
        stock: 'le stock'
    };

    const label = fieldLabels[fieldType] || fieldType;
    const newValue = prompt(`Entrez la nouvelle valeur pour ${label} sur les ${selectedRows.length} variantes sélectionnées :`);

    if (newValue === null || newValue.trim() === "") return;

    const val = newValue.trim();

    selectedRows.forEach(row => {
        if (fieldType === 'size') {
            const sizeTd = row.querySelector('.col-size');
            if (sizeTd) sizeTd.textContent = val;
        } else if (fieldType === 'color') {
            const colorTd = row.querySelector('.col-color');
            if (colorTd) colorTd.textContent = val;
        } else if (fieldType === 'price') {
            let cleanPrice = val.replace('$', '').trim();
            let numericPrice = parseFloat(cleanPrice);
            if (!isNaN(numericPrice)) {
                row.dataset.basePrice = numericPrice.toFixed(2);
                const priceTd = row.querySelector('.col-price-base');
                if (priceTd) priceTd.textContent = numericPrice.toFixed(2) + '$';
            }
        } else if (fieldType === 'stock') {
            const stockTd = row.querySelector('.col-stock');
            if (stockTd) stockTd.textContent = val;
        }

        row.style.transition = 'background-color 0.3s ease';
        row.style.backgroundColor = 'var(--light-light-accent-color)';
        setTimeout(() => { row.style.backgroundColor = ''; }, 1500);
    });

    const masterCb = document.getElementById('select-all-variants');
    if (masterCb) masterCb.checked = false;
    selectedRows.forEach(row => {
        const cb = row.querySelector('.variant-checkbox');
        if (cb) cb.checked = false;
    });
}

function handleShiftSelect(e, currentCheckbox) {
    // Si la touche Shift est appuyée et qu'une case a déjà été cliquée auparavant
    if (e.shiftKey && lastCheckedCheckbox && lastCheckedCheckbox !== currentCheckbox) {
        const checkboxes = Array.from(document.querySelectorAll('#variants-body .variant-checkbox'));
        let inRange = false;

        checkboxes.forEach(cb => {
            // Activer/Désactiver la zone comprise entre le dernier clic et le clic actuel
            if (cb === currentCheckbox || cb === lastCheckedCheckbox) {
                inRange = !inRange;
            }
            if (inRange || cb === currentCheckbox || cb === lastCheckedCheckbox) {
                // Donne à toutes les cases intermédiaire le même état (coché/décoché) que la case cliquée
                cb.checked = currentCheckbox.checked;
            }
        });
    }

    // Mettre à jour la référence du dernier clic
    lastCheckedCheckbox = currentCheckbox;
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
            <button type="button" class="editBtn" title="Éditer la ligne"><img class='icons' src='../static-resources/default/icons/white/filter-2.png'></button>
            <button type="button" class="deleteVariantBtn" title="Supprimer"><img class='icons' src='../static-resources/default/icons/white/x.png'></button>
        </div>
    </td>
    <td class="col-size" data-field="size">${data.size}</td>
    <td class="col-color" data-field="color">${data.color}</td>
    <td class="col-price-base" data-field="price">${!isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'}$</td>
    <td class="col-stock" data-field="stock">${data.stock}</td>
    `;

    const checkbox = row.querySelector('.variant-checkbox');
    if (checkbox) {
        checkbox.onclick = (e) => {
            e.stopPropagation();
            handleShiftSelect(e, checkbox); // Prise en charge de la sélection Shift + Clic
        };
    }

    row.querySelector('.editBtn').onclick = (e) => {
        if (e) e.stopPropagation();
        const selectedRows = getSelectedVariantRows();
        if (selectedRows.length > 1) {
            bulkEditVariants();
        } else {
            makeRowEditable(row, data);
        }
    };

    const editableCells = row.querySelectorAll('[data-field]');
    editableCells.forEach(cell => {
        cell.ondblclick = (e) => {
            e.stopPropagation();
            const fieldType = cell.getAttribute('data-field');
            const selectedRows = getSelectedVariantRows();

            if (selectedRows.length > 1) {
                handleCellBulkEdit(fieldType, selectedRows);
            } else {
                makeRowEditable(row, data);
            }
        };
    });

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
}

function promptEditColorOnly(oldColor) {
    const newColor = prompt("Modifier uniquement la couleur :", oldColor);

    if (newColor && newColor.trim() !== "" && newColor.trim() !== oldColor) {
        saveCurrentSelections();

        fetch("../api/superAdmin/UPDATE/product", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_variant_color',
                product_id: product.id,
                old_color: oldColor,
                new_color: newColor.trim()
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.querySelectorAll('#variants-body tr').forEach(row => {
                    const colorTd = row.querySelector('.col-color');
                    if (colorTd && colorTd.textContent.trim() === oldColor) {
                        colorTd.textContent = newColor.trim();
                    }
                });
                restoreSelections();
            } else {
                alert("Erreur lors de la mise à jour : " + (data.message || "Erreur serveur"));
            }
        })
        .catch(err => console.error('Erreur réseau :', err));
    }
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

function updateProduct() {
    saveCurrentSelections();
    const submitBtn = document.querySelector('#submitBtn');
    
    const activeInputs = document.querySelectorAll('#variants-body input[type="text"], #variants-body input[type="number"]');
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

    formData.append('id', product.id);
    formData.append('old_sku', product.sku);

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

    const setCheckbox = (name) => {
        const cb = form.querySelector(`input[name="${name}"]`);
        if (cb) formData.set(name, cb.checked ? "1" : "0");
    };

    ['active', 'customPersonalization', 'blank', 'dtf', 'broderie', 'tampographie', 'vividPrint', 'screenPrint', 'engraving', 'patch', 'uvdtf'].forEach(setCheckbox);

    const categories = [];
    document.querySelectorAll('#ownedCategory [data-category]').forEach(div => {
        categories.push(div.getAttribute('data-category'));
    });
    formData.append('categories', JSON.stringify(categories));

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

    const visibleExistingImages = [];
    document.querySelectorAll('#existing-images-preview .existing-image-item').forEach(item => {
        const fileName = item.getAttribute('data-filename');
        if (fileName) {
            visibleExistingImages.push(fileName);
        }
    });

    const imgInput = form.querySelector('#img');
    const newImageNames = [];
    if (imgInput && imgInput.files) {
        Array.from(imgInput.files).forEach(file => {
            newImageNames.push(file.name);
        });
    }

    const finalImgNames = [...visibleExistingImages, ...newImageNames];

    formData.append('imgNames', JSON.stringify(finalImgNames));
    formData.append('deleteImages', JSON.stringify(imagesToDelete));

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
}

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

function duplicateVariant(data, targetRow = null) {
    addVariantRow({
        size: data.size,
        color: data.color,
        price: data.price,
        stock: data.stock
    }, targetRow);
}

function bulkDuplicateVariants() {
    const selectedRows = getSelectedVariantRows();
    if (selectedRows.length === 0) return;

    const firstSelectedRow = selectedRows[0];

    selectedRows.forEach(row => {
        const data = {
            size: row.querySelector('.col-size')?.textContent.trim() || '',
            color: row.querySelector('.col-color')?.textContent.trim() || '',
            price: row.dataset.basePrice || '0.00',
            stock: row.querySelector('.col-stock')?.textContent.trim() || ''
        };
        
        duplicateVariant(data, firstSelectedRow);
    });

    const masterCb = document.getElementById('select-all-variants');
    if (masterCb) masterCb.checked = false;
    
    selectedRows.forEach(row => {
        const cb = row.querySelector('.variant-checkbox');
        if (cb) cb.checked = false;
    });
}

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

function bulkEditVariants() {
    const selectedRows = getSelectedVariantRows();
    if (selectedRows.length === 0) return;

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
            }
        };
    });

    const groupEditContext = {
        saveAll: () => {
            let hasError = false;
            
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

            rowsData.forEach(item => {
                const newData = {
                    size: item.row.querySelector('.edit-size').value.trim(),
                    color: item.row.querySelector('.edit-color').value.trim(),
                    price: item.row.querySelector('.edit-price').value.trim(),
                    stock: item.row.querySelector('.edit-stock').value.trim(),
                };
                renderRowContent(item.row, newData);

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

    rowsData.forEach(item => {
        makeRowEditable(item.row, item.oldData, groupEditContext);
    });
}