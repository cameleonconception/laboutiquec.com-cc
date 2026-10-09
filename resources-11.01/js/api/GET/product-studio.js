let product = {};
// Ajuste ce chiffre : si ton produit fait 10 pouces de large et ton canvas 500px, le ratio est 50.
let REFERENCE_CANVAS_WIDTH = 3240; 
let REFERENCE_PPI = 108;


// Cette variable sera mise à jour dynamiquement
let currentDynamicPPI = REFERENCE_PPI;


function parseImageFilename(fileName) {
    // 1. Extraire uniquement le nom du fichier (supprime les dossiers en amont)
    const cleanName = fileName.split('/').pop(); 
    
    // 2. Supprimer l'extension (.webp, .png, etc.) et découper par le symbole '-'
    const nameWithoutExtension = cleanName.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExtension.split('-'); 

    // 3. Extraction sécurisée du préfixe (ex: "Blanc" ou "thumbnail")
    const prefix = parts[0] || "";

    // 4. Extraction de la position (2ème élément)
    // parseInt convertit la chaîne en nombre. Si ce n'est pas un nombre, il renvoie 0.
    const position = parseInt(parts[1], 10) || 0;

    // 5. Extraction du timestamp (3ème élément, optionnel)
    // Si parts[2] existe, on le convertit en nombre. Sinon, on met 0 par défaut.
    const timestamp = parts[2] ? (parseInt(parts[2], 10) || 0) : 0;

    return {
        prefix: prefix,
        position: position,
        timestamp: timestamp,
        fullName: fileName
    };
}
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
                
                    /*
                    if (!product.customPersonalization && !product.dtf && !product.broderie && !product.tampographie && !product.vividPrint && !product.screenPrint && !product.engraving && !product.patch && !product.uvdtf) {
                        window.location.href=`./details?pid=${product.id}&selectedColor=${selectedColorFromURL}`;
                        return;
                    }
                        */
                

                    window.dispatchEvent(new CustomEvent('productLoaded', { 
                        detail: data
                    }));      
                    

                    
                    displayProductDetails(product, productContainer, data.similarProducts);
                    if (selectedColorFromURL && product.colors.includes(selectedColorFromURL)) {
                        const colorSelect = document.getElementById('color-select');
                        colorSelect.value = selectedColorFromURL;
                        
                        updateProductSize(selectedColorFromURL); 
                        // AJOUT ICI :
                        updateActiveThumbnail(selectedColorFromURL);
                    }

                    if (selectedColorFromURL && product.colors.includes(selectedColorFromURL)) {
                        const colorSelect = document.getElementById('color-select');
                        colorSelect.value = selectedColorFromURL;
                        
                        updateProductSize(selectedColorFromURL); 

                        
                    } else {
                        // Charger en mode "couleur vide" (mode miniatures séquence)
                        updateProductImage(""); 
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
    
    if (newImageSrc.includes('thumbnail')) { 
    if (selectedColor !== "") {
            colorSelect.value = "";
        }
    } else {
        // Analyse le nom de fichier actif pour détecter la couleur et la vue
        const parsed = parseImageFilename(newImageSrc);
        
        // Si c'est la vue n°1 et qu'elle correspond à une couleur existante
        if (parsed.position === 1 && product.colors.includes(parsed.prefix)) {
            if (selectedColor === "" || selectedColor !== parsed.prefix) {
                colorSelect.value = parsed.prefix;
                colorSelect.dispatchEvent(new Event('change'));
            }
        }
    }
    
    updateArrowVisibility(selectedColor);
    filterLogosByImage();
    updateLivePriceDisplay();
}

/**
 * Met à jour le conteneur d'images en fonction de la couleur sélectionnée.
 * Les images non trouvées seront retirées du DOM par le onerror.
 * @param {string} selectedColor La couleur sélectionnée, ou "" pour les miniatures.
 */
/**
 * Met à jour le conteneur d'images en fonction de la couleur sélectionnée
 * en utilisant le tableau product.imgNames.
 * @param {string} selectedColor La couleur sélectionnée, ou "" pour les miniatures.
 */
/**
 * Met à jour le conteneur d'images en fonction de la couleur sélectionnée
 * en utilisant le tableau product.imgNames.
 * @param {string} selectedColor La couleur sélectionnée, ou "" pour les miniatures.
 */
