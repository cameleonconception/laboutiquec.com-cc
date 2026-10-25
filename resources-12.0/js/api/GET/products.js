window.lastLoadedProductsImgNames = {};
let totalLoadedProducts = 0; // Compteur global de produits affichés

function parseImageFilename(fileName) {
  if (!fileName || typeof fileName !== "string") {
    return { prefix: "", position: 0, timestamp: 0, fullName: "" };
  }

  const cleanName = fileName.split("/").pop().trim();
  const nameWithoutExtension = cleanName.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExtension.split("-");

  const prefix = (parts[0] || "").trim();
  const position = parseInt(parts[1], 10) || 0;
  const timestamp = parts[2] ? parseInt(parts[2], 10) || 0 : 0;

  return {
    prefix: prefix,
    position: position,
    timestamp: timestamp,
    fullName: cleanName,
  };
}

function getProductImageUrl(imgNamesRaw, targetPrefix, targetPosition = 1) {
  let imgNames = imgNamesRaw || [];

  if (typeof imgNames === "string") {
    try {
      imgNames = JSON.parse(imgNames);
    } catch (e) {
      imgNames = [];
    }
  }
  if (!Array.isArray(imgNames)) imgNames = [];
  if (imgNames.length === 0) return null;

  const parsedImages = imgNames.map((name) => parseImageFilename(name));
  const cleanTargetPrefix = (targetPrefix || "").trim().toLowerCase();

  let match = parsedImages.find(
    (img) =>
      img.prefix.trim().toLowerCase() === cleanTargetPrefix &&
      img.position === targetPosition,
  );

  if (!match && cleanTargetPrefix !== "thumbnail") {
    match = parsedImages.find(
      (img) =>
        img.prefix.trim().toLowerCase() === "thumbnail" &&
        img.position === targetPosition,
    );
  }

  return match ? match.fullName : null;
}

