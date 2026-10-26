let product = {};
window.pendingLogoSourceFiles = window.pendingLogoSourceFiles || [];

// Canvas / PPI Reference
let REFERENCE_CANVAS_WIDTH = 3240; 
let REFERENCE_PPI = 108;
let currentDynamicPPI = REFERENCE_PPI;
let canvas;
let canvasHistory = [];

// ----------------------------------------------------------------------
// UTILS & PARSING
// ----------------------------------------------------------------------

function formatImageUrl(url, quality) {
    
    if (!url || typeof url !== 'string') return url;
    return url.replace(/RS=[^&]+/, 'RS=' + (quality || 1800));
}

function updateSourceFileMarkerLetters() {
    if (!canvas) return;

    const entries = canvas.getObjects().filter(obj =>
        obj.imageOwner && !obj.logoLetterMarker
    );
    entries.forEach((entry, index) => {
        const letter = getSourceLogoLetter(index);
        entry.logoLetter = letter;
        if (entry.sourceFileId) {
            const sourceFile = window.pendingLogoSourceFiles.find(file => file.id === entry.sourceFileId);
            if (sourceFile) {
                sourceFile.letter = letter;
                const row = document.querySelector(`[data-source-file-id="${sourceFile.id}"]`);
                const placeholder = row && row.querySelector('.logo-source-placeholder');
                if (placeholder) {
                    placeholder.textContent = letter;
                    placeholder.setAttribute('aria-label', `Repère ${letter}`);
                }
            }
            const label = entry.item(1);
            if (label) label.set('text', letter);
        } else {
            const badge = canvas.getObjects().find(obj =>
                obj.logoLetterMarker && obj.logoId === entry.id
            );
            const label = badge && badge.item(1);
            if (label) label.set('text', letter);
        }
        syncLogoLetterMarker(entry);
    });
    canvas.getObjects()
        .filter(obj => obj.sourceFileMarker)
        .forEach(marker => canvas.bringToFront(marker));
    canvas.renderAll();
}

function syncLogoLetterMarker(logo) {
    if (!canvas || !logo || logo.sourceFileMarker || logo.logoLetterMarker) return;
    const badge = canvas.getObjects().find(obj => obj.logoLetterMarker && obj.logoId === logo.id);
    if (!badge) return;

    const size = Math.max(20, Math.min(30, Math.min(logo.getScaledWidth(), logo.getScaledHeight()) * 0.3));
    badge.set({
        left: logo.left - logo.getScaledWidth() / 2 + size / 2,
        top: logo.top - logo.getScaledHeight() / 2 + size / 2,
        scaleX: size / 30,
        scaleY: size / 30
    });
    badge.setCoords();
}

function createLogoLetterMarker(logo) {
    const rect = new fabric.Rect({
        width: 30,
        height: 30,
        fill: 'rgba(220, 25, 25, 0.42)',
        stroke: 'rgba(180, 0, 0, 0.9)',
        strokeWidth: 1.5,
        strokeDashArray: [5, 3],
        originX: 'center',
        originY: 'center'
    });
    const label = new fabric.Text(logo.logoLetter || 'A', {
        fontFamily: 'Arial',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#fff',
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
    });
    const badge = new fabric.Group([rect, label], {
        id: `logo_letter_${logo.id}`,
        logoLetterMarker: true,
        logoId: logo.id,
        imageOwner: logo.imageOwner,
        left: logo.left,
        top: logo.top,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        hasBorders: false,
        objectCaching: false
    });
    canvas.add(badge);
    syncLogoLetterMarker(logo);
}

function parseImageFilename(fileName) {
    const cleanName = fileName.split('/').pop(); 
    const nameWithoutExtension = cleanName.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExtension.split('-'); 

    const prefix = parts[0] || "";
    const position = parseInt(parts[1], 10) || 0;
    const timestamp = parts[2] ? (parseInt(parts[2], 10) || 0) : 0;

    return {
        prefix: prefix,
        position: position,
        timestamp: timestamp,
        fullName: fileName
    };
}

function normalizeColorText(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
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


// ----------------------------------------------------------------------
// INITIALISATION DOM & FETCH
// ----------------------------------------------------------------------

async function translateText(text) {
    if (!text || typeof text !== 'string') return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Recompose le texte si le résultat est découpé en plusieurs segments
        if (data && data[0]) {
            return data[0].map(segment => segment[0]).join('');
        }
        return text;
    } catch (e) {
        console.error("Erreur de traduction Google :", e);
        return text;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let productContainer = document.getElementById('product-details-container');

    showDetailsSkeleton(productContainer);
    
    const URL = window.location.search;
    const searchParams = new URLSearchParams(URL);
    const pid = parseInt(searchParams.get("pid")) ?? null;
    const eid = searchParams.get("eid") ?? null; // SAGE ID
    const sku = searchParams.get("sku") ?? null;

    const selectedColorFromURL = searchParams.get("selectedColor");

   if (eid) {
    fetch('./../api/GET/sage-product-details?eid=' + eid + '&sku=' + sku)
        .then(async response => {
            const rawText = await response.text();
            try {
                return JSON.parse(rawText);
            } catch (e) {
                console.error("Réponse du serveur non-JSON :", rawText);
                throw new Error("Le serveur a renvoyé une réponse invalide.");
            }
        })
        .then(async data => { // Ajout de async
            if (data && data.success) {
                product = data.product;

                // --- TRADUCTION DES ÉLÉMENTS REÇUS ---
                if (product.name) {
                    product.name = await translateText(product.name);
                }
                if (product.description) {
                    const decodedDesc = decodeBase64UTF8(product.description);
                    const translatedDesc = await translateText(decodedDesc);
                    // On ré-encode en Base64 pour conserver la compatibilité avec decodeBase64UTF8 dans displayProductDetails
                    product.description = btoa(unescape(encodeURIComponent(translatedDesc)));
                }
                if (Array.isArray(product.categories)) {
                    product.categories = await Promise.all(
                        product.categories.map(cat => translateText(cat))
                    );
                }
                // -------------------------------------

                // --- APPLIQUER RS=1800 AUX PROPRIÉTÉS DU PRODUIT ---
                if (product.imgUrl) {
                    product.imgUrl = formatImageUrl(product.imgUrl);
                }
                if (Array.isArray(product.imgNames)) {
                    product.imgNames = product.imgNames.map(img => formatImageUrl(img));
                }
                if (product.colorImages) {
                    Object.keys(product.colorImages).forEach(key => {
                        product.colorImages[key] = formatImageUrl(product.colorImages[key]);
                    });
                }
                // --------------------------------------------------

                displayProductDetails(product, productContainer, data.similarProducts || []);

                if (selectedColorFromURL && product.colors && product.colors.includes(selectedColorFromURL)) {
                    const colorSelect = document.getElementById('color-select');
                    if (colorSelect) colorSelect.value = selectedColorFromURL;
                    updateProductSize(selectedColorFromURL); 
                    updateActiveThumbnail(selectedColorFromURL);
                } else {
                    updateProductImage(""); 
                }
            } else {
                console.error("Erreur renvoyée par l'API :", data.error || data);
            }
        })
        .catch(error => console.error('Error fetching products:', error));
} else {
        window.location.href = `./studio?pid=${pid}&sku=${sku}&selectedColor=${selectedColorFromURL}`;
        return;
    }
});

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

// ----------------------------------------------------------------------
// LOGIQUE GESTION DES IMAGES ET CARROUSEL
// ----------------------------------------------------------------------


