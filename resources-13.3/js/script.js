const PREORDER_MAX_AGE = 1; 

function setCookie(name, value, maxAgeSeconds) {
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}; max-age=${maxAgeSeconds}; path=/; SameSite=Strict`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            const value = cookie.substring(name.length + 1);
            return decodeURIComponent(value);
        }
    }
    return null;
}

/**
 * Cache ou affiche l'étape de paiement en fonction du statut d'ouverture de la boutique.
 * @param {boolean} isOpen - Vrai si la précommande est ouverte.
 */
function togglePaymentStepVisibility(isOpen) {
    
    const loginForm = document.querySelector('#paymentStep #loginForm');
    const paymentForm = document.querySelector('#paymentStep #paymentForm');
    const cartContainer = document.querySelector('#paymentStep #cart-container');

    if (loginForm) {
        // Utilise la propriété 'display' du style pour masquer ou afficher
        if (isOpen) {
            loginForm.style.display = ''; // Rétablit l'affichage par défaut (block, flex, etc.)
        } else {
            loginForm.style.display = 'none'; // Cache l'élément
        }
    }
    
    if (paymentForm) {
        // Utilise la propriété 'display' du style pour masquer ou afficher
        if (isOpen) {
            paymentForm.style.display = ''; // Rétablit l'affichage par défaut (block, flex, etc.)
        } else {
            paymentForm.style.display = 'none'; // Cache l'élément
        }
    }

    if (cartContainer) {
        let navPreOrderMessage = document.querySelector('#pre-order-message');
        if(navPreOrderMessage){
            navPreOrderMessage.style.display = 'none';
        }

        // Utilise la propriété 'display' du style pour masquer ou afficher
        let existingMessage = document.querySelector('.cartMessageOrange');
        if (existingMessage) {
            existingMessage.remove(); // Supprime l'ancien message
        }

        // Le message est affiché qu'elle soit ouverte ou fermée
        /*
        let preOrderMessage = getCookie('preOrderMessage');
        if (preOrderMessage) {
            document.querySelector("#paymentStep").insertAdjacentHTML('beforebegin', `
                <div class='cartMessageOrange' >
                    ${preOrderMessage}
                </div>`);
        }
        */
    }
}

function formatPhoneInput(phone) {
    let numbers = phone.value.replace(/\D/g, '').substring(0, 10);
    let formatted = '';
    if (numbers.length > 6) {
        formatted = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}-${numbers.substring(6,10)}`;
    } else if (numbers.length > 3) {
        formatted = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}`;
    } else if (numbers.length > 0) {
        formatted = `(${numbers}`;
    }
    phone.value = formatted;
}

function attachPhoneFormatter() {
    let phone = document.querySelector('#phone');
    if (phone && !phone.hasAttribute('data-phone-format-attached')) {
        formatPhoneInput(phone);
        phone.addEventListener('input', function() {
            formatPhoneInput(phone);
        });
        phone.setAttribute('data-phone-format-attached', 'true');
    }
}

function ensurePhoneFormattedOnce() {
    let interval = setInterval(() => {
        let phone = document.querySelector('#phone');
        if (phone) {
            formatPhoneInput(phone);
            if (/^\(\d{3}\) \d{3}-\d{4}$/.test(phone.value)) {
                clearInterval(interval);
            }
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    
let switchElements = document.querySelectorAll('.switch input');

switchElements.forEach(element => {
    // Utilisation de 'change' et d'une syntaxe de fonction propre
    element.addEventListener('change', (event) => {
        if (event.target.checked) {
            element.value = 1;
        } else {
            element.value = 0;
        }
    });
});

    attachPhoneFormatter();
    getCountCartElement();

    const observer = new MutationObserver(() => {
        attachPhoneFormatter();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    ensurePhoneFormattedOnce();

    const menuBurger = document.getElementById("menuBurger");
    if(menuBurger){
        menuBurger.addEventListener("click", toggleMenuBurger);
    }
    
    // Lancement de la vérification/récupération des précommandes
    getPreOrders();
    
});


function toggleMenuBurger(){
    const menuBurger = document.getElementById("menuBurger");
    const navLinksContainer = document.getElementById("navLinksContainer");
    const preOrderMessage = document.getElementById("pre-order-message");

    menuBurger.classList.toggle("active");
    navLinksContainer.classList.toggle("open");
    preOrderMessage.classList.toggle("menu-open");
    
}



function getCountCartElement(){
    let cartCountElement = document.getElementById("cart-count");
    let cart = JSON.parse(localStorage.getItem("cart/cc")) || [];

    let totalItems = 0;

    if (cart.length > 0) {
        totalItems = cart.reduce((total, product) => {
            
            const productQuantity = product.sizes.reduce((sum, size) => {
                return sum + size.qte;
            }, 0);

            return total + productQuantity;
        }, 0);
    }

    cartCountElement.textContent = totalItems;
}

// NOTE: Cette fonction n'est plus utilisée pour la logique, car nous nous basons sur l'heure UTC native de l'objet Date
function getFormattedTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ---------------------------------------------------------------------

/**
 * **CORRECTION DU FORMAT DE DATE**
 * Vérifie si la précommande est ouverte en comparant les dates UTC.
 * @param {string} openAtUtc - Date/Heure d'ouverture en format YYYY-MM-DD HH:MM:SS (UTC).
 * @param {string} closeAtUtc - Date/Heure de fermeture en format YYYY-MM-DD HH:MM:SS (UTC).
 * @returns {boolean} Vrai si l'heure actuelle (UTC) est entre l'heure d'ouverture et de fermeture (inclus).
 */
function isPreOrderCurrentlyOpen(openAtUtc, closeAtUtc) {
    
    // CORRECTION DE SÉCURITÉ : Évite le TypeError si les données du cookie sont malformées/manquantes
    if (!openAtUtc || !closeAtUtc || typeof openAtUtc !== 'string' || typeof closeAtUtc !== 'string') {
        console.error("isPreOrderCurrentlyOpen: Dates UTC manquantes ou non valides. Vérifiez la structure du JSON PHP.");
        return false;
    }

    const nowUtc = new Date(); 
    
    // CORRECTION CRUCIALE : Remplacer l'espace par 'T' pour un format ISO 8601 valide (YYYY-MM-DDT HH:MM:SSZ)
    const openIsoUtc = openAtUtc.replace(' ', 'T') + 'Z';
    const closeIsoUtc = closeAtUtc.replace(' ', 'T') + 'Z';

    const openDate = new Date(openIsoUtc); 
    const closeDate = new Date(closeIsoUtc); 

    // 3. Comparer les timestamps (millisecondes)
    const nowTimestamp = nowUtc.getTime();
    const openTimestamp = openDate.getTime();
    const closeTimestamp = closeDate.getTime();
    
    // L'heure actuelle (UTC) doit être APRÈS ou ÉGALE à l'ouverture ET AVANT ou ÉGALE à la fermeture
    return nowTimestamp >= openTimestamp && nowTimestamp <= closeTimestamp;
}

let preOrderData = [];

function getPreOrders() {

    if(!getCookie("allPreOrders")){
        //fetch("/cc/api/GET/pre-orders", {
        fetch("/laboutiquec.com/cc/api/GET/pre-orders", {
            method: "GET",
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            
            // 1. Détermination de l'état d'ouverture basée sur la réponse API
            const isOpen = data.openPreOrder && data.openPreOrder.length > 0;

            // Assurez-vous que PHP renvoie les champs open_at_utc et close_at_utc si vous voulez les utiliser dans le cas 2
            setCookie("allPreOrders", JSON.stringify(data.allPreOrders), PREORDER_MAX_AGE);
            setCookie("openPreOrder", JSON.stringify(data.openPreOrder), PREORDER_MAX_AGE);
            setCookie("preOrderMessage", data.message, PREORDER_MAX_AGE);
            setCookie("isPreOrderOpen", isOpen ? 'true' : 'false', PREORDER_MAX_AGE); 

            let preOrderMessageElement = document.getElementById('pre-order-message');
            
            if (!preOrderMessageElement) {
                preOrderMessageElement = document.createElement('div');
                preOrderMessageElement.id = "pre-order-message";
                //document.body.append(preOrderMessageElement); 
            }

            preOrderMessageElement.textContent = data.message;
            preOrderData = data;
            
            // 2. Cacher/Afficher l'étape de paiement
            togglePaymentStepVisibility(isOpen);
        })
        .catch((error) => {
            console.error("Erreur lors de la récupération des précommandes:", error);
            // Par sécurité, cacher l'étape de paiement en cas d'erreur
            togglePaymentStepVisibility(false); 
        });
    }
    // Cas 2: Les cookies existent (lecture des données mises en cache)
    else{
        // 1. Récupérer les données brutes UTC
        const openPreOrderCookie = getCookie("openPreOrder") ? JSON.parse(getCookie("openPreOrder")) : null;
        const preOrderMessage = getCookie("preOrderMessage");
        
        // 2. Déterminer l'état ACTUEL
        let isOpen = false;

        // Si des données d'ouverture existent, on recalcule le statut
        if (openPreOrderCookie && openPreOrderCookie.length > 0) {
            // Lecture des champs UTC : on suppose que le PHP renvoie ces champs
            const openAtUtc = openPreOrderCookie[0].open_at_utc; 
            const closeAtUtc = openPreOrderCookie[0].close_at_utc; 
            
            // ** VÉRIFICATION UTC ** : Recalculer le statut basé sur l'heure actuelle (UTC) du client
            isOpen = isPreOrderCurrentlyOpen(openAtUtc, closeAtUtc);
            
            // Mettre à jour le cookie de statut si le statut a changé depuis la dernière lecture/API
            const currentCookieStatus = getCookie("isPreOrderOpen");
            if (isOpen.toString() !== currentCookieStatus) {
                 setCookie("isPreOrderOpen", isOpen ? 'true' : 'false', PREORDER_MAX_AGE);
            }
        } 
        
        // 3. Affichage du message
        let preOrderMessageElement = document.getElementById('pre-order-message');
        if (!preOrderMessageElement) {
            preOrderMessageElement = document.createElement('div');
            preOrderMessageElement.id = "pre-order-message";
            //document.body.append(preOrderMessageElement); 
        }
        preOrderMessageElement.textContent = preOrderMessage;

        // 4. Cacher/Afficher l'étape de paiement avec le statut ACTUALISÉ
        togglePaymentStepVisibility(isOpen);
    }
}

function selectView(event, view){
    let viewSelectorContainer = document.getElementById('viewSelectorContainer');
    let activesViewSelector = viewSelectorContainer.querySelectorAll('div.active');
    activesViewSelector.forEach(selector => {
        selector.classList.remove('active');
    });

    let clickedElement = event.target;
        clickedElement.classList.add('active');

    let newView = document.getElementById(view);
    let selectedView = document.querySelectorAll('.selectedView');
    let notSelectedView = document.querySelectorAll('.notSelectedView');

    if(newView){
        selectedView.forEach(view => {
            view.classList.remove('selectedView');
            view.classList.add('notSelectedView');
        })

        notSelectedView.forEach(view => {
            //view.classList.remove('selectedView');
        });

        newView.classList.add('selectedView');
        newView.classList.remove('notSelectedView');

    }
}

function copyText(text) {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        console.log("Copié : " + text);
    }).catch(err => {
        console.error("Erreur de copie : ", err);
    });
}