async function loadSageProducts(
  activePage,
  query,
  categoriesRaw,
  themesRaw, // <--- NOUVEAU
  productContainer,
) {
  try {
    const params = new URLSearchParams({
      page: activePage,
      query: query,
      categories: categoriesRaw,
      themes: themesRaw || '' // <--- NOUVEAU
    });

    const response = await fetch('./api/GET/sageProducts?' + params.toString());
    const data = await response.json();

    if (
      data &&
      data.ok &&
      Array.isArray(data.products) &&
      data.products.length > 0
    ) {
      let sageProductsArray = data.products;

      for (const product of sageProductsArray) {
        const skeleton = productContainer.querySelector(".skeleton-card");
        if (skeleton) skeleton.remove();

        totalLoadedProducts++;

        const baseSku = product.spc || product.prodEId;
        const productName = product.name || "Nom inconnu";

        let initialImageSrc =
          product.thumbPic ||
          "./static-resources/default/products/introuvable.webp";

        if (product.thumbPic) {
          initialImageSrc = product.thumbPic.replace(/RS=[^&]+/, "RS=1800");
        }

        window.lastLoadedProductsImgNames[baseSku] =
          product.thumbPic ? [product.thumbPic] : [];

        let formattedPrice = "";
        if (product.prc) {
          const prices = product.prc
            .split("-")
            .map((p) => parseFloat(p.trim()))
            .filter((p) => !isNaN(p));
          if (prices.length > 0) {
            const lowest = (prices[0] / 1.6) * 1.3;
            formattedPrice = lowest.toFixed(2).replace(".", ",");
          }
        }

        const cardRedirectUrl = `./produits/details?eid=${product.prodEId}`;

        const card = document.createElement("div");
        card.className = `product-card`;
        card.onclick = () => (window.location.href = cardRedirectUrl);

        card.innerHTML = `
            <div class="thumbnail-wrapper" data-sku="${baseSku}" data-real-sku="${baseSku}" data-prefix="thumbnail"> 
                <span class="product-tag-usine">Directement de l'usine</span>
                <div class="thumbnail-skeleton"></div> 
                <img id="img-${baseSku}" 
                    class="product-image"
                    src="${initialImageSrc}" 
                    alt="Image du produit ${escapeHTML(productName)}"
                    data-current-thumb="1"
                    loading="lazy" 
                    onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';" 
                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                
                <div class='thumb-nav-container' style="display:none;">
                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${baseSku}', -1); event.stopPropagation();">&lt;</button>
                    <button class="thumb-nav thumb-next disabled" onclick="switchThumbnailOnDemand('${baseSku}', 1); event.stopPropagation();">&gt;</button>
                </div>
            </div>
            <div class="product-info-wrapper"></div>
            <div class="color-thumbnails-wrapper"></div>
        `;

        productContainer.appendChild(card);

        setTimeout(() => {
          const infoWrapper = card.querySelector(".product-info-wrapper");
          if (infoWrapper) {
            infoWrapper.innerHTML = `
                <div class="product-info">
                    <h3>${escapeHTML(productName)}</h3>
                    <p>${baseSku}</p>
                    <p style="display:none;">À partir de : ${formattedPrice} $</p>
                </div>
            `;
          }
        }, 50);
      }
    }

    productContainer
      .querySelectorAll(".skeleton-card")
      .forEach((sk) => sk.remove());

    if (totalLoadedProducts === 0) {
      showNoProductsMessage(productContainer);
    }
  } catch (error) {
    console.error("Erreur lors du chargement des produits Sage:", error);
    productContainer
      .querySelectorAll(".skeleton-card")
      .forEach((sk) => sk.remove());
    if (totalLoadedProducts === 0) {
      showNoProductsMessage(productContainer);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  let productContainer = document.getElementById("products-container");
  let filterSection = document.getElementById("filter-section");

  showSkeletons(productContainer, 10);

  const URL = window.location.search;
  const searchParams = new URLSearchParams(URL);
  const activePage = parseInt(searchParams.get("page")) || 1;
  const query = searchParams.get("query") || "";
  let categoriesRaw = searchParams.get("categories") || "";
  let themesRaw = searchParams.get("themes") || ""; // <--- DÉCLARATION MANQUANTE ICI

  let categories = categoriesRaw ? categoriesRaw.split(",") : [];
  let themes = themesRaw ? themesRaw.split(",") : []; // <--- AJOUT POUR DÉCOUPER LES THÈMES

  // --- 1. CHARGEMENT DE VOS PRODUITS (PRIORITAIRES) ---
  fetch(
    "./api/GET/products?page=" +
      activePage +
      "&query=" +
      encodeURIComponent(query) +
      "&categories=" +
      encodeURIComponent(categoriesRaw) +
      "&themes=" +
      encodeURIComponent(themesRaw),
  )
    .then((response) => response.json())
    .then((data) => {
      if (data && data.success) {
        let productsArray = data.products;
        let superAdminCategoriesList =
          document.querySelector("#categories-list");
        let superAdminColorsList = document.querySelector("#colors-list");
        let superAdminSizesList = document.querySelector("#sizes-list");

        if (data.sizes) {
          data.sizes.forEach((size) => {
            if (superAdminSizesList) {
              superAdminSizesList.innerHTML +=
                '<option value="' + size["name"] + '">';
            }
          });
        }

        productsArray.forEach((p) => {
          window.lastLoadedProductsImgNames[p.sku] = p.imgNames;
        });

        if (data.colors) {
          data.colors.forEach((color) => {
            if (superAdminColorsList) {
              superAdminColorsList.innerHTML +=
                '<option value="' + color["name"] + '">';
            }
          });
        }

        let categoriesHTML = '';
        let themesHTML = '';
        if (data.categories) {
            data.categories.forEach(categorie => {
                const frName = (categorie.fr_name || categorie.name || '').trim();
                const enName = (categorie.en_name || '').trim();
                const defaultName = frName || enName;
                const paramType = categorie.param || 'categorie'; // 'categorie' ou 'theme'
                const originType = categorie.origin || 'bd';      // 'bd' ou 'sage'

                if (superAdminCategoriesList) {
                    superAdminCategoriesList.innerHTML += '<option value="' + escapeHTML(defaultName) + '">';
                }

                // Vérifie si l'élément est coché selon les URL params
                const targetArray = (paramType === 'theme') ? themes : categories;
                let isChecked = targetArray.includes(defaultName) || (enName && targetArray.includes(enName));

                let isValid = data.validCategories ? (data.validCategories.includes(defaultName) || data.validCategories.includes(enName)) : true;
                let isDisabled = !isChecked && !isValid;
                let safeCatName = escapeHTML(defaultName);

                const normFr = removeAccents(frName);
                const normEn = removeAccents(enName);

                const itemHTML = `
                    <div class='checkboxFilterContainer ${isDisabled ? 'disabled-filter' : ''}'
                         data-fr="${escapeHTML(frName)}"
                         data-en="${escapeHTML(enName)}"
                         data-fr-normalized="${escapeHTML(normFr)}"
                         data-en-normalized="${escapeHTML(normEn)}">
                        <input type='checkbox' 
                               data-type='categories' 
                               data-name="${safeCatName}" 
                               data-en="${escapeHTML(enName)}"
                               data-param="${escapeHTML(paramType)}" 
                               data-origin="${escapeHTML(originType)}" 
                               ${isChecked ? 'checked' : ''} 
                               ${isDisabled ? 'disabled' : ''}>
                        <label>
                            <span class="cat-label-fr">${escapeHTML(frName)}</span>
                        </label>
                    </div>`;

                if (paramType === 'theme') {
                    themesHTML += itemHTML;
                } else {
                    categoriesHTML += itemHTML;
                }
            });
        }
        if (!categoriesHTML) {
            categoriesHTML = '<div class="checkboxFilterContainer">Aucune catégorie trouvée</div>';
        }
        if (!themesHTML) {
            themesHTML = '<div class="checkboxFilterContainer">Aucun thème trouvé</div>';
        }

        // Injection du code dans filterSection
        filterSection.innerHTML = `
                    <details>
                        <summary>Catégories</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher une catégorie" 
                                   onkeyup="filterList(this, 'categories-container')">
                            <div id="categories-container">${categoriesHTML}</div>
                            <button onclick='searchProduct()'>Filtrer</button>
                        </div>
                    </details>
                    <details>
                        <summary>Thèmes</summary>
                        <div class='developedDetails'>
                            <input type="text" class="filter-search" placeholder="Rechercher un thème"
                                   onkeyup="filterList(this, 'themes-container')">
                            <div id="themes-container">${themesHTML}</div>
                            <button onclick='searchProduct()'>Filtrer</button>
                        </div>
                    </details>
                    <input id='searchBar' type='search' placeholder='Rechercher...' value='${query}'>
                    <button onclick='searchProduct()'>Filtrer</button>
                    <a class='toHideInBigScreen' href='./produits'>Supprimer les filtres</a>
                    <img onclick='window.location.href="./produits"' class='icons' src='static-resources/default/icons/black/reload.png'>
                `;

        const searchBarInput = document.querySelector("#searchBar");
        if (searchBarInput) {
          searchBarInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
              event.preventDefault();
              searchProduct();
            }
          });
        }

        // Badges
        const ownedCategory = document.querySelector("#ownedCategory");
        if (ownedCategory) {
          ownedCategory.innerHTML = "";
          const activeCategories = categories.filter(
            (cat) => cat.trim() !== "",
          );
          const activeThemes = themes.filter((theme) => theme.trim() !== "");

          if (
            activeCategories.length === 0 &&
            activeThemes.length === 0
          ) {
            ownedCategory.style.display = "none";
          } else {
            ownedCategory.style.display = "flex";
            activeCategories.forEach((cat) =>
              addNewCategoryBadge(cat, "categories"),
            );
            activeThemes.forEach((theme) =>
              addNewCategoryBadge(theme, "themes"),
            );
          }
        }

        // Si des produits locaux existent, on vide les skeletons initiaux
        if (productsArray.length > 0) {
          productContainer.innerHTML = "";
        }

        // Rendu des produits internes
        productsArray.forEach((product) => {
          const baseSku = product.sku;
          let view =
            product.dtf || product.broderie || product.uvdtf ?
              "studio"
            : "details";

          product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
          const formattedPrice = parseFloat(product.lowestPrice)
            .toFixed(2)
            .replace(".", ",");
          let activeHtml = product.active == 0 ? "notActive" : "";

          let colorsToRender = [null];

          colorsToRender.forEach((currentColor) => {
            totalLoadedProducts++; // Incrémente le compteur

            const uniqueCardId =
              currentColor ?
                `${baseSku}-${currentColor.replace(/\s+/g, "_")}`
              : baseSku;
            const targetPrefix =
              currentColor ? currentColor.trim() : "thumbnail";
            const foundImageName = getProductImageUrl(
              product.imgNames,
              targetPrefix,
              1,
            );

            let initialImageSrc =
              foundImageName ?
                `static-resources/products/${baseSku}/${foundImageName}`
              : `./static-resources/default/products/introuvable.webp`;

            let cardRedirectUrl = `./produits/${view}?pid=${product.id}`;
            if (currentColor) {
              cardRedirectUrl += `&selectedColor=${encodeURIComponent(currentColor)}`;
            }

            const card = document.createElement("div");
            card.className = `product-card ${activeHtml}`;
            card.onclick = () => (window.location.href = cardRedirectUrl);

            card.innerHTML = `
                            <div class="thumbnail-wrapper" data-sku="${uniqueCardId}" data-real-sku="${baseSku}" data-prefix="${targetPrefix}"> 
                                <span class="product-tag-usine">Directement de l'usine</span>
                                <div class="thumbnail-skeleton"></div> 
                                <img id="img-${uniqueCardId}" 
                                    class="product-image"
                                    src="${initialImageSrc}" 
                                    alt="Image du produit ${product.name} ${currentColor ? "- " + currentColor : ""}"
                                    data-current-thumb="1"
                                    loading="lazy" 
                                    onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';" 
                                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                                
                                <div class='thumb-nav-container'>
                                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                                    <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                                </div>
                            </div>
                            <div class="product-info-wrapper"></div>
                            <div class="color-thumbnails-wrapper"></div>
                        `;

            productContainer.appendChild(card);

            setTimeout(() => {
              const infoWrapper = card.querySelector(".product-info-wrapper");
              if (infoWrapper) {
                infoWrapper.innerHTML = `
                                    <div class="product-info">
                                        <h3>${product.name}</h3>
                                        <p>${baseSku}</p>
                                        <p style="display:none;">À partir de : ${formattedPrice} $</p>
                                    </div>
                                `;
              }
            }, 50);

            setTimeout(() => {
              const colorWrapper = card.querySelector(
                ".color-thumbnails-wrapper",
              );
              let colorThumbnailBloc = "";
              if (product.availableColors) {
                product.availableColors.forEach((color) => {
                  let isCurrentClass =
                    color === currentColor ? "active-color-thumb" : "";
                  let safeColor = escapeHTML(color);
                  let encodedColor = encodeURIComponent(color);

                  colorThumbnailBloc += `<img title="${safeColor}"
                                        class="color-thumbnail-image ${isCurrentClass}"
                                        src="static-resources/products/colors/${encodedColor}.webp" 
                                        alt="Image de la couleur ${safeColor}"
                                        loading="lazy" 
                                        onclick="window.location.href='./produits/${view}?pid=${product.id}&selectedColor=${encodedColor}'; event.stopPropagation();"
                                    >`;
                });
              }
              if (colorWrapper) colorWrapper.innerHTML = colorThumbnailBloc;
            }, 150);

            updateThumbnailNavVisibility(uniqueCardId);
          });
        });

        let supplierSelect = document.querySelector("#supplier");
        if (data.suppliers && supplierSelect) {
          data.suppliers.forEach((supplier) => {
            supplierSelect.innerHTML +=
              "<option value='" +
              supplier.id +
              "'>" +
              supplier.name +
              "</option>";
          });
        }

        if (data.totalProducts !== undefined) {
          initInfiniteScroll(
            activePage,
            data.totalProducts,
            data.itemsPerPage,
          );
        }
      }

      // --- 2. APRES VOS PRODUITS, ON CHARGE LES PRODUITS SAGE ---
      loadSageProducts(
        activePage,
        query,
        categoriesRaw,
        themesRaw,
        productContainer,
      );
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des produits locaux:", error);
      loadSageProducts(
        activePage,
        query,
        categoriesRaw,
        themesRaw,
        productContainer,
      );
    });
});