function slideProductImage(direction) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    if (!slideshowContainer) return;

    const colorSelect = document.getElementById('color-select');
    const selectedColor = colorSelect ? colorSelect.value : "";
    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));

    if (allImages.length <= 1) {
        updateArrowVisibility(selectedColor); 
        return; 
    } 

    const currentImageIndex = allImages.findIndex(img => img.style.display !== 'none');
    let startIndex = (currentImageIndex === -1) ? 0 : currentImageIndex; 
    let newIndex = startIndex + direction;
    const maxIndex = allImages.length - 1;

    if (newIndex > maxIndex) newIndex = maxIndex;
    if (newIndex < 0) newIndex = 0;

    if (newIndex === startIndex) {
        updateArrowVisibility(selectedColor);
        return;
    }

    if (startIndex !== -1) {
        allImages[startIndex].style.display = 'none';
    }
    allImages[newIndex].style.display = 'block';

    const newImageSrc = allImages[newIndex].src;
    
    if (newImageSrc.includes('thumbnail')) { 
        if (selectedColor !== "" && colorSelect) {
            colorSelect.value = "";
        }
    } else {
        const parsed = parseImageFilename(newImageSrc);
        if (parsed.position === 1 && product.colors && product.colors.includes(parsed.prefix)) {
            if (colorSelect && (selectedColor === "" || selectedColor !== parsed.prefix)) {
                colorSelect.value = parsed.prefix;
                colorSelect.dispatchEvent(new Event('change'));
            }
        }
    }
    
    syncSourceOnlyLogoList();
    updateArrowVisibility(selectedColor);
    filterLogosByImage();
    updateLivePriceDisplay();
}

function updateProductImage(selectedColor) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!slideshowContainer) return; 

    slideshowContainer.innerHTML = '';
    if (verticalContainer) verticalContainer.innerHTML = '';

    // Mode "Aucune couleur sélectionnée"
    if (!selectedColor || selectedColor === "") {
        const rawImgUrl = product.imgUrl || '../static-resources/products/default.jpg';
        const defaultImgUrl = formatImageUrl(rawImgUrl); // <--- AJOUT ICI
        
        const imageElement = document.createElement('img');
        imageElement.src = defaultImgUrl;
        imageElement.alt = `Image principale de ${product.name}`;
        imageElement.style.display = 'block';
        slideshowContainer.appendChild(imageElement);

        updateArrowVisibility("");
        if (typeof initStudioCanvas === 'function') initStudioCanvas();
        syncSourceOnlyLogoList();
        return;
    }

    // Mode couleur sélectionnée : recherche dans product.imgNames
    let imgNames = product.imgNames || [];

    if (typeof imgNames === 'string') {
        try {
            imgNames = JSON.parse(imgNames);
        } catch (e) {
            console.error("Erreur lors de la lecture du format JSON d'imgNames:", e);
            imgNames = [];
        }
    }

    if (!Array.isArray(imgNames)) imgNames = [];

    const targetPrefixNorm = normalizeColorText(selectedColor);

    let matchingImages = imgNames
        .map(name => parseImageFilename(name))
        .filter(img => normalizeColorText(img.prefix) === targetPrefixNorm);

    matchingImages.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.timestamp - b.timestamp;
    });

    const uniqueImages = [];
    const seenPositions = new Set();

    for (const img of matchingImages) {
        if (!seenPositions.has(img.position)) {
            seenPositions.add(img.position);
            uniqueImages.push(img);
        }
    }

    // Fallback tolérant si imgNames ne donne rien
    if (uniqueImages.length === 0) {
        let fallbackUrl = null;
        if (product.colorImages) {
            const foundKey = Object.keys(product.colorImages).find(
                key => normalizeColorText(key) === targetPrefixNorm
            );
            if (foundKey) {
                fallbackUrl = product.colorImages[foundKey];
            }
        }
        
        if (!fallbackUrl) {
            fallbackUrl = product.imgUrl || '../static-resources/products/default.jpg';
        }

        fallbackUrl = formatImageUrl(fallbackUrl); // <--- AJOUT ICI

        const imageElement = document.createElement('img');
        imageElement.src = fallbackUrl;
        imageElement.alt = `Image du produit ${product.name} - ${selectedColor}`;
        imageElement.style.display = 'block';
        slideshowContainer.appendChild(imageElement);
    } else {
        // Injection des images principales et des miniatures verticales
        uniqueImages.forEach((imgData, index) => {
            const rawUrl = `../static-resources/products/${product.sku}/${imgData.fullName}`;
            const currentImageUrl = formatImageUrl(rawUrl); // <--- AJOUT ICI
            
            // 1. Image principale en grand
            const imageElement = document.createElement('img');
            imageElement.src = currentImageUrl;
            imageElement.alt = `Image du produit, couleur ${selectedColor} vue ${imgData.position}`;
            imageElement.style.display = (index === 0) ? 'block' : 'none'; 
            slideshowContainer.appendChild(imageElement);

            // 2. Miniature verticale
            if (verticalContainer) {
                const thumbWrapper = document.createElement('div');
                thumbWrapper.className = 'side-thumbnail-wrapper';
                thumbWrapper.style.position = 'relative';
                thumbWrapper.style.display = 'inline-block';

                const thumbImg = document.createElement('img');
                thumbImg.src = currentImageUrl;
                thumbImg.className = 'side-thumbnail' + (index === 0 ? ' active' : '');
                thumbImg.onclick = () => switchMainImage(index);

                const overlayDiv = document.createElement('div');
                overlayDiv.className = 'thumb-logo-overlay';
                overlayDiv.style.position = 'absolute';
                overlayDiv.style.top = '0';
                overlayDiv.style.left = '0';
                overlayDiv.style.width = '100%';
                overlayDiv.style.height = '100%';
                overlayDiv.style.pointerEvents = 'none';

                thumbWrapper.appendChild(thumbImg);
                thumbWrapper.appendChild(overlayDiv);
                verticalContainer.appendChild(thumbWrapper);
            }
        });
    }

    updateArrowVisibility(selectedColor);
    window.scrollTo(0, 0);
    initStudioCanvas();
    setTimeout(filterLogosByImage, 50);
    syncSourceOnlyLogoList();
}

function switchMainImage(targetIndex) {
    updateActiveThumbnailWithLogos();

    const slideshowContainer = document.querySelector('.slideshowContainer');
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!slideshowContainer) return;

    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    allImages.forEach((img, idx) => {
        img.style.display = (idx === targetIndex) ? 'block' : 'none';
    });
    syncSourceOnlyLogoList();

    if (verticalContainer) {
        const allThumbs = Array.from(verticalContainer.querySelectorAll('.side-thumbnail'));
        allThumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === targetIndex);
        });
    }

    const colorSelect = document.getElementById('color-select');
    updateArrowVisibility(colorSelect ? colorSelect.value : "");
    filterLogosByImage();
    updateActiveThumbnailWithLogos();
    updateLivePriceDisplay();
}

function updateArrowVisibility(selectedColor) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const buttonContainer = document.querySelector('.button-slideshow-container');
    
    if (!slideshowContainer) return;

    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    
    if (allImages.length <= 1) {
        if (prevBtn) prevBtn.classList.add('disabled');
        if (nextBtn) nextBtn.classList.add('disabled');
        if (buttonContainer) buttonContainer.style.display = 'none';
        return;
    }

    if (buttonContainer) buttonContainer.style.display = 'flex';
    if (prevBtn) prevBtn.classList.remove('disabled');
    if (nextBtn) nextBtn.classList.remove('disabled');

    const currentImageIndex = allImages.findIndex(img => img.style.display !== 'none');

    if (currentImageIndex <= 0 && prevBtn) {
        prevBtn.classList.add('disabled');
    }

    if (currentImageIndex >= allImages.length - 1 && nextBtn) {
        nextBtn.classList.add('disabled');
    }
}

function updateActiveThumbnailWithLogos() {
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!verticalContainer || !canvas) return;

    const images = Array.from(document.querySelectorAll('.slideshowContainer img'));
    const thumbnails = Array.from(verticalContainer.querySelectorAll('.side-thumbnail'));
    const activeOption = document.querySelector('.personalization-option.active');
    const isCustomMode = activeOption && activeOption.dataset.name === 'Personnalisé';
    images.forEach((image, index) => {
        const overlay = thumbnails[index]?.parentElement.querySelector('.thumb-logo-overlay');
        if (!overlay) return;
        overlay.innerHTML = '';
        if (isCustomMode) return;

        canvas.getObjects()
            .filter(obj => obj.imageOwner === image.src)
            .forEach(obj => {
                if (obj.logoLetterMarker || obj.sourceFileMarker) {
                    appendThumbnailMarker(overlay, obj, canvas, obj.item(1)?.text || 'A');
                } else if (obj.getElement) {
                    const imgEl = document.createElement('img');
                    imgEl.src = obj.getElement().src;
                    imgEl.style.position = 'absolute';
                    imgEl.style.left = `${(obj.left / canvas.width) * 100}%`;
                    imgEl.style.top = `${(obj.top / canvas.height) * 100}%`;
                    imgEl.style.width = `${(obj.getScaledWidth() / canvas.width) * 100}%`;
                    imgEl.style.height = `${(obj.getScaledHeight() / canvas.height) * 100}%`;
                    imgEl.style.transform = 'translate(-50%, -50%)';
                    overlay.appendChild(imgEl);
                }
            });
    });
}