function updateProductImage(selectedColor) {
    const slideshowContainer = document.querySelector('.slideshowContainer');
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!slideshowContainer) return; 

    slideshowContainer.innerHTML = '';
    if (verticalContainer) verticalContainer.innerHTML = '';
    
    let imgNames = product.imgNames || [];

    if (typeof imgNames === 'string') {
        try {
            imgNames = JSON.parse(imgNames);
        } catch (e) {
            console.error("Erreur lors de la lecture du format JSON d'imgNames:", e);
            imgNames = [];
        }
    }

    if (!Array.isArray(imgNames)) {
        imgNames = [];
    }

    const isValidColor = selectedColor && product.colors && product.colors.includes(selectedColor);
    const targetPrefix = isValidColor ? selectedColor : 'thumbnail';

    let matchingImages = imgNames
        .map(name => parseImageFilename(name))
        .filter(img => img.prefix.toLowerCase() === targetPrefix.toLowerCase());

    matchingImages.sort((a, b) => {
        if (a.position !== b.position) {
            return a.position - b.position;
        }
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

    uniqueImages.forEach((imgData, index) => {
        const currentImageUrl = `../static-resources/products/${product.sku}/${imgData.fullName}`;
        
        // Image en grand
        const imageElement = document.createElement('img');
        imageElement.src = currentImageUrl;
        imageElement.alt = isValidColor 
            ? `Image du produit, couleur ${selectedColor} vue ${imgData.position}`
            : `Miniature du produit vue ${imgData.position}`;
            
        imageElement.style.display = (index === 0) ? 'block' : 'none'; 
        slideshowContainer.appendChild(imageElement);

        // Vignette miniature verticale à côté (s'il y a des images)
        if (verticalContainer) {
            const thumbWrapper = document.createElement('div');
            thumbWrapper.className = 'side-thumbnail-wrapper';
            thumbWrapper.style.position = 'relative';
            thumbWrapper.style.display = 'inline-block';

            const thumbImg = document.createElement('img');
            thumbImg.src = currentImageUrl;
            thumbImg.className = 'side-thumbnail' + (index === 0 ? ' active' : '');
            thumbImg.onclick = () => switchMainImage(index);

            // Conteneur pour superposer les visuels de logos en CSS
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

    updateArrowVisibility(selectedColor);
    window.scrollTo(top);
    initStudioCanvas();
    setTimeout(filterLogosByImage, 50);
}

/**
 * Remplace l'image principale visible par celle correspondant à l'index cliqué.
 */


function updateActiveThumbnailWithLogos() {
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!verticalContainer || !canvas) return;

    const activeWrapper = verticalContainer.querySelector('.side-thumbnail.active')?.parentElement;
    if (!activeWrapper) return;

    const overlay = activeWrapper.querySelector('.thumb-logo-overlay');
    if (!overlay) return;

    overlay.innerHTML = ''; // Nettoyer l'aperçu précédent

    // Récupérer les logos actifs sur cette vue
    const visibleLogos = canvas.getObjects().filter(obj => obj.visible && obj.imageOwner);

    visibleLogos.forEach(obj => {
        const imgEl = document.createElement('img');
        imgEl.src = obj.getElement().src;
        imgEl.style.position = 'absolute';

        // Calcul des ratios en pourcentage (%) par rapport au canvas principal
        const leftPercent = (obj.left / canvas.width) * 100;
        const topPercent = (obj.top / canvas.height) * 100;
        const widthPercent = (obj.getScaledWidth() / canvas.width) * 100;

        imgEl.style.left = leftPercent + '%';
        imgEl.style.top = topPercent + '%';
        imgEl.style.width = widthPercent + '%';
        imgEl.style.transform = 'translate(-50%, -50%)'; // Pour respecter l'originX/Y center de Fabric

        overlay.appendChild(imgEl);
    });
}

function switchMainImage(targetIndex) {
    // 1. Mettre à jour la vignette actuelle (avec logos) avant d'en changer
    updateActiveThumbnailWithLogos();

    const slideshowContainer = document.querySelector('.slideshowContainer');
    const verticalContainer = document.getElementById('vertical-thumbnails-container');
    if (!slideshowContainer) return;

    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    allImages.forEach((img, idx) => {
        img.style.display = (idx === targetIndex) ? 'block' : 'none';
    });

    if (verticalContainer) {
        const allThumbs = Array.from(verticalContainer.querySelectorAll('.side-thumbnail'));
        allThumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === targetIndex);
        });
    }

    const colorSelect = document.getElementById('color-select');
    updateArrowVisibility(colorSelect ? colorSelect.value : "");
    filterLogosByImage();
    updateLivePriceDisplay();
    
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

function displayProductDetails(product, container, similarProducts) {
    document.title = product.name;

    let activeHtml = product.active == 0 ? 'notActive' : '';

    // 1. INJECTION DE LA STRUCTURE ET DES IMAGES PRIORITAIRES
    container.innerHTML = `
        <div class="product-card ${activeHtml}" data-pid="${product.id}" data-pname="${product.name}" data-psku="${product.sku}">
            <!-- Conteneur global alignant les miniatures à côté de l'image principale -->
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
                        ${product.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                    </select>
                    <select id='personalization-select' style='display:none;'>
                        <option value=''>Choisir une option de personnalisation</option>
                        <option value='Aucune personnalisation' data-price='0'>Aucune personnalisation</option>
                    </select>

                    <div id="studio-actions-container" style='display:none;'>
                        <div id="studio-personalization-options-container"></div>
                        <div class="studio-title-row">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <label class="studio-upload-btn" style="margin-bottom:0;" for="logo-uploader">Ajouter un logo</label>
                            </div>
                            <span id="logo-counter-badge">0 logo</span>
                        </div>
                        <input type="file" id="logo-uploader" accept=".png" style="display:none;">
                        <div id="logo-list-container" style="display:none;"></div>
                        <div id="personalization-details"></div>
                    </div>
                    <div class="product-sizes" style='display:none;'></div>
                    <span id="smallProductSizeNote" style="display:none;">* Les prix affichés sont basés sur les quantités déjà dans votre panier...</span>
                    <div id="add-to-cart-error-container"></div> 
                    <div id="add-to-cart-container"></div>
                    <div id="technicalInfo">
                        <a href="./../static-resources/products/${product.sku}/Fiche technique.pdf">Fiche technique et grandeurs</a>
                        <p style="margin:-15px 0 -10px;">---</p>
                        <p class="light">Les prix varient en fonction du nombre d'articles total de votre commande ainsi que de la grandeur des logos.</p>
                        <p class="light">Des questions ou souhaitez vérifier l'inventaire ? <a href="https://cameleonconception.com/contact">Contactez-nous</a></p>
                        <div>
                        <p class="light">Catégorie(s) : </p>
                        ${product.categories.map(categorie => `<a href="../?categories=${categorie}"><span class="light">${categorie}</span></a>`).join('<span class="light">, </span>')}
                        </div>
                    </div> 
<div id="similarProductsContainer">
    <div id="similarScrollContainer" class="similar-scroll-container">
        <div class="similar-scroll-content">
            ${similarProducts.map(prod => {
                let targetImg = '';

                if (prod.imgNames && prod.imgNames.length > 0) {
                    // 1. Cherche une image qui contient "thumbnail-1"
                    const thumbImg = prod.imgNames.find(img => img.includes('thumbnail-1'));
                    
                    // 2. Si trouvée, on la prend, sinon on prend la première image disponible
                    targetImg = thumbImg ? thumbImg : prod.imgNames[0];
                }

                const imgSrc = targetImg ? `../static-resources/products/${prod.sku}/${targetImg}` : '';

                return `
                    <div class="similar-item" 
                         style="cursor: pointer;" 
                         onclick="window.location.href='./studio?sku=${prod.sku}'"
                    >
                        <img src="${imgSrc}" alt="${prod.name}" style="width: 100%; height: auto; margin-bottom:5px; border-radius: 6px;" />
                        <span class="" >${prod.name}</span>
                        <span class="light" >${prod.sku}</span>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
</div>
            </div>
        </div>
    `;
    


    // Écouteurs d'événements de base
    const uploader = document.getElementById('logo-uploader');
    uploader.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type !== "image/png") {
            alert("Désolé, seuls les fichiers PNG sont acceptés.");
            this.value = "";
            return;
        }
    });

    const colorSelect = document.getElementById('color-select');
    colorSelect.addEventListener('change', (e) => {
        updateProductSize(e.target.value);
    });

    // 2. CHARGEMENT DU TEXTE ET DES OPTIONS DE PERSONNALISATION
    setTimeout(() => {
        const textBlock = document.getElementById('text-info-block');
        textBlock.innerHTML = `
            <h1 class="title">${product.name}</h1>
            <p class='light' style="margin-top:-10px;">${product.supplier.name} - ${product.sku}</p>
            <p>${decodeBase64UTF8(product.description)}</p>
        `;
        textBlock.style.opacity = '1';
        document.getElementById('dynamic-controls-block').style.opacity = '1';

        let personalizationOptionsContainer = document.querySelector('#studio-personalization-options-container');
        personalizationOptionsContainer.innerHTML = ''; 

        if (product.customPersonalization) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Personnalisé" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">PERSONNALISÉ<span class="additionnalInfo" onclick="openAdditionnalInfo(\`Vous pouvez sélectionner les différentes options et personnaliser ce produit comme vous le voulez.\`)">?</span></div>`;
        }
        if (product.blank) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Blank" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">SANS LOGO <span class="additionnalInfo" onclick="openAdditionnalInfo(\`Vous pouvez à tout moment commander nos produits sans logo.\`)">?</span></div>`;
        }
        if (product.dtf) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="DTF" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Impression DTF <span class="additionnalInfo" onclick="openAdditionnalInfo(\`L'impression DTF permet de transférer n'importe quel visuel sur textile avec une excellente durabilité.\`)">?</span></div>`;
        }
        if (product.uvdtf) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="UV DTF" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">UV DTF <span class="additionnalInfo" onclick="openAdditionnalInfo(\`L'UV DTF est une technologie de transfert pour surface lisse.\`)">?</span></div>`;
        }
        if (product.broderie) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Broderie" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Broderie <span class="additionnalInfo" onclick="openAdditionnalInfo(\`La broderie est la méthode de personnalisation la plus haut de gamme.\`)">?</span></div>`;
        }
        if (product.tampographie) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Tampographie" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Tampographie <span class="additionnalInfo" onclick="openAdditionnalInfo(\`La tampographie est idéale pour les petits objets.\`)">?</span></div>`;
        }
        if (product.vividPrint) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="VividPrint" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">VividPrint <span class="additionnalInfo" onclick="openAdditionnalInfo(\`L'impression Vivid offre un éclat exceptionnel.\`)">?</span></div>`;
        }
        if (product.engraving) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Engraving" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Gravure laser <span class="additionnalInfo" onclick="openAdditionnalInfo(\`La gravure laser est indélébile.\`)">?</span></div>`;
        }
        if (product.patch) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="Patch" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Écusson <span class="additionnalInfo" onclick="openAdditionnalInfo(\`Les écussons s'appliquent directement sur vos textiles.\`)">?</span></div>`;
        }
        if (product.screenPrint) {
            personalizationOptionsContainer.innerHTML += `<div class="personalization-option" data-name="ScreenPrint" onclick="updateSelectedPersonalizationOption(event);event.stopPropagation()">Sérigraphie <span class="additionnalInfo" onclick="openAdditionnalInfo(\`La sérigraphie est idéale pour les moyennes et grandes séries.\`)">?</span></div>`;
        }

        const selectedColorFromURL = new URLSearchParams(window.location.search).get("selectedColor");
        if (selectedColorFromURL && product.colors && product.colors.includes(selectedColorFromURL)) {
            colorSelect.value = selectedColorFromURL;
            updateProductSize(selectedColorFromURL);
        }

        const firstOption = personalizationOptionsContainer.querySelector('.personalization-option');
        if (firstOption) {
            const fakeEvent = { target: firstOption };
            updateSelectedPersonalizationOption(fakeEvent);
        }

        initStudioCanvas();
    }, 50);

    // 3. CHARGEMENT DES VIGNETTES COULEURS
    setTimeout(() => {
        const colorContainer = document.getElementById('colorThumbnailsContainer');
        let colorThumbnailBloc = '';
        if (product.colors && product.colors.length > 0) {
            product.colors.forEach(color => {
                colorThumbnailBloc += `
                    <img title='${color}' class="color-thumbnail-image"
                        src="../static-resources/products/colors/${color}.webp" 
                        alt="Couleur ${color}" loading="lazy" 
                        onclick="document.getElementById('color-select').value='${color}'; updateProductSize('${color}');">`;
            });
        }
        colorContainer.innerHTML = colorThumbnailBloc;
        colorContainer.style.opacity = '1';
        
        const selectedColorFromURL = new URLSearchParams(window.location.search).get("selectedColor");
        if(selectedColorFromURL) updateActiveThumbnail(selectedColorFromURL);
        
    }, 150);

    updateArrowVisibility(colorSelect.value);
}



    function scrollSimilarProducts(direction) {
        const container = document.getElementById('similarProductsContainer');
        const scrollAmount = 320; // Largeur d'une carte (300px) + gap (20px)
        
        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }
    
    
// Définition de l'ordre des tailles pour le tri
const sizeOrder = [
    "S/M", "L/XL",
    "XS enf", "S enf", "M enf", "L enf", "XL enf",
    "XXS", "XS", "S", "M", "L", "XL", 
    "2XL", "3XL", "4XL", "5XL", 
    "2.5 X 2.25\"" , "3 X 2.69\"" , "3.5 X 3.14\"", "4 X 3.59\"",
    "24\" X 62\"", "24\" X 81\"", "33\" X 81\"", "47\" X 81\"",
];

/**
 * Met à jour les tailles et initialise la structure fixe du tableau.
 * Gère également la visibilité du sélecteur de personnalisation.
 */
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
        let sizes = product.variants[selectedColor] || [];

        sizes.sort((a, b) => {
            // Normalisation en majuscules pour éviter les problèmes de casse
            const sizeA = (a.size || '').trim().toUpperCase();
            const sizeB = (b.size || '').trim().toUpperCase();

            // 1. Récupération des index dans les règles personnalisées
            const indexA = sizeOrder.map(s => s.toUpperCase()).indexOf(sizeA);
            const indexB = sizeOrder.map(s => s.toUpperCase()).indexOf(sizeB);

            // CAS A : Les deux grandeurs existent dans le tableau de règles personnalisé -> Tri selon sizeOrder
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            // CAS B : Seulement A est dans sizeOrder -> A passe en premier
            if (indexA !== -1) return -1;

            // CAS C : Seulement B est dans sizeOrder -> B passe en premier
            if (indexB !== -1) return 1;

            // CAS D : Aucune des deux n'est dans sizeOrder -> Tri Alphanumérique standard (0-9 puis A-Z)
            return sizeA.localeCompare(sizeB, undefined, { numeric: true, sensitivity: 'base' });
        });

        sizes.forEach(size => {
            const sizeDiv = document.createElement('div');
            sizeDiv.classList.add('variantDiv');
            sizeDiv.dataset.rawPrice = size.price; 
            sizeDiv.dataset.sizeVariantId = size.variant_id;
            sizeDiv.dataset.sizeName = size.size;
            sizeDiv.dataset.sizeStock = size.stock;

            sizeDiv.innerHTML = `
                <input type="number" min="0" value="" inputmode="tel" placeholder='0'>
                <span class='sizeName'>${size.size}</span>
            `;

            sizeDiv.querySelector('input').addEventListener('input', updateLivePriceDisplay);
            productSizesContainer.appendChild(sizeDiv);
        });

        updateLivePriceDisplay();
        
        if (addToCartContainer) {
            addToCartContainer.innerHTML = `<button id="addToCartBtn" style="margin-top:0px;" onclick="addProductToCart()">Ajouter à ma demande</button>`;
            addToCartContainer.style.display = 'flex';
        }
        productSizesContainer.style.display = 'flex';
    } else {
        if (addToCartContainer) addToCartContainer.style.display = 'none';
        productSizesContainer.style.display = 'none';
    }

    // --- CORRECTION CLÉ ---
    // Rafraîchir l'option de personnalisation active pour réévaluer canShowPurchaseUI
    const activeOption = document.querySelector('.personalization-option.active');
    if (activeOption) {
        updateSelectedPersonalizationOption({ target: activeOption });
    }
}

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


function openAdditionnalInfo(text) {
    // Vérifier si la modale existe déjà, sinon on la crée
    let modal = document.getElementById('infoModal');
    
    if (!modal) {
        createInfoModalMarkup();
        modal = document.getElementById('infoModal');
    }

    // On injecte le texte dans le conteneur prévu
    const textContainer = document.getElementById('infoModalText');
    if (textContainer) {
        textContainer.textContent = text;
    }

    modal.style.display = "flex";
    
    // Empêcher le défilement de la page en arrière-plan
    document.body.style.overflow = "hidden";
}

/**
 * Ferme la modale d'information
 */
function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/**
 * Crée le HTML de la modale d'info (similaire à previewModal)
 */
function createInfoModalMarkup() {
    const modalHtml = `
        <div id="infoModal" class="preview-modal" onclick="closeInfoModal()" >
            <div class="modal-content info-modal-box" onclick="event.stopPropagation()">
                <span class="close-modal" onclick="closeInfoModal()">&times;</span>
                <p id="infoModalText" line-height: 1.5; font-size: 1rem; "></p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

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
 * Formule Studio : ((Prix_Initial/1.6) + Coût_DTF + Part_Livraison) * Multiplicateur_Marge
 */