function removeAccents(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function filterList(input, containerId) {
    const filter = removeAccents(input.value);
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = container.getElementsByClassName('checkboxFilterContainer');

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const normFr = item.getAttribute('data-fr-normalized');
        const normEn = item.getAttribute('data-en-normalized');

        // Cas des catégories avec gestion bilingue et sans accents
        if (normFr !== null || normEn !== null) {
            if (!filter) {
                item.style.display = "";
                continue;
            }

            const matchFr = normFr ? normFr.includes(filter) : false;
            const matchEn = normEn ? normEn.includes(filter) : false;

            if (matchFr) {
                // Priorité 1 : trouvé en français
                item.style.display = "";
            } else if (matchEn) {
                // Priorité 2 : trouvé en anglais
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        } else {
            // Repli pour les couleurs (qui bénéficient aussi de la suppression des accents)
            const label = item.getElementsByTagName('label')[0];
            const textValue = label ? (label.textContent || label.innerText) : '';
            if (removeAccents(textValue).includes(filter)) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        }
    }
}

function switchThumbnailOnDemand(uniqueCardId, direction) {
  const imgElement = document.getElementById(`img-${uniqueCardId}`);
  if (!imgElement) return;

  const thumbnailWrapper = imgElement.closest(".thumbnail-wrapper");
  const realSku =
    thumbnailWrapper.getAttribute("data-real-sku") || uniqueCardId;
  const prefix = thumbnailWrapper.getAttribute("data-prefix") || "thumbnail";

  let currentThumb =
    parseInt(imgElement.getAttribute("data-current-thumb")) || 1;
  const nextThumb = currentThumb + direction;

  if (nextThumb < 1) return;

  const rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];
  const foundImageName = getProductImageUrl(rawImgNames, prefix, nextThumb);

  if (!foundImageName) return;

  const skeletonElement = imgElement.previousElementSibling;
  imgElement.classList.remove("loaded");
  if (
    skeletonElement &&
    skeletonElement.classList.contains("thumbnail-skeleton")
  ) {
    skeletonElement.style.display = "block";
  }

  const nextSrc = `static-resources/products/${realSku}/${foundImageName}`;

  const tempImg = new Image();
  tempImg.onload = function () {
    imgElement.src = nextSrc;
    imgElement.setAttribute("data-current-thumb", nextThumb.toString());
    imgElement.classList.add("loaded");
    if (skeletonElement) skeletonElement.style.display = "none";
    updateThumbnailNavVisibility(uniqueCardId);
  };

  tempImg.onerror = function () {
    imgElement.src = "./static-resources/default/products/introuvable.webp";
    imgElement.classList.add("loaded");
    if (skeletonElement) skeletonElement.style.display = "none";
  };

  tempImg.src = nextSrc;
}