function appendThumbnailMarker(overlay, marker, sourceCanvas, letter) {
    const markerEl = document.createElement('span');
    markerEl.textContent = letter;
    markerEl.style.cssText = `position:absolute;left:${(marker.left / sourceCanvas.width) * 100}%;top:${(marker.top / sourceCanvas.height) * 100}%;width:${(marker.getScaledWidth() / sourceCanvas.width) * 100}%;height:${(marker.getScaledHeight() / sourceCanvas.height) * 100}%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden;background:rgba(220,25,25,.42);border:2px dashed #b40000;color:#fff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;`;
    overlay.appendChild(markerEl);
}

function selectProductColor(color) {
    const colorSelect = document.getElementById('color-select');
    if (colorSelect) {
        colorSelect.value = color;
    }
    updateProductSize(color);
}

function updateActiveThumbnail(selectedColor) {
    const selectedColorNorm = normalizeColorText(selectedColor);
    const wrappers = document.querySelectorAll('#colorThumbnailsContainer .color-thumbnail-wrapper');
    
    wrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        wrapper.classList.remove('active');
        if (selectedColorNorm && img && normalizeColorText(img.title) === selectedColorNorm) {
            wrapper.classList.add('active');
        }
    });
}

// ----------------------------------------------------------------------
// AFFICHAGE PRINCIPAL
// ----------------------------------------------------------------------