/**
 * Formule Studio Modulaire : ((InitialCost) + Coût_Personnalisation + Part_Livraison) * Multiplicateur
 */
function calculateFinalPrice(rawPrice, addedQty, cartSuppQty, cartGlobalOtherSuppliersQty, shippingFee) {
    // 1. Préparation des variables numériques
    const numericRawPrice = parseFloat(rawPrice);
    const initialCost = numericRawPrice / 1.6; 
    const totalSuppQtySimulated = cartSuppQty + addedQty;

    // 2. Logique de livraison gratuite (Free Shipping)
    // On récupère le seuil depuis l'objet product chargé via l'API
    const thresholdRaw = product.supplier.freeShippingAt;
    const freeShippingThreshold = parseFloat(thresholdRaw);
    
    // On estime le montant d'achat chez ce fournisseur pour voir si on offre la livraison
    const estimatedTotalAmount = totalSuppQtySimulated * numericRawPrice;
    
    let currentShippingFee = shippingFee;

    // Si le seuil existe (pas null/vide) et que le montant estimé l'atteint ou le dépasse
    if (thresholdRaw !== null && thresholdRaw !== "" && estimatedTotalAmount >= freeShippingThreshold) {
        currentShippingFee = 0;
    }

    // 3. Calcul de la part de livraison par unité
    const shippingShare = currentShippingFee / (totalSuppQtySimulated > 0 ? totalSuppQtySimulated : 1);

    // 4. Calcul du coût de décoration (DTF, etc.)
    const activeOption = document.querySelector('.personalization-option.active');
    const method = activeOption ? activeOption.dataset.name : null;
    
    let decorationCostUnit = 0;
    if (method === "DTF") {
        decorationCostUnit = getDTFCostUnit(addedQty, cartSuppQty);
    }

    if (method === "UV DTF") {
        decorationCostUnit = getUVDTFCostUnit(addedQty, cartSuppQty);
    }
    // Note: Ajouter ici getBroderieCostUnit si nécessaire

    // 5. Sous-total (Coût de revient total)
    const subTotal = initialCost + decorationCostUnit + shippingShare;
    
    // 6. Multiplicateur de marge dégressif (Global)
    const totalGlobal = cartGlobalOtherSuppliersQty + totalSuppQtySimulated;
    let multiplier = 1.6;
    if (totalGlobal >= 50) multiplier = 1.3;
    else if (totalGlobal >= 26) multiplier = 1.4;

    return subTotal * multiplier;
}

