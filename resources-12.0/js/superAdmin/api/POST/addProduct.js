

document.addEventListener('DOMContentLoaded', function() {
        // Initialisation du bouton d'annulation (si présent)
    const cancelBtn = document.querySelector('#cancelProduct');
    if (cancelBtn) {
        cancelBtn.onclick = () => window.location.href = './produits';
    }
});

/**
 * Collecte les données et crée le nouveau produit
 */
/**
 * Collecte les données et crée le nouveau produit
 */
function addProduct() {
    const submitBtn = document.querySelector('#submitBtn');

    // Si on arrive ici, tout est validé
    submitBtn.classList.add('loading');
    removeErrorMessage();
    
    const form = document.querySelector('#superAdmin-newProductForm');
    const formData = new FormData(form);

    formData.set('active', 0);

    // Envoi vers l'API
    fetch("./api/superAdmin/POST/addProduct", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.classList.remove('loading');
        if(data.success) {
            alert("Produit ajouté avec succès !");
            window.location.href = './produits/details?pid=' + data.product_id; 
        } else {
            addElementAfterElementId('submitBtn', data.message);
        }
    })
    .catch(error => {
        submitBtn.classList.remove('loading');
        console.error('Erreur réseau:', error);
        addElementAfterElementId('submitBtn', 'Une erreur réseau est survenue.');
    });
}

// ----------------------------------------------------------------------
// GESTION DU TABLEAU DYNAMIQUE (Identique au Update)
// ----------------------------------------------------------------------

function toggleNewProductForm() {
    let screen = document.querySelector(".fullBlurBg");
    let addBtn = document.querySelector("#superAdmin-addProductBtn");
    const isVisible = screen.style.display === 'flex';
    screen.style.display = isVisible ? 'none' : 'flex';
    if (addBtn) addBtn.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(45deg)';
}

function addElementAfterElementId(id, msg) {
    let t = document.querySelector(`#${id}`);
    if (t) {
        let s = document.createElement('span');
        s.textContent = msg; s.classList.add('error-message'); t.after(s);
    }
}

function removeErrorMessage() {
    document.querySelectorAll('span.error-message').forEach(span => span.remove());
}