function displayProductDetails(product, container, similarProducts = []) {
    document.title = product.name;
    let activeHtml = product.active == 0 ? 'notActive' : '';

    container.innerHTML = `
        <div class="product-card ${activeHtml}" data-pid="${product.id}" data-pname="${product.name}" data-psku="${product.sku}">
            <div class="product-gallery-layout">
                <div id="vertical-thumbnails-container" class="vertical-thumbnails-container"></div>
                <div class="slideshowWrapper">
                    <div class="slideshowContainer"></div>
                    <canvas id="product-canvas"></canvas>
                    <div class='button-slideshow-container' style="display:none;">
                        <button id="prevBtn" onclick="slideProductImage(-1)">&lt;</button>
                        <button id="nextBtn" onclick="slideProductImage(1)">&gt;</button>
                    </div>
                </div>
            </div>
            <div class="productInfo">
                <div id="text-info-block" style="opacity: 0; transition: opacity 0.3s;"></div>
                <div id="colorThumbnailsContainer" style="opacity: 0; transition: opacity 0.3s;"></div>               
                <div id="dynamic-controls-block" style="opacity: 0;">
                    <select id="color-select" class="product-colors">
                        <option value="">Choisir une couleur</option>
                        ${product.colors ? product.colors.map(color => `<option value="${color}">${color}</option>`).join('') : ''}
                    </select>
                    <select id='personalization-select' style='display:none;'>
                        <option value=''>Choisir une option de personnalisation</option>
                        <option value='Aucune personnalisation' data-price='0'>Aucune personnalisation</option>
                    </select>

                    <div id="studio-actions-container" style='display:none;'>
                        <div id="studio-personalization-options-container"></div>
                        <div class="studio-title-row">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <label class="studio-upload-btn" style="margin-bottom:0;" for="logo-uploader">+ Ajouter un logo</label>
                            </div>
                            <span id="logo-counter-badge">0 logo</span>
                        </div>
                        <input type="file" id="logo-uploader" accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.ai,.eps,.pdf" multiple style="display:none;">
                        <div id="logo-list-container" style="display:none;"></div>
                        <div id="source-only-logo-list"></div>
                        <div id="personalization-details"></div>
                    </div>
                    <div class="product-sizes" style='display:none;'></div>
                    <span id="smallProductSizeNote" style="display:none;">* Les prix affichés sont basés sur les quantités déjà dans votre panier...</span>
                    <div id="add-to-cart-error-container"></div> 
                    <div id="add-to-cart-container"></div>
                    <div id="technicalInfo">
                        <p class="light">Les prix varient en fonction du nombre d'articles total de votre commande ainsi que de la grandeur des logos.</p>
                        <p class="light">Des questions ou souhaitez vérifier l'inventaire ? <a href="https://cameleonconception.com/contact">Contactez-nous</a></p>
                        <div>
                        <p class="light">Catégorie(s) : </p>
                        ${product.categories ? product.categories.map(categorie => `<a href="../?categories=${categorie}"><span class="light">${categorie}</span></a>`).join('<span class="light">, </span>') : ''}
                        </div>
                    </div> 
                    <div id="similarProductsContainer">
                        <div id="similarScrollContainer" class="similar-scroll-container">
                            <div class="similar-scroll-content">
                                ${similarProducts.map(prod => {
                                    let targetImg = '';
                                    if (prod.imgNames && prod.imgNames.length > 0) {
                                        const thumbImg = prod.imgNames.find(img => img.includes('thumbnail-1'));
                                        targetImg = thumbImg ? thumbImg : prod.imgNames[0];
                                    }
                                    const rawImgSrc = targetImg ? `../static-resources/products/${prod.sku}/${targetImg}` : '';
                                    const imgSrc = formatImageUrl(rawImgSrc, 300); // <--- AJOUT ICI
                                    return `
                                        <div class="similar-item" style="cursor: pointer;" onclick="window.location.href='./studio?sku=${prod.sku}'">
                                            <img src="${imgSrc}" alt="${prod.name}" style="width: 100%; height: auto; margin-bottom:5px; border-radius: 6px;" />
                                            <span>${prod.name}</span>
                                            <span class="light">${prod.sku}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    `;

    const colorSelect = document.getElementById('color-select');
    if (colorSelect) {
        colorSelect.addEventListener('change', (e) => {
            updateProductSize(e.target.value);
        });
    }

    setTimeout(() => {
        const textBlock = document.getElementById('text-info-block');
        if (textBlock) {
            textBlock.innerHTML = `
                <h1 class="title">${product.name}</h1>
                <p class='light' style="margin-top:-10px;">${product.sku}</p>
                <p>${decodeBase64UTF8(product.description)}</p>
            `;
            textBlock.style.opacity = '1';
        }

        const dynamicControls = document.getElementById('dynamic-controls-block');
        if (dynamicControls) dynamicControls.style.opacity = '1';

        let personalizationOptionsContainer = document.querySelector('#studio-personalization-options-container');
        if (personalizationOptionsContainer) {
            personalizationOptionsContainer.innerHTML = ''; 

            // Conserver UNIQUEMENT l'option Personnalisé et blank
            personalizationOptionsContainer.innerHTML = `
                <div class="personalization-option active" data-name="Blank" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">
                    SANS LOGO
                    <span class="additionnalInfo" onclick="openAdditionnalInfo(\`Vous pouvez à tout moment commander nos produits sans logo.\`)">?</span>
                </div>
                <div class="personalization-option " data-name="Personnalisé" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">
                    PERSONNALISÉ
                    <span class="additionnalInfo" onclick="openAdditionnalInfo(\`Vous pouvez sélectionner les différentes options et personnaliser ce produit comme vous le voulez.\`)">?</span>
                </div>
            `;

            // Masquer la barre de sélection des options puisqu'il n'y en a plus qu'une seule
            //personalizationOptionsContainer.style.display = 'none';

            // Activer l'option par défaut
            const firstOption = personalizationOptionsContainer.querySelector('.personalization-option');
            if (firstOption) {
                updateSelectedPersonalizationOption({ target: firstOption });
            }
        }

        const selectedColorFromURL = new URLSearchParams(window.location.search).get("selectedColor");
        if (selectedColorFromURL && product.colors && product.colors.includes(selectedColorFromURL) && colorSelect) {
            colorSelect.value = selectedColorFromURL;
            updateProductSize(selectedColorFromURL);
        }

        initStudioCanvas();
    }, 50);

    // 3. Chargement des vignettes couleurs (Zoomées)
    setTimeout(() => {
        const colorContainer = document.getElementById('colorThumbnailsContainer');
        let colorThumbnailBloc = '';

if (product.colors && product.colors.length > 0) {
    product.colors.forEach(color => {
        const rawUrl = (product.colorImages && product.colorImages[color]) 
            ? product.colorImages[color] 
            : (product.imgUrl || '../static-resources/products/default.jpg');
        
        const imgUrl = formatImageUrl(rawUrl, 300); // <--- AJOUT ICI

        colorThumbnailBloc += `
            <div class="color-thumbnail-wrapper" onclick="selectProductColor('${color}');">
                <img title="${color}" class="color-thumbnail-image"
                    src="${imgUrl}" 
                    alt="Couleur ${color}" loading="lazy">
            </div>`;
    });
}
        
        if (colorContainer) {
            colorContainer.innerHTML = colorThumbnailBloc;
            colorContainer.style.opacity = '1';
        }
        
        const selectedColorFromURL = new URLSearchParams(window.location.search).get("selectedColor");
        if (selectedColorFromURL) {
            updateActiveThumbnail(selectedColorFromURL);
            updateProductImage(selectedColorFromURL);
        } else {
            updateProductImage("");
        }
    }, 150);
}

// ----------------------------------------------------------------------
// GESTION DES TAILLES & PRIX
// ----------------------------------------------------------------------

const sizeOrder = [
    "S/M", "L/XL",
    "XS enf", "S enf", "M enf", "L enf", "XL enf",
    "XXS", "XS", "S", "M", "L", "XL", 
    "2XL", "3XL", "4XL", "5XL", 
    "2.5 X 2.25\"" , "3 X 2.69\"" , "3.5 X 3.14\"", "4 X 3.59\"",
    "24\" X 62\"", "24\" X 81\"", "33\" X 81\"", "47\" X 81\"",
];

function updateProductSize(selectedColor) {
    let personalizationSelect = document.getElementById('personalization-select');
    let studioContainer = document.getElementById('studio-actions-container');
    let productSizesContainer = document.querySelector('.product-sizes');
    let addToCartContainer = document.getElementById('add-to-cart-container');

    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (canvas) {
        canvas.clear();
        const listContainer = document.getElementById('logo-list-container');
        if (listContainer) listContainer.innerHTML = '';
        updateTotalLogoCounter();
    }

    if (selectedColor !== "") {
        params.set('selectedColor', selectedColor);
        updateProductImage(selectedColor); 
        updateActiveThumbnail(selectedColor);
        
        let personalizationData = [];
        try { 
            personalizationData = product.personalization ? JSON.parse(product.personalization) : []; 
        } catch (e) { 
            personalizationData = []; 
        }

        if (personalizationSelect) {
            if (personalizationData && personalizationData.length > 0) {
                personalizationSelect.innerHTML = `<option value='' data-price='0'>Choisir une option de personnalisation</option>`;
                personalizationData.forEach(choice => {
                    personalizationSelect.innerHTML += `<option value='${choice.option}' data-price='${choice.price}'>${choice.option} (+${choice.price}$)</option>`;
                });
                personalizationSelect.style.display = 'block';
            } else {
                personalizationSelect.style.display = 'none';
                personalizationSelect.innerHTML = '';
            }
        }

        if (studioContainer) studioContainer.style.display = 'flex';
    } else {
        params.delete('selectedColor');
        updateProductImage(""); 
        updateActiveThumbnail("");
        if (personalizationSelect) {
            personalizationSelect.style.display = 'none';
            personalizationSelect.innerHTML = '';
        }
        if (studioContainer) studioContainer.style.display = 'none';
    }
    
    history.replaceState(null, '', url.toString());

    if (!productSizesContainer) return;
    productSizesContainer.innerHTML = '';

    if (selectedColor !== "") {
        let sizes = (product.variants && product.variants[selectedColor]) ? product.variants[selectedColor] : [];

        sizes.sort((a, b) => {
            const sizeA = (a.size || '').trim().toUpperCase();
            const sizeB = (b.size || '').trim().toUpperCase();

            const indexA = sizeOrder.map(s => s.toUpperCase()).indexOf(sizeA);
            const indexB = sizeOrder.map(s => s.toUpperCase()).indexOf(sizeB);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return sizeA.localeCompare(sizeB, undefined, { numeric: true, sensitivity: 'base' });
        });

        const sizeDiv = document.createElement('div');
        sizeDiv.classList.add('variantDiv');
        sizeDiv.dataset.rawPrice = 0; 
        sizeDiv.dataset.sizeVariantId = 0;
        sizeDiv.dataset.sizeName = "Unité";
        sizeDiv.dataset.sizeStock = 999;

        sizeDiv.innerHTML = `
            <input type="number" min="1" value="" inputmode="numeric" placeholder="0">
            <span class="sizeName">Unité</span>
        `;

        sizeDiv.querySelector('input').addEventListener('input', updateLivePriceDisplay);
        productSizesContainer.appendChild(sizeDiv);

        updateLivePriceDisplay();
        
        if (addToCartContainer) {
            addToCartContainer.innerHTML = `<button id="addToCartBtn" style="margin-top:0px;" onclick="addProductToCart(true)">Ajouter à ma demande</button>`;
            addToCartContainer.style.display = 'flex';
        }
        productSizesContainer.style.display = 'flex';
    } else {
        if (addToCartContainer) addToCartContainer.style.display = 'none';
        productSizesContainer.style.display = 'none';
    }

    const activeOption = document.querySelector('.personalization-option.active');
    if (activeOption) {
        updateSelectedPersonalizationOption({ target: activeOption });
    }
}

function updateLivePriceDisplay() {
    if (!product || !product.supplier) return;

    const currentSupplierId = 12;
    const currentSku = product.sku;
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    const shippingFee = parseFloat(product.supplier.shippingCost) || 0;
    
    let countInCartSameSupp = 0;
    let countInCartSameSku = 0; 
    let totalCartQtyGlobal = 0;

    cart.forEach(item => {
        const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
        totalCartQtyGlobal += itemQty;

        if (item.supplierId === currentSupplierId) {
            countInCartSameSupp += itemQty;
        }

        if (item.sku === currentSku) {
            countInCartSameSku += itemQty;
        }
    });

    let liveInputQty = 0;
    const variantRows = document.querySelectorAll('.variantDiv');
    variantRows.forEach(row => {
        liveInputQty += parseInt(row.querySelector('input').value) || 0;
    });

    const totalQtyForHighlight = countInCartSameSku + (liveInputQty > 0 ? liveInputQty : 0);
    const finalHighlightQty = totalQtyForHighlight > 0 ? totalQtyForHighlight : 1;

    let tiers = [1, 4, 26, 50];
    if (!tiers.includes(finalHighlightQty)) tiers.push(finalHighlightQty);
    tiers.sort((a, b) => a - b);

    const headerSpans = document.querySelectorAll('.col-head');
    headerSpans.forEach((span, idx) => {
        const qty = tiers[idx];
        if (qty !== undefined) {
            span.textContent = qty;
            span.style.display = "inline-block";
            span.classList.toggle('showedPrice', qty === finalHighlightQty);
        } else {
            span.style.display = "none";
        }
    });

    variantRows.forEach(row => {
        const rawPrice = parseFloat(row.dataset.rawPrice);
        const priceSpans = row.querySelectorAll('.col-price');

        priceSpans.forEach((span, idx) => {
            const qtyCol = tiers[idx];
            if (qtyCol !== undefined) {
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
                span.classList.toggle('showedPrice', qtyCol === finalHighlightQty);
            } else {
                span.style.display = "none";
            }
        });
    });
}

function calculateFinalPrice(rawPrice, addedQty, cartSuppQty, cartGlobalOtherSuppliersQty, shippingFee) {
    const numericRawPrice = parseFloat(rawPrice);
    const initialCost = numericRawPrice / 1.6; 
    const totalSuppQtySimulated = cartSuppQty + addedQty;

    const thresholdRaw = product.supplier.freeShippingAt;
    const freeShippingThreshold = parseFloat(thresholdRaw);
    
    const estimatedTotalAmount = totalSuppQtySimulated * numericRawPrice;
    
    let currentShippingFee = shippingFee;

    if (thresholdRaw !== null && thresholdRaw !== "" && estimatedTotalAmount >= freeShippingThreshold) {
        currentShippingFee = 0;
    }

    const shippingShare = currentShippingFee / (totalSuppQtySimulated > 0 ? totalSuppQtySimulated : 1);

    const activeOption = document.querySelector('.personalization-option.active');
    const method = activeOption ? activeOption.dataset.name : null;
    
    let decorationCostUnit = 0;
    if (method === "DTF") decorationCostUnit = getDTFCostUnit(addedQty, cartSuppQty);
    if (method === "UV DTF") decorationCostUnit = getUVDTFCostUnit(addedQty, cartSuppQty);

    const subTotal = initialCost + decorationCostUnit + shippingShare;
    
    const totalGlobal = cartGlobalOtherSuppliersQty + totalSuppQtySimulated;
    let multiplier = 1.6;
    if (totalGlobal >= 50) multiplier = 1.3;
    else if (totalGlobal >= 26) multiplier = 1.4;

    return subTotal * multiplier;
}

function getDTFCostUnit(addedQty, cartSuppQty) {
    const allLogos = canvas ? canvas.getObjects().filter(obj => obj.imageOwner && obj.visible && !obj.sourceFileMarker && !obj.logoLetterMarker) : [];
    const logoCount = allLogos.length;

    if (logoCount === 0) return 0;

    const mainOeuvre = 1.67 * logoCount;

    let globalSurfaceStandard = 0;
    let globalSurfaceGangSheet = 0;
    let totalQtyCustomizedInOrder = 0;

    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    cart.forEach(item => {
        if (item.designSignature) {
            const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
            totalQtyCustomizedInOrder += itemQty;

            const studioData = JSON.parse(localStorage.getItem(item.designSignature));
            if (studioData && studioData.views) {
                studioData.views.forEach(view => {
                    view.logos.forEach(l => {
                        const w = parseFloat(l.width);
                        const h = parseFloat(l.height);
                        globalSurfaceStandard += (w * h * itemQty);
                        globalSurfaceGangSheet += ((w + 0.125) * (h + 0.125) * itemQty);
                    });
                });
            }
        }
    });

    let currentSurfaceStandard = 0;
    let currentSurfaceGangSheet = 0;

    allLogos.forEach(obj => {
        const w = obj.getScaledWidth() / currentDynamicPPI;
        const h = obj.getScaledHeight() / currentDynamicPPI;
        currentSurfaceStandard += (w * h);
        currentSurfaceGangSheet += ((w + 0.125) * (h + 0.125));
    });

    const totalQtyCustomSimulated = totalQtyCustomizedInOrder + addedQty;
    const decoShippingShare = 2.50 / (totalQtyCustomSimulated > 0 ? totalQtyCustomSimulated : 1);

    const getRate = (area) => {
        if (area >= 3000) return 0.017;
        if (area >= 1600) return 0.020;
        if (area >= 700) return 0.022;
        if (area >= 20) return 0.030;
        return 0.060;
    };

    const totalAreaA = globalSurfaceStandard + (currentSurfaceStandard * addedQty);
    const rateA = getRate(totalAreaA);
    const costOptionA = (currentSurfaceStandard * rateA) + decoShippingShare;

    const totalAreaB = globalSurfaceGangSheet + (currentSurfaceGangSheet * addedQty);
    const rateB = getRate(totalAreaB);
    const costOptionB = (currentSurfaceGangSheet * rateB) + decoShippingShare;

    const finalSurfaceAndShippingCost = Math.min(costOptionA, costOptionB);

    return Math.round((mainOeuvre + finalSurfaceAndShippingCost) * 100) / 100;
}

function getUVDTFCostUnit(addedQty, cartSuppQty) {
    const allLogos = canvas ? canvas.getObjects().filter(obj => obj.imageOwner && obj.visible && !obj.sourceFileMarker && !obj.logoLetterMarker) : [];
    const logoCount = allLogos.length;

    if (logoCount === 0) return 0;

    const mainOeuvre = 0.67 * logoCount;
    let totalQtyCustomizedInOrder = 0;

    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    cart.forEach(item => {
        if (item.designSignature) {
            const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
            totalQtyCustomizedInOrder += itemQty;
        }
    });

    let currentSurfaceTotal = 0;
    allLogos.forEach((obj) => {
        const w = obj.getScaledWidth() / currentDynamicPPI;
        const h = obj.getScaledHeight() / currentDynamicPPI;
        currentSurfaceTotal += (w * h);
    });

    const totalQtyCustomSimulated = totalQtyCustomizedInOrder + addedQty;
    const decoShippingShare = 2.50 / (totalQtyCustomSimulated > 0 ? totalQtyCustomSimulated : 1);
    
    const surfaceRate = 0.036;
    const costSurface = currentSurfaceTotal * surfaceRate;

    return Math.round((mainOeuvre + costSurface + decoShippingShare) * 100) / 100;
}

// ----------------------------------------------------------------------
// CANVAS FABRIC.JS ET ÉDITEUR
// ----------------------------------------------------------------------

function initStudioCanvas() {
    const imgVisible = document.querySelector('.slideshowContainer img[style*="display: block"]');
    if (!imgVisible) return;

    const updateCanvasPosition = () => {
        const rect = imgVisible.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        if (canvas) {
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;

            if (oldWidth !== rect.width || oldHeight !== rect.height) {
                const scaleRatio = rect.width / oldWidth;

                canvas.getObjects().forEach(obj => {
                    if (obj.imageOwner) {
                        obj.set({
                            left: obj.left * scaleRatio,
                            top: obj.top * scaleRatio
                        });
                        obj.scaleX *= scaleRatio;
                        obj.scaleY *= scaleRatio;
                        obj.setCoords();
                    }
                });
                
                canvas.setDimensions({ width: rect.width, height: rect.height });
            }
        }

        REFERENCE_PPI = 108 * (product.zoom || 1);         
        currentDynamicPPI = (rect.width / REFERENCE_CANVAS_WIDTH) * REFERENCE_PPI;

        if (!canvas) {
            canvas = new fabric.Canvas('product-canvas', {
                width: rect.width,
                height: rect.height,
                preserveObjectStacking: true,
                uniformScaling: true,
                enableRetinaScaling: true,
                imageSmoothingEnabled: true,
                selection: false, 
                skipTargetFind: false 
            });

            const wrapper = document.querySelector('.slideshowWrapper');
            if (wrapper) {
                wrapper.addEventListener('mousedown', function(e) {
                    const container = document.querySelector('.canvas-container');
                    if (container && container.classList.contains('active')) return;

                    const target = canvas.findTarget(e, false);
                    if (target && target.imageOwner) {
                        if (container) container.classList.add('active');
                        canvas.setActiveObject(target);
                        canvas.renderAll();
                        e.preventDefault();
                    }
                });
            }

            canvas.on('selection:cleared', () => {
                const container = document.querySelector('.canvas-container');
                if (container) container.classList.remove('active');
            });

            setupUploadListener();
            setupKeyboardListeners();
        }

        canvas.renderAll();
    };

    if (imgVisible.complete) updateCanvasPosition();
    imgVisible.onload = updateCanvasPosition;

    const resizeObserver = new ResizeObserver(() => {
        updateCanvasPosition();
    });
    
    resizeObserver.observe(imgVisible);
}

function setupKeyboardListeners() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        const activeObject = canvas ? canvas.getActiveObject() : null;
        
        if (e.key === 'Escape' && canvas) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return;
        }

        if (!activeObject) return;

        const moveAmount = e.shiftKey ? 10 : 1; 

        switch (e.key) {
            case 'ArrowUp':
                activeObject.set('top', activeObject.top - moveAmount);
                e.preventDefault();
                break;
            case 'ArrowDown':
                activeObject.set('top', activeObject.top + moveAmount);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                activeObject.set('left', activeObject.left - moveAmount);
                e.preventDefault();
                break;
            case 'ArrowRight':
                activeObject.set('left', activeObject.left + moveAmount);
                e.preventDefault();
                break;
            case 'Delete':
            case 'Backspace':
                if (activeObject.logoLetterMarker) {
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    updateActiveThumbnailWithLogos();
                    canvas.requestRenderAll();
                    e.preventDefault();
                    return;
                }
                if (activeObject.sourceFileMarker) {
                    canvas.remove(activeObject);
                    canvas.discardActiveObject();
                    updateActiveThumbnailWithLogos();
                    canvas.requestRenderAll();
                    e.preventDefault();
                    return;
                }
                deleteLogo(activeObject.id);
                e.preventDefault();
                break;
        }

        if (activeObject) {
            activeObject.setCoords();
            canvas.renderAll();
        }
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            undo();
            e.preventDefault();
        }
    });
}

function undo() {
    if (canvasHistory.length > 0 && canvas) {
        const lastState = canvasHistory.pop();
        canvas.loadFromJSON(lastState, function() {
            canvas.renderAll();
            filterLogosByImage();
            updateTotalLogoCounter();
            updateLivePriceDisplay();
        });
    }
}

function cropTransparentEdges(imgElement) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = imgElement.width;
    tempCanvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);
    
    const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imgData.data;
    const width = tempCanvas.width;
    const height = tempCanvas.height;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alphaIndex = ((y * width) + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                hasContent = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!hasContent) return imgElement.src;

    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(width - 1, maxX + 1);
    maxY = Math.min(height - 1, maxY + 1);

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;

    croppedCtx.drawImage(tempCanvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

    return croppedCanvas.toDataURL('image/png');
}

function addSourceOnlyLogoFile(file, imageOwner) {
    const extension = file.name.split('.').pop().toLowerCase();
    const previewableExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
    const sourceFile = {
        id: `source_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        file,
        imageOwner,
        previewUrl: file.type.startsWith('image/') || previewableExtensions.includes(extension)
            ? URL.createObjectURL(file)
            : null
    };
    sourceFile.letter = getSourceLogoLetter(
        window.pendingLogoSourceFiles.filter(item => item.imageOwner === imageOwner).length
    );
    window.pendingLogoSourceFiles.push(sourceFile);
    createSourceFileMarker(sourceFile);
    syncSourceOnlyLogoList();

    const sourceList = document.getElementById('source-only-logo-list');
    if (!sourceList) return;

    const row = document.createElement('div');
    row.className = 'logo-item logo-source-item';
    row.dataset.sourceFileId = sourceFile.id;
    row.dataset.imageOwner = imageOwner;
    if (sourceFile.previewUrl) {
        const preview = document.createElement('img');
        preview.src = sourceFile.previewUrl;
        preview.alt = `Aperçu de ${file.name}`;
        preview.className = 'logo-thumbnail';
        preview.onerror = () => {
            preview.remove();
            URL.revokeObjectURL(sourceFile.previewUrl);
            sourceFile.previewUrl = null;
            addSourceFilePlaceholder(row, sourceFile.letter);
        };
        row.appendChild(preview);
    } else {
        addSourceFilePlaceholder(row, sourceFile.letter);
    }

    const details = document.createElement('div');
    details.className = 'logo-source-details';
    const name = document.createElement('span');
    name.className = 'logo-info';
    name.textContent = file.name;
    const message = document.createElement('small');
    message.className = 'logo-source-message';
    message.textContent = "Ce fichier ne s’affiche pas sur le produit. Nous l’utiliserons pour préparer votre épreuve.";
    details.append(name, message);
    row.appendChild(details);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-delete-logo';
    removeButton.textContent = 'x';
    removeButton.addEventListener('click', () => {
        window.pendingLogoSourceFiles = window.pendingLogoSourceFiles.filter(item => item.id !== sourceFile.id);
        const marker = canvas && canvas.getObjects().find(obj => obj.sourceFileId === sourceFile.id);
        if (marker) canvas.remove(marker);
        if (sourceFile.previewUrl) URL.revokeObjectURL(sourceFile.previewUrl);
        row.remove();
        updateSourceFileMarkerLetters();
        syncSourceOnlyLogoList();
    });
    row.appendChild(removeButton);
    sourceList.appendChild(row);
    syncSourceOnlyLogoList();
}