/**
 * Calcule uniquement le coût unitaire technique du DTF (MO + Surface)
 */
function getDTFCostUnit(addedQty, cartSuppQty) {
    const allLogos = canvas ? canvas.getObjects().filter(obj => obj.imageOwner && obj.visible) : [];
    const logoCount = allLogos.length;

    if (logoCount === 0) return 0;

    // 1. Main d'oeuvre fixe (Brut)
    const mainOeuvre = 1.67 * logoCount;

    let globalSurfaceStandard = 0;
    let globalSurfaceGangSheet = 0;
    let totalQtyCustomizedInOrder = 0;

    // --- ANALYSE PANIER (On garde les chiffres bruts) ---
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
                        // Calcul SANS arrondi intermédiaire
                        globalSurfaceStandard += (w * h * itemQty);
                        globalSurfaceGangSheet += ((w + 0.125) * (h + 0.125) * itemQty);
                    });
                });
            }
        }
    });

    // --- ANALYSE LIVE (Brut) ---
    let currentSurfaceStandard = 0;
    let currentSurfaceGangSheet = 0;

    allLogos.forEach(obj => {
        const w = obj.getScaledWidth() / currentDynamicPPI;
        const h = obj.getScaledHeight() / currentDynamicPPI;
        currentSurfaceStandard += (w * h);
        currentSurfaceGangSheet += ((w + 0.125) * (h + 0.125));
    });

    const totalQtyCustomSimulated = totalQtyCustomizedInOrder + addedQty;
    
    // Frais de livraison (On ne l'arrondit PAS ici)
    const decoShippingShare = 2.50 / (totalQtyCustomSimulated > 0 ? totalQtyCustomSimulated : 1);

    const getRate = (area) => {
        // On utilise les surfaces brutes pour les paliers, c'est plus juste
        if (area >= 3000) return 0.017;
        if (area >= 1600) return 0.020;
        if (area >= 700) return 0.022;
        if (area >= 20) return 0.030;
        return 0.060;
    };

    // --- COMPARAISON (Sur les prix bruts) ---
    const totalAreaA = globalSurfaceStandard + (currentSurfaceStandard * addedQty);
    const rateA = getRate(totalAreaA);
    const costOptionA = (currentSurfaceStandard * rateA) + decoShippingShare;

    const totalAreaB = globalSurfaceGangSheet + (currentSurfaceGangSheet * addedQty);
    const rateB = getRate(totalAreaB);
    const costOptionB = (currentSurfaceGangSheet * rateB) + decoShippingShare;

    // On choisit le moins cher en brut
    const finalSurfaceAndShippingCost = Math.min(costOptionA, costOptionB);

    // --- ARRONDISSEMENT FINAL UNIQUE ---
    // On additionne tout et on arrondit seulement à la toute fin
    return Math.round((mainOeuvre + finalSurfaceAndShippingCost) * 100) / 100;
}