function updateThumbnailNavVisibility(uniqueCardId) {
  const imgElement = document.getElementById(`img-${uniqueCardId}`);
  if (!imgElement) return;

  const thumbnailWrapper = imgElement.closest(".thumbnail-wrapper");
  if (!thumbnailWrapper) return;

  const navContainer = thumbnailWrapper.querySelector(".thumb-nav-container");
  const prevBtn = thumbnailWrapper.querySelector(".thumb-prev");
  const nextBtn = thumbnailWrapper.querySelector(".thumb-next");

  const realSku =
    thumbnailWrapper.getAttribute("data-real-sku") || uniqueCardId;
  const prefix = thumbnailWrapper.getAttribute("data-prefix") || "thumbnail";
  const currentThumb =
    parseInt(imgElement.getAttribute("data-current-thumb")) || 1;

  let rawImgNames = window.lastLoadedProductsImgNames?.[realSku] || [];
  if (typeof rawImgNames === "string") {
    try {
      rawImgNames = JSON.parse(rawImgNames);
    } catch (e) {
      rawImgNames = [];
    }
  }

  const matchingImages = rawImgNames.filter((fileName) => {
    const parsed = parseImageFilename(fileName);
    return parsed.prefix.toLowerCase() === prefix.toLowerCase();
  });

  let count = matchingImages.length;
  if (count === 0 && prefix.toLowerCase() !== "thumbnail") {
    count = rawImgNames.filter((fileName) => {
      const parsed = parseImageFilename(fileName);
      return parsed.prefix.toLowerCase() === "thumbnail";
    }).length;
  }

  if (count <= 1) {
    if (navContainer) navContainer.style.display = "none";
    return;
  }

  if (navContainer) navContainer.style.display = "flex";

  if (prevBtn) {
    if (currentThumb <= 1) {
      prevBtn.classList.add("disabled");
    } else {
      prevBtn.classList.remove("disabled");
    }
  }

  if (nextBtn) {
    const nextImageName = getProductImageUrl(
      rawImgNames,
      prefix,
      currentThumb + 1,
    );
    if (!nextImageName) {
      nextBtn.classList.add("disabled");
    } else {
      nextBtn.classList.remove("disabled");
    }
  }
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

function addNewCategoryBadge(value, type) {
  let ownedCategory = document.querySelector("#ownedCategory");
  if (!ownedCategory) return;

  const badgeDiv = document.createElement("div");
  badgeDiv.setAttribute("data-filter-value", value);
  badgeDiv.classList.add("badge-filter");
  if (type === "themes") badgeDiv.classList.add("badge-filter-theme");

  let imageHtml = "";
  if (type === "colors") {
    const safeValue = escapeHTML(value);
    imageHtml = `<img title="${safeValue}" class="color-thumbnail-image"
            src="./static-resources/products/colors/${encodeURIComponent(value)}.webp"
            alt="Couleur ${safeValue}" loading="lazy">`;
  }

  const checkbox = Array.from(
    document.querySelectorAll('input[type="checkbox"]'),
  ).find((input) => {
    if (type === "categories" || type === "themes") {
      return (
        input.dataset.type === "categories" &&
        input.dataset.param === (type === "themes" ? "theme" : "categorie") &&
        (input.dataset.en === value || input.dataset.name === value)
      );
    }
    return input.dataset.type === type && input.dataset.name === value;
  });
  const displayValue =
    (type === "categories" || type === "themes") && checkbox ?
      checkbox.dataset.name || value
    : value;
  badgeDiv.innerHTML = `${imageHtml}<span>${escapeHTML(displayValue)}</span><button type="button" class="deleteBtn">x</button>`;

  badgeDiv.querySelector(".deleteBtn").onclick = () => {
    if (checkbox) {
      checkbox.checked = false;
    }
    badgeDiv.remove();
    searchProduct();
  };

  ownedCategory.appendChild(badgeDiv);
}

function searchProduct() {
  let searchBar = document.querySelector("#searchBar");
  let searchBarValue = searchBar ? searchBar.value.trim() : "";

  let checkedCategories = [];
  let checkedThemes = [];

  document
    .querySelectorAll('input[type="checkbox"][data-type="categories"]:checked')
    .forEach((catInput) => {
      const paramType = catInput.dataset.param || 'categorie';
      const originType = catInput.dataset.origin || 'bd';
      
      // Si l'origine est Sage, envoyer en priorité le nom anglais pour l'API
      const valueToSend = (originType === 'sage' && catInput.dataset.en)
        ? catInput.dataset.en
        : catInput.dataset.name;

      if (paramType === 'theme') {
        checkedThemes.push(valueToSend);
      } else {
        checkedCategories.push(valueToSend);
      }
    });

  const params = new URLSearchParams();
  if (searchBarValue) params.set("query", searchBarValue);
  if (checkedCategories.length > 0) params.set("categories", checkedCategories.join(","));
  if (checkedThemes.length > 0) params.set("themes", checkedThemes.join(",")); // <--- NOUVEAU

  window.location.href = "./produits?" + params.toString();
}

function syncUIWithServerResponse(response) {
  if (!response || !response.success) return;

  if (response.appliedCategories && Array.isArray(response.appliedCategories)) {
    response.appliedCategories.forEach((catName) => {
      let el = document.querySelector(
        `input[type="checkbox"][data-type="categories"][data-name="${catName}"]`,
      );
      if (el) el.checked = true;
    });
  }

  if (response.appliedColors && Array.isArray(response.appliedColors)) {
    response.appliedColors.forEach((colorName) => {
      let el = document.querySelector(
        `input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`,
      );
      if (el) el.checked = true;
    });
  }
}

function autoSelectAppliedFilters(appliedCategories = [], appliedColors = []) {
  appliedCategories.forEach((catName) => {
    let checkbox = document.querySelector(
      `input[type="checkbox"][data-type="categories"][data-name="${catName}"]`,
    );
    if (checkbox) checkbox.checked = true;
  });

  appliedColors.forEach((colorName) => {
    let checkbox = document.querySelector(
      `input[type="checkbox"][data-type="colors"][data-name="${colorName}"]`,
    );
    if (checkbox) checkbox.checked = true;
  });
}

function toggleFilterSection() {
  let toggleBtn = document.querySelector("#toggle-filter-section");
  let filterSection = document.querySelector("#filter-section");
  let icon = document.querySelector("#toggle-filter-section img");

  toggleBtn.classList.toggle("open");

  if (toggleBtn.classList.contains("open")) {
    filterSection.style.display = "flex";
    icon.src = "static-resources/default/icons/white/x.png";
    toggleBtn.classList.add("fullWidth");
  } else {
    filterSection.style.display = "none";
    icon.src = "static-resources/default/icons/white/filter-2.png";
    toggleBtn.classList.remove("fullWidth");
  }
}

function showSkeletons(container, count = 8) {
  let skeletonsHtml = "";
  for (let i = 0; i < count; i++) {
    skeletonsHtml += `<div class="skeleton-card"></div>`;
  }
  container.innerHTML = skeletonsHtml;
}

// Chargement des lots suivants au défilement, sans pagination visible.
function initInfiniteScroll(currentPage, totalProducts, productsPerPage) {
  if (!Number.isInteger(productsPerPage) || productsPerPage < 1) {
    console.error("Taille de lot invalide pour le chargement des produits.");
    return;
  }

  const pageCount = Math.ceil(totalProducts / productsPerPage);

  const productContainer = document.getElementById("products-container");
  if (!productContainer) return;

  let loadingNext = false;
  let nextPage = currentPage + 1;

  if (currentPage < pageCount) {
    const sentinelNext = document.createElement("div");
    sentinelNext.className = "products-load-sentinel";
    sentinelNext.style.cssText = "height:1px; margin-top:40px;";
    productContainer.appendChild(sentinelNext);

    const observerNext = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loadingNext) return;
        if (nextPage > pageCount) {
          observerNext.disconnect();
          return;
        }

        loadingNext = true;
        const batchSkeletons = Array.from({ length: 8 }, () => {
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-card batch-skeleton";
          productContainer.insertBefore(skeleton, sentinelNext);
          return skeleton;
        });

        const searchParams = new URLSearchParams(window.location.search);
        const query = searchParams.get("query") || "";
        const categoriesRaw = searchParams.get("categories") || "";
        const themesRaw = searchParams.get("themes") || ""; // <--- NOUVEAU

        fetch(
          `./api/GET/products?page=${nextPage}&query=${encodeURIComponent(query)}&categories=${encodeURIComponent(categoriesRaw)}&themes=${encodeURIComponent(themesRaw)}`,
        )
          .then((r) => r.json())
          .then((data) => {
            batchSkeletons.forEach((skeleton) => skeleton.remove());
            if (!data || !data.success || !Array.isArray(data.products)) {
              throw new Error("Réponse invalide lors du chargement des produits.");
            }
            if (data.products.length === 0) {
              observerNext.disconnect();
              sentinelNext.remove();
              return;
            }

            data.products.forEach((product) => {
              const baseSku = product.sku;
              window.lastLoadedProductsImgNames[baseSku] = product.imgNames;

              let view =
                product.dtf || product.broderie || product.uvdtf ?
                  "studio"
                : "details";
              product.lowestPrice = (product.lowestPrice / 1.6) * 1.3;
              const formattedPrice = parseFloat(product.lowestPrice)
                .toFixed(2)
                .replace(".", ",");
              let activeHtml = product.active == 0 ? "notActive" : "";
              let colorsToRender = [null];

              colorsToRender.forEach((currentColor) => {
                const uniqueCardId =
                  currentColor ?
                    `${baseSku}-${currentColor.replace(/\s+/g, "_")}`
                  : baseSku;
                const targetPrefix =
                  currentColor ? currentColor.trim() : "thumbnail";
                const foundImageName = getProductImageUrl(
                  product.imgNames,
                  targetPrefix,
                  1,
                );

                let initialImageSrc =
                  foundImageName ?
                    `static-resources/products/${baseSku}/${foundImageName}`
                  : `./static-resources/default/products/introuvable.webp`;

                let cardRedirectUrl = `./produits/${view}?pid=${product.id}`;
                if (currentColor) {
                  cardRedirectUrl += `&selectedColor=${encodeURIComponent(currentColor)}`;
                }

                const card = document.createElement("div");
                card.className = `product-card ${activeHtml}`;
                card.onclick = () => (window.location.href = cardRedirectUrl);

                card.innerHTML = `
                <div class="thumbnail-wrapper" data-sku="${uniqueCardId}" data-real-sku="${baseSku}" data-prefix="${targetPrefix}">
                  <span class="product-tag-usine">Directement de l'usine</span>
                  <div class="thumbnail-skeleton"></div>
                  <img id="img-${uniqueCardId}"
                    class="product-image"
                    src="${initialImageSrc}"
                    alt="Image du produit ${product.name} ${currentColor ? "- " + currentColor : ""}"
                    data-current-thumb="1"
                    loading="lazy"
                    onload="this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                    onerror="this.src='./static-resources/default/products/introuvable.webp'; this.removeAttribute('onerror'); this.classList.add('loaded'); if(this.previousElementSibling) this.previousElementSibling.style.display='none';">
                  <div class='thumb-nav-container'>
                    <button class="thumb-nav thumb-prev disabled" onclick="switchThumbnailOnDemand('${uniqueCardId}', -1); event.stopPropagation();">&lt;</button>
                    <button class="thumb-nav thumb-next" onclick="switchThumbnailOnDemand('${uniqueCardId}', 1); event.stopPropagation();">&gt;</button>
                  </div>
                </div>
                <div class="product-info-wrapper"></div>
                <div class="color-thumbnails-wrapper"></div>
              `;

                productContainer.insertBefore(card, sentinelNext);

                setTimeout(() => {
                  const infoWrapper = card.querySelector(
                    ".product-info-wrapper",
                  );
                  if (infoWrapper) {
                    infoWrapper.innerHTML = `
                    <div class="product-info">
                      <h3>${product.name}</h3>
                      <p>${baseSku}</p>
                      <p style="display:none;">À partir de : ${formattedPrice} $</p>
                    </div>
                  `;
                  }
                }, 50);

                setTimeout(() => {
                  let colorThumbnailBloc = "";
                  if (product.availableColors) {
                    product.availableColors.forEach((color) => {
                      let isCurrentClass =
                        color === currentColor ? "active-color-thumb" : "";
                      let safeColor = escapeHTML(color);
                      let encodedColor = encodeURIComponent(color);

                      colorThumbnailBloc += `<img title="${safeColor}"
                        class="color-thumbnail-image ${isCurrentClass}"
                        src="static-resources/products/colors/${encodedColor}.webp" 
                        alt="Image de la couleur ${safeColor}"
                        loading="lazy" 
                        onclick="window.location.href='./produits/${view}?pid=${product.id}&selectedColor=${encodedColor}'; event.stopPropagation();"
                    >`;
                    });
                  }
                  const colorWrapper = card.querySelector(
                    ".color-thumbnails-wrapper",
                  );
                  if (colorWrapper) colorWrapper.innerHTML = colorThumbnailBloc;
                }, 150);

                updateThumbnailNavVisibility(uniqueCardId);
              });
            });

            nextPage++;
            loadingNext = false;
            if (nextPage > pageCount) {
              observerNext.disconnect();
              sentinelNext.remove();
            }
          })
          .catch((err) => {
            console.error("Erreur scroll infini:", err);
            batchSkeletons.forEach((skeleton) => skeleton.remove());
            observerNext.disconnect();
            sentinelNext.remove();
            const errorMessage = document.createElement("p");
            errorMessage.className = "products-load-error";
            errorMessage.textContent =
              "Impossible de charger les produits suivants. Rechargez la page pour réessayer.";
            productContainer.appendChild(errorMessage);
          });
      },
      { rootMargin: "0px 0px 300px 0px" },
    );

    observerNext.observe(sentinelNext);
  }
}

function showNoProductsMessage(container) {
  if (!container) return;
  container.innerHTML = `
        <div class="no-products-found" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
            <p>Aucun produit trouvé</p>
            <a href="./produits" class="btn-primary" style="display: inline-block; margin-top: 15px;  margin-top:10px; padding: 8px 16px; background-color: var(--accent-color); color: white; text-decoration: none; border-radius: 6px;">Réinitialiser la recherche</a>
        </div>
    `;
}