function syncSourceOnlyLogoList() {
    const sourceList = document.getElementById('source-only-logo-list');
    if (!sourceList) return;

    const currentImage = document.querySelector('.slideshowContainer img[style*="display: block"]');
    const currentImageSrc = currentImage ? currentImage.src : '';
    const activeSourceFiles = window.pendingLogoSourceFiles.filter(sourceFile => sourceFile.imageOwner === currentImageSrc);
    let visibleRows = 0;
    sourceList.querySelectorAll('.logo-source-item').forEach(row => {
        const isCurrentImage = row.dataset.imageOwner === currentImageSrc;
        row.style.display = isCurrentImage ? 'flex' : 'none';
        if (isCurrentImage) visibleRows++;
    });
    sourceList.style.display = visibleRows > 0 ? 'flex' : 'none';

    activeSourceFiles.forEach(sourceFile => {
        let marker = canvas && canvas.getObjects().find(obj => obj.sourceFileId === sourceFile.id);
        if (!marker && canvas) {
            marker = createSourceFileMarker(sourceFile);
        }
        if (marker) {
            marker.set({ selectable: true, evented: true });
            canvas.bringToFront(marker);
            const label = marker.item(1);
            if (label) label.set('text', sourceFile.letter || 'A');
            marker.setCoords();
        }
    });
    updateSourceFileMarkerLetters();
    updateActiveThumbnailWithLogos();
}