function getBroderieCostUnit(addedQty, cartSuppQty) {
    // Ici tu mettras ton calcul basé sur les points de couture (Stitches)
    // Pour l'instant on retourne 0 ou un prix fixe test
    return 0; 
}

/**
 * Calcule le coût unitaire technique du UV DTF avec logs de débogage.
 */
function getUVDTFCostUnit(addedQty, cartSuppQty) {
    const allLogos = canvas ? canvas.getObjects().filter(obj => obj.imageOwner && obj.visible) : [];
    const logoCount = allLogos.length;

    // console.log("--- DEBUG UV DTF ---");
    // console.log("Nombre de logos détectés:", logoCount);

    if (logoCount === 0) {
        // console.log("Aucun logo, coût décoration: 0");
        return 0;
    }

    // 1. Main d'oeuvre fixe (Brut)
    const mainOeuvre = 0.67 * logoCount;
    // console.log("Main d'œuvre (0.67$ x logos):", mainOeuvre.toFixed(3));

    let totalQtyCustomizedInOrder = 0;

    // --- ANALYSE DU PANIER ---
    const cart = JSON.parse(localStorage.getItem("cart/cc") || "[]");
    cart.forEach(item => {
        if (item.designSignature) {
            const itemQty = item.sizes.reduce((sum, s) => sum + s.qte, 0);
            totalQtyCustomizedInOrder += itemQty;
        }
    });
    // console.log("Quantité personnalisée déjà au panier:", totalQtyCustomizedInOrder);

    // --- ANALYSE LIVE (Surface actuelle) ---
    let currentSurfaceTotal = 0;
    allLogos.forEach((obj, index) => {
        const w = obj.getScaledWidth() / currentDynamicPPI;
        const h = obj.getScaledHeight() / currentDynamicPPI;
        const logoSurface = w * h;
        currentSurfaceTotal += logoSurface;
        // console.log(`Logo #${index + 1}: Dim[${w.toFixed(2)}" x ${h.toFixed(2)}"] Surface: ${logoSurface.toFixed(2)} po²`);
    });

    // 2. Calcul du partage des frais de 2,50 $
    const totalQtyCustomSimulated = totalQtyCustomizedInOrder + addedQty;
    const decoShippingShare = 2.50 / (totalQtyCustomSimulated > 0 ? totalQtyCustomSimulated : 1);
    
    // console.log("Partage des 2.50$ (2.50 / " + totalQtyCustomSimulated + "):", decoShippingShare.toFixed(3));

    // 3. Calcul du coût de surface (Prix fixe 0,036 $/pouce)
    const surfaceRate = 0.036;
    const costSurface = currentSurfaceTotal * surfaceRate;
    // console.log("Coût surface total (" + currentSurfaceTotal.toFixed(2) + " po² x 0.036$):", costSurface.toFixed(3));

    // --- RÉSULTAT FINAL ---
    const finalUnitCost = Math.round((mainOeuvre + costSurface + decoShippingShare) * 100) / 100;
    // console.log("COÛT UNITAIRE UV DTF (Technique):", finalUnitCost + "$");
    // console.log("--------------------");

    return finalUnitCost;
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





let canvas;

function initStudioCanvas() {
    const imgVisible = document.querySelector('.slideshowContainer img[style*="display: block"]');
    if (!imgVisible) return;

    const updateCanvasPosition = () => {
        const rect = imgVisible.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return;

        // --- LOGIQUE DE REDIMENSIONNEMENT DES LOGOS ---
        if (canvas) {
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;

            // Si la taille a réellement changé
            if (oldWidth !== rect.width || oldHeight !== rect.height) {
                const scaleRatio = rect.width / oldWidth;

                // On met à jour chaque logo sur le canevas
                canvas.getObjects().forEach(obj => {
                    if (obj.imageOwner) {
                        // On ajuste la position (Left/Top)
                        obj.set({
                            left: obj.left * scaleRatio,
                            top: obj.top * scaleRatio
                        });
                        // On ajuste la taille (ScaleX/ScaleY)
                        obj.scaleX *= scaleRatio;
                        obj.scaleY *= scaleRatio;
                        obj.setCoords(); // Crucial pour que Fabric détecte les nouvelles bordures
                    }
                });
                
                // On applique les nouvelles dimensions au canevas
                canvas.setDimensions({ width: rect.width, height: rect.height });
            }
        }

        
        REFERENCE_PPI = 108 * product.zoom;         

        // Mise à jour du PPI dynamique
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
// --- AJOUT DE LA LOGIQUE DE DÉTECTION "PROCHE DU LOGO" ---
    
    const wrapper = document.querySelector('.slideshowWrapper');
    if (wrapper) {
        // On écoute le mousedown sur le parent car le canvas est en pointer-events: none
        wrapper.addEventListener('mousedown', function(e) {
            // Si c'est déjà actif, on ne fait rien, Fabric gère
            const container = document.querySelector('.canvas-container');
            if (container.classList.contains('active')) return;

            // On demande à Fabric de chercher un objet aux coordonnées du clic
            // même si le pointer-events est à none, findTarget fonctionne avec l'événement brut
            const target = canvas.findTarget(e, false);

            if (target && target.imageOwner) {
                // Si on a trouvé un logo :
                container.classList.add('active'); // On active les clics sur le canvas
                canvas.setActiveObject(target);    // On sélectionne le logo
                canvas.renderAll();
                e.preventDefault();
            }
        });
    }

    // Gérer la désactivation quand on clique dans le vide
    canvas.on('selection:cleared', () => {
        document.querySelector('.canvas-container').classList.remove('active');
    });

    // -------------------------------------------------------

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
// --- CONFIGURATION DU RATIO ---
function setupKeyboardListeners() {
    document.addEventListener('keydown', function(e) {
        // Sécurité : ne pas déclencher si on tape dans un champ de saisie
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        const activeObject = canvas.getActiveObject();
        
        // 1. Touche Échap (Désélectionner) - Marche même si aucun objet n'est actif
        if (e.key === 'Escape') {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            return;
        }

        if (!activeObject) return;

        // Configuration du déplacement (Vitesse augmentée avec Shift)
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
                // Utilise ton ID unique pour supprimer via ta fonction existante
                deleteLogo(activeObject.id);
                e.preventDefault();
                break;
        }

        // Si on a bougé l'objet, on met à jour ses coordonnées et on redessine
        if (activeObject) {
            activeObject.setCoords();
            canvas.renderAll();
        }
    });
}



// À ajouter dans setupKeyboardListeners ou séparément :
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
        e.preventDefault();
    }
});