function createSourceFileMarker(sourceFile) {
    if (!canvas || !sourceFile.imageOwner) return null;
    const rect = new fabric.Rect({
        width: 120,
        height: 120,
        fill: 'rgba(220, 25, 25, 0.42)',
        stroke: 'rgba(180, 0, 0, 0.9)',
        strokeWidth: 3,
        strokeDashArray: [10, 6],
        originX: 'center',
        originY: 'center'
    });
    const label = new fabric.Text(sourceFile.letter || 'A', {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#fff',
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
        objectCaching: false
    });
    const marker = new fabric.Group([rect, label], {
        id: `source_marker_${sourceFile.id}`,
        sourceFileMarker: true,
        sourceFileId: sourceFile.id,
        imageOwner: sourceFile.imageOwner,
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true,
        lockRotation: true,
        cornerColor: '#b40000',
        borderColor: '#b40000',
        transparentCorners: false
    });
    marker.scaleToWidth(Math.min(120, canvas.width * 0.22));
    canvas.add(marker);
    return marker;
}

function getSourceLogoLetter(index) {
    let number = index + 1;
    let label = '';
    while (number > 0) {
        number--;
        label = String.fromCharCode(65 + (number % 26)) + label;
        number = Math.floor(number / 26);
    }
    return label;
}

function addSourceFilePlaceholder(row, letter) {
    const placeholder = document.createElement('span');
    placeholder.className = 'logo-thumbnail logo-source-placeholder';
    placeholder.textContent = letter || 'A';
    placeholder.setAttribute('aria-label', `Repère ${letter || 'A'}`);
    row.insertBefore(placeholder, row.firstChild);
}

function setupUploadListener() {
    const uploader = document.getElementById('logo-uploader');
    if (!uploader) return;

    uploader.onchange = function(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const currentProductImg = document.querySelector('.slideshowContainer img[style*="display: block"]');
        const currentImgSrc = currentProductImg ? currentProductImg.src : '';

        files.forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            const canvasExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
            const sourceOnlyExtensions = ['ai', 'eps', 'pdf'];
            if (!canvasExtensions.includes(extension) && !sourceOnlyExtensions.includes(extension)) {
                displayProductError("Format de fichier non pris en charge.");
                return;
            }

            if (file.size > 7 * 1024 * 1024) {
                displayProductError("La taille maximale est de 7 Mo par fichier.");
                return;
            }

            if (sourceOnlyExtensions.includes(extension)) {
                addSourceOnlyLogoFile(file, currentImgSrc);
                return;
            }

        const reader = new FileReader();
        reader.onload = function(event) {
            const rawImg = new Image();
            rawImg.src = event.target.result;
            rawImg.onerror = function() {
                addSourceOnlyLogoFile(file, currentImgSrc);
            };
            rawImg.onload = function() {
                const MAX_LOGO_DIM = 1200;
                let logoWidth = rawImg.width;
                let logoHeight = rawImg.height;

                if (logoWidth > MAX_LOGO_DIM || logoHeight > MAX_LOGO_DIM) {
                    if (logoWidth > logoHeight) {
                        logoHeight = Math.round((logoHeight * MAX_LOGO_DIM) / logoWidth);
                        logoWidth = MAX_LOGO_DIM;
                    } else {
                        logoWidth = Math.round((logoWidth * MAX_LOGO_DIM) / logoHeight);
                        logoHeight = MAX_LOGO_DIM;
                    }
                }

                const resizeCanvas = document.createElement('canvas');
                resizeCanvas.width = logoWidth;
                resizeCanvas.height = logoHeight;
                const resizeCtx = resizeCanvas.getContext('2d');
                resizeCtx.drawImage(rawImg, 0, 0, logoWidth, logoHeight);

                const resizedImg = new Image();
                try {
                    resizedImg.src = resizeCanvas.toDataURL('image/png');
                } catch (error) {
                    console.error("Erreur de conversion du logo :", error);
                    addSourceOnlyLogoFile(file, currentImgSrc);
                    return;
                }

                resizedImg.onload = function() {
                    let croppedSrc;
                    try {
                        croppedSrc = cropTransparentEdges(resizedImg);
                    } catch (error) {
                        console.error("Erreur de rognage du logo :", error);
                        addSourceOnlyLogoFile(file, currentImgSrc);
                        return;
                    }

                    const imgElement = new Image();
                    imgElement.src = croppedSrc;
                    imgElement.onerror = function() {
                        addSourceOnlyLogoFile(file, currentImgSrc);
                    };
                    imgElement.onload = function() {
                        const fabricImg = new fabric.Image(imgElement, {
                            id: 'logo_' + Date.now(),
                            imageOwner: currentImgSrc,
                            left: canvas.width / 2,
                            top: canvas.height / 2,
                            originX: 'center',
                            originY: 'center',
                            objectCaching: false,
                            uniformScaling: true
                        });
                        fabricImg.logoSourceFile = file;

                        fabricImg.scaleToWidth(100);
                        canvas.add(fabricImg);
                        createLogoLetterMarker(fabricImg);
                        updateSourceFileMarkerLetters();
                        canvas.setActiveObject(fabricImg);
                        
                        addLogoToList(fabricImg.id, fabricImg);
                        filterLogosByImage();
                        updateTotalLogoCounter();
                        updateLivePriceDisplay(); 
                        canvas.renderAll();
                        updateActiveThumbnailWithLogos();
                    };
                };
            };
        };
        reader.onerror = function() {
            addSourceOnlyLogoFile(file, currentImgSrc);
        };
            reader.readAsDataURL(file);
        });
        this.value = "";
    };

    if (canvas) {
        canvas.on('object:scaling', (e) => {
            syncLogoLetterMarker(e.target);
            updateLogoDimensions(e.target);
            updateLivePriceDisplay(); 
        });
        canvas.on('object:moving', (e) => syncLogoLetterMarker(e.target));
        canvas.on('object:modified', () => {
            syncLogoLetterMarker(canvas.getActiveObject());
            updateLivePriceDisplay();
        });
    }
}

function addLogoToList(id, fabricObj) {
    const listContainer = document.getElementById('logo-list-container');
    if (!listContainer) return;

    const div = document.createElement('div');
    div.className = 'logo-item logo-source-item';
    div.id = 'item_' + id;

    const preview = document.createElement('img');
    preview.src = fabricObj.getElement().src;
    preview.className = 'logo-thumbnail';
    preview.alt = 'Aperçu du logo';

    const details = document.createElement('div');
    details.className = 'logo-source-details';
    const name = document.createElement('span');
    name.className = 'logo-info';
    name.textContent = fabricObj.logoSourceFile ? fabricObj.logoSourceFile.name : 'Logo';
    const message = document.createElement('small');
    message.className = 'logo-source-message';
    message.textContent = 'Logo ajouté à l’aperçu du produit.';
    details.append(name, message);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-delete-logo';
    removeButton.textContent = 'x';
    removeButton.addEventListener('click', () => deleteLogo(id));

    div.append(preview, details, removeButton);
    listContainer.appendChild(div);

    window.scrollTo(0, 0);
}

function toggleLock(id) {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const fabricObj = objects.find(obj => obj.id === id);
    const lockImg = document.getElementById(`lock_img_${id}`);
    
    if (!fabricObj || !lockImg) return;

    fabricObj.uniformScaling = !fabricObj.uniformScaling;

    if (fabricObj.uniformScaling) {
        lockImg.src = "../static-resources/default/icons/black/close-lock.png";
    } else {
        lockImg.src = "../static-resources/default/icons/black/open-lock.png";
    }
}

function updateLogoDimensions(fabricObj) {
    if (!fabricObj || !fabricObj.id) return;
    
    const id = fabricObj.id;
    const inputW = document.getElementById('input_w_' + id);
    const inputH = document.getElementById('input_h_' + id);
    
    if (inputW && inputH) {
        const widthInch = (fabricObj.getScaledWidth() / currentDynamicPPI).toFixed(2);
        const heightInch = (fabricObj.getScaledHeight() / currentDynamicPPI).toFixed(2);
        
        inputW.value = widthInch;
        inputH.value = heightInch;
    }
}

function deleteLogo(id) {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const objToDelete = objects.find(obj => obj.id === id);
    if (objToDelete) {
        canvas.remove(objToDelete);
        const badge = objects.find(obj => obj.logoLetterMarker && obj.logoId === id);
        if (badge) canvas.remove(badge);
        updateSourceFileMarkerLetters();
        updateTotalLogoCounter();
        updateLivePriceDisplay(); 
    }
    const listItem = document.getElementById('item_' + id);
    if (listItem) listItem.remove();
}

function filterLogosByImage() {
    if (!canvas) return;

    const slideshowContainer = document.querySelector('.slideshowContainer');
    if (!slideshowContainer) return;

    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    const currentProductImg = allImages.find(img => img.style.display !== 'none');
    const currentImgSrc = currentProductImg ? currentProductImg.src : '';

    if (!currentImgSrc) return;

    canvas.getObjects().forEach(obj => {
        if (obj.imageOwner) {
            const isVisible = (obj.imageOwner === currentImgSrc);
            obj.set({
                visible: isVisible,
                selectable: isVisible,
                evented: isVisible
            });
        }
    });

    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.imageOwner !== currentImgSrc) {
        canvas.discardActiveObject();
    }

    canvas.renderAll();

    const allItems = document.querySelectorAll('.logo-item');
    allItems.forEach(item => {
        const logoId = item.id.replace('item_', '');
        const fabricObj = canvas.getObjects().find(o => o.id === logoId);
        
        if (fabricObj) {
            item.style.display = (fabricObj.imageOwner === currentImgSrc) ? 'flex' : 'none';
        }
    });
}

function updateTotalLogoCounter() {
    if (!canvas) return;
    
    const allLogos = canvas.getObjects().filter(obj => obj.imageOwner && !obj.sourceFileMarker && !obj.logoLetterMarker);
    const count = allLogos.length;
    let logoListContainer = document.querySelector('#logo-list-container');
    
    const badge = document.getElementById('logo-counter-badge');
    if (badge) {
        badge.innerText = count + (count > 1 ? " logos" : " logo");
        
        if (count > 0) {
            badge.classList.add('has-logos');
            if (logoListContainer) logoListContainer.style.display = "flex";
        } else {
            badge.classList.remove('has-logos');
            if (logoListContainer) logoListContainer.style.display = "none";
        }
    }

    updateLivePriceDisplay();
}