function undo() {
    if (canvasHistory.length > 0) {
        const lastState = canvasHistory.pop();
        canvas.loadFromJSON(lastState, function() {
            canvas.renderAll();
            // On rafraîchit la liste des logos et les prix
            filterLogosByImage();
            updateTotalLogoCounter();
            updateLivePriceDisplay();
        });
    }
}

// Nouvelle fonction utilitaire pour détecter les limites réelles et rogner le PNG vide
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

    // Analyse de chaque pixel (4 valeurs par pixel : R, G, B, A)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alphaIndex = ((y * width) + x) * 4 + 3; // Index du canal Alpha (Transparence)
            
            // Si le pixel n'est pas complètement transparent
            if (data[alphaIndex] > 0) {
                hasContent = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Si l'image est entièrement vide ou n'a pas besoin de rognage, on retourne la source d'origine
    if (!hasContent) return imgElement.src;

    // Ajouter une marge de sécurité de 1 pixel autour pour éviter les coupures nettes
    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(width - 1, maxX + 1);
    maxY = Math.min(height - 1, maxY + 1);

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;

    // Création du canvas final rogné
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;

    // On dessine uniquement la partie visible sur le nouveau canvas
    croppedCtx.drawImage(tempCanvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

    return croppedCanvas.toDataURL('image/png');
}

function setupUploadListener() {
    const uploader = document.getElementById('logo-uploader');
    if (!uploader) return;

uploader.onchange = function(e) {
    const currentProductImg = document.querySelector('.slideshowContainer img[style*="display: block"]');
    const currentImgSrc = currentProductImg ? currentProductImg.src : '';

    const reader = new FileReader();
    reader.onload = function(event) {
        const rawImg = new Image();
        rawImg.src = event.target.result;
        rawImg.onload = function() {
            
            // 1. Redimensionner le logo source pour éviter d'embarquer des Mo inutiles
            const MAX_LOGO_DIM = 1200; // 1200px est amplement suffisant pour l'édition et la preuve
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

            // 2. Appliquer le rognage automatique sur l'image compressée
            const resizedImg = new Image();
            resizedImg.src = resizeCanvas.toDataURL('image/png');

            resizedImg.onload = function() {
                const croppedSrc = cropTransparentEdges(resizedImg);

                const imgElement = new Image();
                imgElement.src = croppedSrc;
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

                    fabricImg.scaleToWidth(100);
                    canvas.add(fabricImg);
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
    reader.readAsDataURL(e.target.files[0]);
    this.value = ""; 
};

    canvas.on('object:scaling', (e) => {
        updateLogoDimensions(e.target);
        updateLivePriceDisplay(); 
    });
    canvas.on('object:modified', () => updateLivePriceDisplay());

    canvas.on('object:modified', () => {
    updateLivePriceDisplay();
    updateActiveThumbnailWithLogos(); // <-- Déclenché uniquement lorsque le logo est relâché
});

}

function addLogoToList(id, fabricObj) {
    const listContainer = document.getElementById('logo-list-container');
    const src = fabricObj.getElement().src;

    // 1. Vérification fiable via dataset.name au lieu du texte visible
    const activeOption = document.querySelector('.personalization-option.active');
    const isCustom = activeOption && activeOption.dataset.name === "Personnalisé";

    // Calcul des dimensions initiales
    const widthInch = (fabricObj.getScaledWidth() / currentDynamicPPI).toFixed(2);
    const heightInch = (fabricObj.getScaledHeight() / currentDynamicPPI).toFixed(2);

    const div = document.createElement('div');
    div.style.justifyContent = "space-between";
    div.className = 'logo-item';
    div.id = 'item_' + id;

    // 2. Génération du HTML selon le mode
    if (isCustom) {
        // Mode personnalisé : Miniature + bouton suppression (sans inputs de taille ni cadenas)
        div.innerHTML = `
            <img src="${src}" class="logo-thumbnail" alt="Aperçu logo">
            <button class="btn-delete-logo" onclick="deleteLogo('${id}')">x</button>
        `;
    } else {
        // Mode standard : Miniature + Inputs dimensions + Cadenas + Suppression
        div.innerHTML = `
            <img src="${src}" class="logo-thumbnail" alt="Aperçu logo">
            <div class="logo-dims-inputs">
                <input type="number" step="0.1" id="input_w_${id}" value="${widthInch}">
                <span>X</span>
                <input type="number" step="0.1" id="input_h_${id}" value="${heightInch}">
            </div>
            <button class="btn-lock-logo" title="Garder les proportions" onclick="toggleLock('${id}')">
                <img id="lock_img_${id}" src="../static-resources/default/icons/black/close-lock.png" width="16">
            </button>
            <button class="btn-delete-logo" onclick="deleteLogo('${id}')">x</button>
        `;
    }

    listContainer.appendChild(div);

    // 3. Écouteurs d'événements : uniquement si nous ne sommes PAS en 'Personnalisé'
    if (!isCustom) {
        const inputW = document.getElementById(`input_w_${id}`);
        const inputH = document.getElementById(`input_h_${id}`);

        if (inputW) {
            inputW.addEventListener('input', function() {
                const val = parseFloat(this.value);
                if (val > 0) {
                    if (fabricObj.uniformScaling) {
                        fabricObj.scaleToWidth(val * currentDynamicPPI);
                        if (inputH) inputH.value = (fabricObj.getScaledHeight() / currentDynamicPPI).toFixed(2);
                    } else {
                        fabricObj.set('scaleX', (val * currentDynamicPPI) / fabricObj.width);
                    }
                    canvas.renderAll();
                    updateLivePriceDisplay(); 
                }
            });
        }

        if (inputH) {
            inputH.addEventListener('input', function() {
                const val = parseFloat(this.value);
                if (val > 0) {
                    if (fabricObj.uniformScaling) {
                        fabricObj.scaleToHeight(val * currentDynamicPPI);
                        if (inputW) inputW.value = (fabricObj.getScaledWidth() / currentDynamicPPI).toFixed(2);
                    } else {
                        fabricObj.set('scaleY', (val * currentDynamicPPI) / fabricObj.height);
                    }
                    canvas.renderAll();
                    updateLivePriceDisplay();
                }
            });
        }
    }

    window.scrollTo(top);
}
function toggleLock(id) {
    const objects = canvas.getObjects();
    const fabricObj = objects.find(obj => obj.id === id);
    const lockImg = document.getElementById(`lock_img_${id}`);
    
    if (!fabricObj || !lockImg) return;

    // Inversion du verrouillage du ratio
    // uniformScaling à 'true' force le ratio. 'false' permet d'étirer.
    fabricObj.uniformScaling = !fabricObj.uniformScaling;

    if (fabricObj.uniformScaling) {
        // Mode Verrouillé : Image Cadenas Fermé
        lockImg.src = "../static-resources/default/icons/black/close-lock.png";
        // On remet à jour pour que le ratio soit respecté dès le prochain changement
    } else {
        // Mode Libre : Image Cadenas Ouvert
        lockImg.src = "../static-resources/default/icons/black/open-lock.png";
    }
}

function updateLogoDimensions(fabricObj) {
    // Si l'objet est un groupe ou n'a pas d'ID, on ignore
    if (!fabricObj || !fabricObj.id) return;
    
    const id = fabricObj.id;
    const inputW = document.getElementById('input_w_' + id);
    const inputH = document.getElementById('input_h_' + id);
    
    if (inputW && inputH) {
        // .getScaledWidth() est crucial car il prend en compte l'échelle (scaleX) appliquée par l'utilisateur
        const widthInch = (fabricObj.getScaledWidth() / currentDynamicPPI).toFixed(2);
        const heightInch = (fabricObj.getScaledHeight() / currentDynamicPPI).toFixed(2);
        
        inputW.value = widthInch;
        inputH.value = heightInch;
    }
}

function deleteLogo(id) {
    const objects = canvas.getObjects();
    const objToDelete = objects.find(obj => obj.id === id);
    if (objToDelete) {
        canvas.remove(objToDelete);
        updateTotalLogoCounter();
        updateLivePriceDisplay(); 
        
        // AJOUTER CETTE LIGNE :
        updateActiveThumbnailWithLogos(); 
    }
    const listItem = document.getElementById('item_' + id);
    if (listItem) listItem.remove();
}

function filterLogosByImage() {
    if (!canvas) return;

    // 1. Identifier l'image du produit active (celle dont display n'est pas 'none')
    const slideshowContainer = document.querySelector('.slideshowContainer');
    if (!slideshowContainer) return;

    const allImages = Array.from(slideshowContainer.querySelectorAll('img'));
    const currentProductImg = allImages.find(img => img.style.display !== 'none');
    const currentImgSrc = currentProductImg ? currentProductImg.src : '';

    if (!currentImgSrc) return;

    // 2. Filtrer les objets sur le Canvas sans perdre le focus si inutile
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

    // Ne désélectionner que si l'objet actif n'appartient pas à l'image courante
    const activeObj = canvas.getActiveObject();
    if (activeObj && activeObj.imageOwner !== currentImgSrc) {
        canvas.discardActiveObject();
    }

    canvas.renderAll();

    // 3. Filtrer la liste HTML des logos
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
    
    // On compte tous les objets qui ont un 'imageOwner' (nos logos)
    const allLogos = canvas.getObjects().filter(obj => obj.imageOwner);
    const count = allLogos.length;
    let logoListContainer = document.querySelector('#logo-list-container');
    
    const badge = document.getElementById('logo-counter-badge');
    if (badge) {
        badge.innerText = count + (count > 1 ? " logos" : " logo");
        
        // Change la couleur si on a des logos
        if (count > 0) {
            badge.classList.add('has-logos');
            logoListContainer.style.display = "flex";
        } else {
            badge.classList.remove('has-logos');
            logoListContainer.style.display = "none";
        }
    }

    updateLivePriceDisplay(count);
}

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

function updateSelectedPersonalizationOption(e) {
    let options = document.querySelectorAll('.personalization-option');
    
    let element = e.target.closest ? e.target.closest('.personalization-option') : e.target;
    if (!element) return;

    const colorSelect = document.getElementById('color-select');
    const isColorSelected = colorSelect && colorSelect.value !== "";

    const isAlreadyActive = element.classList.contains('active');
    if (!isAlreadyActive) {
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
    
    // SÉLECTION DU CANVAS POUR GÉRER SA VISIBILITÉ
    const canvasContainer = document.querySelector('.canvas-container') || document.getElementById('product-canvas');

    const canShowPurchaseUI = isColorSelected;
if (elementName === "Personnalisé") {

   // 1. Affichage / Masquage des blocs d'interface
    if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
    if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
    if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
    if (canvasContainer) canvasContainer.style.display = 'none'; // Masquer le canvas

    // 2. Injection du HTML dans le conteneur
    detailsContainer.innerHTML = decodeBase64UTF8(product.customPersonalizationDetails) || `
        <p>Vos logos seront utilisés par notre équipe pour vous préparer une épreuve selon les options que vous aurez sélectionnées ici.</p>
    `;

    // 3. Fonction pour mettre à jour l'étiquette de taille avec l'unité
    const updateSizeLabel = () => {
        const customSizeBlock = detailsContainer.querySelector('.customSize');
        
        if (customSizeBlock) {
            const inputW = customSizeBlock.querySelector('input[name="custom-size-w"]');
            const inputH = customSizeBlock.querySelector('input[name="custom-size-h"]');
            const firstSizeNameLabel = document.querySelector('.variantDiv .sizeName');

            if (firstSizeNameLabel && inputW && inputH) {
                const w = inputW.value.trim();
                const h = inputH.value.trim();

                // Récupération de l'unité depuis data-unit (ex: '"' ou "'")
                const unitW = inputW.dataset.unit || '';
                const unitH = inputH.dataset.unit || '';

                // Si au moins une valeur est présente, on applique le format avec symbole
                if (w !== '' || h !== '') {
                    const formattedW = w !== '' ? `${w}${unitW}` : 'L';
                    const formattedH = h !== '' ? `${h}${unitH}` : 'H';
                    firstSizeNameLabel.textContent = `${formattedW} x ${formattedH}`;
                    document.querySelector('.variantDiv').dataset.sizeName = `${formattedW} x ${formattedH}`;
                } else {
                    firstSizeNameLabel.textContent = "Unité";
                    document.querySelector('.variantDiv').dataset.sizeName =  "Unité";
                }

                
            }
        }
    };

    // 4. Attachement des écouteurs après le rendu HTML
    setTimeout(() => {
        const customSizeBlock = detailsContainer.querySelector('.customSize');
        
        if (customSizeBlock) {
            const inputW = customSizeBlock.querySelector('input[name="custom-size-w"]');
            const inputH = customSizeBlock.querySelector('input[name="custom-size-h"]');

            // Écoute des saisies sur les deux inputs
            if (inputW) {
                inputW.addEventListener('input', updateSizeLabel);
                inputW.addEventListener('keyup', updateSizeLabel);
            }
            if (inputH) {
                inputH.addEventListener('input', updateSizeLabel);
                inputH.addEventListener('keyup', updateSizeLabel);
            }

            // Mise à jour initiale
            updateSizeLabel();
        }
    }, 50);

}else if (elementName === "Blank") {
            if (studioTitleRow) studioTitleRow.style.display = "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            
            detailsContainer.innerHTML = decodeBase64UTF8(product.blankDetails) || `

                <p>Vous pouvez commander ce produit sans logo !</p>
                <ul>
                    <li>Aucun minimum de commande</li>
                    <li>Les prix varient en fonction du nombre d'articles total de votre commande.</li>
                    <li>Pour les produits sans logo, recevez-les en 1 à 3 jours ouvrables.*</li>
                </ul>
            `;

        } else if (elementName === "DTF") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            
            detailsContainer.innerHTML = `
                <p>Nous pouvons personnaliser ce produit en impression DTF !</p>
                <ul>
                    <li>Aucun minimum de commande.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 3 à 5 jours ouvrables pour les commandes de 100 unités et moins.</li>
                    <li>Aucun frais de matrice/montage</li>
                </ul>
               
            `;
        } else if (elementName === "UV DTF") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            
            detailsContainer.innerHTML = `
                <p>Nous pouvons personnaliser ce produit en UV DTF !</p>
                <ul>
                    <li>Aucun minimum de commande.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 3 à 5 jours ouvrables pour les commandes de 100 unités et moins.</li>
                    <li>Aucun frais de matrice/montage</li>
                </ul>

               
            `;
        } else if (elementName === "Broderie") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";

            detailsContainer.innerHTML = decodeBase64UTF8(product.embroideryDetails) || `

                 <p>Nous pouvons personnaliser ce produit en broderie !</p>
                <ul>
                    <li>Aucun minimum de commande.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 10-15 jours ouvrables.</li>
                    <li>Frais unique de 50$ + tx pour la création de la matrice de broderie (payable une fois par nouveau logo)</li>
                </ul>
            `;
        
        } else if (elementName === "Tampographie") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            
            detailsContainer.innerHTML = decodeBase64UTF8(product.tampographieDetails) || `
                <p>Nous pouvons personnaliser ce produit en tampographie !</p>
                <ul>
                    <li>Un minimum de commande pourrait être demandé.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 7 à 15 jours ouvrables.</li>
                    <li>Des frais de montage pourraient être ajoutés à la soumission.</li>
                </ul>
            `;
        } else if (elementName === "VividPrint") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            detailsContainer.innerHTML = decodeBase64UTF8(product.vividPrintDetails) || `
                <p>Nous pouvons personnaliser ce produit en vividPrint !</p>
                <ul>
                    <li>Un minimum de commande pourrait être demandé.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 7 à 15 jours ouvrables.</li>
                    <li>Des frais de montage pourraient être ajoutés à la soumission.</li>
                </ul>
            `;
        } else if (elementName === "ScreenPrint") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            detailsContainer.innerHTML = decodeBase64UTF8(product.screenPrintDetails) || `
                <p>Nous pouvons personnaliser ce produit en sérigraphie !</p>
                <ul>
                    <li>Un minimum de commande pourrait être demandé.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 5 à 15 jours ouvrables.</li>
                    <li>Des frais de montage pourraient être ajoutés à la soumission.</li>
                </ul>
            `;
        } else if (elementName === "Engraving") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            detailsContainer.innerHTML = decodeBase64UTF8(product.engravingDetails) || `
                <p>Nous pouvons personnaliser ce produit en gravure !</p>
                <ul>
                    <li>Un minimum de commande pourrait être demandé.</li>
                    <li>Fichiers .png sans fond uniquement.</li>
                    <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                    <li>Production en 5 à 15 jours ouvrables.</li>
                    <li>Des frais de montage pourraient être ajoutés à la soumission.</li>
                </ul>
            `;
        } else if (elementName === "Patch") {
            if (studioTitleRow) studioTitleRow.style.display = canShowPurchaseUI ? "flex" : "none";
            if (productSizes) productSizes.style.display = canShowPurchaseUI ? "flex" : "none";
            if (addToCartContainer) addToCartContainer.style.display = canShowPurchaseUI ? "flex" : "none";
            detailsContainer.innerHTML = decodeBase64UTF8(product.patchDetails) || `
            <p>Nous pouvons personnaliser ce produit avec un écusson !</p>
            <ul>
                <li>Minimum de 12 écussons identiques (peuvent être mis sur différents produits).</li>
                <li>Fichiers .png sans fond uniquement.</li>
                <li>Changez d'image pour ajouter votre logo à un autre emplacement <a href="https://laboutiquec.com/cc/static-resources/tutoriel/tutoriel-ajout-logo.webm">(voir tutoriel)</a>.</li>
                <li>Production en 5 à 15 jours ouvrables.</li>
                <li>Des frais de matrice pourraient être ajoutés à la soumission.</li>
            </ul>
            `;
        }

    // Fonction interne pour masquer les éléments de vente directe (pour les modes soumission)
    function hidePurchaseUI() {
        if (studioTitleRow) studioTitleRow.style.display = "none";
        if (productSizes) productSizes.style.display = "none";
        if (addToCartContainer) addToCartContainer.style.display = "none";
    }

    updateLivePriceDisplay(); 
}

// --- AJOUT DANS product.js ---

function duplicateProduct() {
    if (!product || !product.id) {
        alert("Erreur: Les données du produit ne sont pas chargées.");
        return;
    }

    const confirmation = confirm(`Voulez-vous vraiment dupliquer ce produit (${product.name}) ?`);
    if (!confirmation) return;

    const duplicateBtn = document.querySelector('#duplicateProductBtn');
    if (duplicateBtn) duplicateBtn.disabled = true;

    const formData = new FormData();
    formData.append('id', product.id);

    fetch("../api/superAdmin/DUPLICATE/product", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Produit dupliqué avec succès ! Vous allez être redirigé vers le nouveau produit.");
            
            // --- REDIRECTION SUR L'ID DU NOUVEAU PRODUIT ---
            window.location.href = `./studio?pid=${data.new_id}`;
        } else {
            alert("Erreur lors de la duplication : " + data.message);
            if (duplicateBtn) duplicateBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert("Une erreur réseau est survenue.");
        if (duplicateBtn) duplicateBtn.disabled = false;
    });
}