// ----------------------------------------------------------------------
// GESTION DES OPTIONS DE PERSONNALISATION & MODALE
// ----------------------------------------------------------------------



function clearNonPngSourceFiles() {
    const retainedFiles = [];
    window.pendingLogoSourceFiles.forEach(sourceFile => {
        const extension = sourceFile.file.name.split('.').pop().toLowerCase();
        if (extension === 'png') {
            retainedFiles.push(sourceFile);
            return;
        }

        if (sourceFile.previewUrl) URL.revokeObjectURL(sourceFile.previewUrl);
        const row = document.querySelector(`[data-source-file-id="${sourceFile.id}"]`);
        if (row) row.remove();
    });
    window.pendingLogoSourceFiles = retainedFiles;
    syncSourceOnlyLogoList();
}

function updateSelectedPersonalizationOption(e) {
    let options = document.querySelectorAll('.personalization-option');
    let element = e.target.closest ? e.target.closest('.personalization-option') : e.target;
    if (!element) return;

    const colorSelect = document.getElementById('color-select');
    const isColorSelected = colorSelect && colorSelect.value !== "";

    const isAlreadyActive = element.classList.contains('active');
    if (!isAlreadyActive) {
        clearNonPngSourceFiles();
        if (canvas) {
            canvas.clear(); 
            const listContainer = document.getElementById('logo-list-container');
            if (listContainer) listContainer.innerHTML = '';
            updateTotalLogoCounter();
        }

    }

    options.forEach(option => option.classList.remove('active'));
    element.classList.add('active');

    let elementName = element.dataset.name;
    let detailsContainer = document.getElementById('personalization-details');
    
    const studioTitleRow = document.querySelector('.studio-title-row');
    const productSizes = document.querySelector('.product-sizes');
    const addToCartContainer = document.querySelector('#add-to-cart-container');
    const canvasContainer = document.querySelector('.canvas-container') || document.getElementById('product-canvas');

    const canShowPurchaseUI = isColorSelected;

    if (elementName === "Personnalisé") {
        if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
        if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
        if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
        if (canvasContainer) canvasContainer.style.display = 'none';

        if (detailsContainer) {
            detailsContainer.innerHTML = decodeBase64UTF8(product.customPersonalizationDetails) || `
                
                <p>Nous utiliserons vos logos pour créer une épreuve visuelles</p>
                
                <strong style="margin-bottom:-10px;">Dites-nous en plus !</strong>
                <textarea pvalue="notes" placeholder="(ex : emplacements des logos, couleurs, grandeurs, etc.)"></textarea>`;
            
        }

        const updateSizeLabel = () => {
            if (!detailsContainer) return;
            const customSizeBlock = detailsContainer.querySelector('.customSize');
            
            if (customSizeBlock) {
                const inputW = customSizeBlock.querySelector('input[name="custom-size-w"]');
                const inputH = customSizeBlock.querySelector('input[name="custom-size-h"]');
                const firstSizeNameLabel = document.querySelector('.variantDiv .sizeName');

                if (firstSizeNameLabel && inputW && inputH) {
                    const w = inputW.value.trim();
                    const h = inputH.value.trim();
                    const unitW = inputW.dataset.unit || '';
                    const unitH = inputH.dataset.unit || '';

                    if (w !== '' || h !== '') {
                        const formattedW = w !== '' ? `${w}${unitW}` : 'L';
                        const formattedH = h !== '' ? `${h}${unitH}` : 'H';
                        firstSizeNameLabel.textContent = `${formattedW} x ${formattedH}`;
                        const vDiv = document.querySelector('.variantDiv');
                        if (vDiv) vDiv.dataset.sizeName = `${formattedW} x ${formattedH}`;
                    } else {
                        firstSizeNameLabel.textContent = "Unité";
                        const vDiv = document.querySelector('.variantDiv');
                        if (vDiv) vDiv.dataset.sizeName = "Unité";
                    }
                }
            }
        };

        setTimeout(() => {
            if (!detailsContainer) return;
            const customSizeBlock = detailsContainer.querySelector('.customSize');
            if (customSizeBlock) {
                const inputW = customSizeBlock.querySelector('input[name="custom-size-w"]');
                const inputH = customSizeBlock.querySelector('input[name="custom-size-h"]');

                if (inputW) {
                    inputW.addEventListener('input', updateSizeLabel);
                    inputW.addEventListener('keyup', updateSizeLabel);
                }
                if (inputH) {
                    inputH.addEventListener('input', updateSizeLabel);
                    inputH.addEventListener('keyup', updateSizeLabel);
                }
                updateSizeLabel();
            }
        }, 50);

    } else {
        if (canvasContainer) canvasContainer.style.display = 'block';

        if (elementName === "Blank") {
            if (studioTitleRow) studioTitleRow.style.display = "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            if (detailsContainer) {
                detailsContainer.innerHTML = decodeBase64UTF8(product.blankDetails) || `
                    <p>Vous pouvez commander ce produit sans logo !</p>
                    <ul>
                        <li>Aucun minimum de commande</li>
                        <li>Les prix varient en fonction du nombre d'articles total de votre commande.</li>
                        <li>Pour les produits sans logo, recevez-les en 1 à 3 jours ouvrables.*</li>
                    </ul>
                `;
            }
        } else if (["DTF", "UV DTF", "Broderie", "Tampographie", "VividPrint", "ScreenPrint", "Engraving", "Patch"].includes(elementName)) {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "none" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            
            if (detailsContainer) {
                let detailText = "";
                if (elementName === "DTF") detailText = `<p>Nous pouvons personnaliser ce produit en impression DTF !</p><ul><li>Aucun minimum de commande.</li><li>Fichiers .png sans fond uniquement.</li></ul>`;
                else if (elementName === "UV DTF") detailText = `<p>Nous pouvons personnaliser ce produit en UV DTF !</p><ul><li>Aucun minimum de commande.</li><li>Fichiers .png sans fond uniquement.</li></ul>`;
                else if (elementName === "Broderie") detailText = decodeBase64UTF8(product.embroideryDetails) || `<p>Nous pouvons personnaliser ce produit en broderie !</p>`;
                else if (elementName === "Tampographie") detailText = decodeBase64UTF8(product.tampographieDetails) || `<p>Nous pouvons personnaliser ce produit en tampographie !</p>`;
                else if (elementName === "VividPrint") detailText = decodeBase64UTF8(product.vividPrintDetails) || `<p>Nous pouvons personnaliser ce produit en VividPrint !</p>`;
                else if (elementName === "ScreenPrint") detailText = decodeBase64UTF8(product.screenPrintDetails) || `<p>Nous pouvons personnaliser ce produit en sérigraphie !</p>`;
                else if (elementName === "Engraving") detailText = decodeBase64UTF8(product.engravingDetails) || `<p>Nous pouvons personnaliser ce produit en gravure !</p>`;
                else if (elementName === "Patch") detailText = decodeBase64UTF8(product.patchDetails) || `<p>Nous pouvons personnaliser ce produit avec un écusson !</p>`;
                
                detailsContainer.innerHTML = detailText;
            }
        }
    }

    updateActiveThumbnailWithLogos();
    updateLivePriceDisplay();
}

function openAdditionnalInfo(text) {
    let modal = document.getElementById('infoModal');
    if (!modal) {
        createInfoModalMarkup();
        modal = document.getElementById('infoModal');
    }

    const textContainer = document.getElementById('infoModalText');
    if (textContainer) {
        textContainer.textContent = text;
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

function createInfoModalMarkup() {
    const modalHtml = `
        <div id="infoModal" class="preview-modal" onclick="closeInfoModal()">
            <div class="modal-content info-modal-box" onclick="event.stopPropagation()">
                <span class="close-modal" onclick="closeInfoModal()">&times;</span>
                <p id="infoModalText" style="line-height: 1.5; font-size: 1rem;"></p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}