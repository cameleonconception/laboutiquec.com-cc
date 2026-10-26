document.addEventListener('DOMContentLoaded', function() {
    loadExistingColors();
});

/**
 * Charge et affiche les images de couleurs existantes
 */
function loadExistingColors() {
    const container = document.querySelector('#color-upload-status');
    // On crée un conteneur dédié pour les miniatures s'il n'existe pas
    let listContainer = document.querySelector('#existing-colors-list');
    
    if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'existing-colors-list';
        listContainer.style.cssText = "display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; border-top:1px solid #ccc; padding-top:20px;";
        document.querySelector('#admin-color-upload-form').after(listContainer);
    }

    fetch("./api/superAdmin/GET/getColorImages")
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                listContainer.innerHTML = ''; // Nettoyage
                data.images.forEach(imgName => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'existing-image-wrapper';
                    wrapper.style.position = 'relative';

                    wrapper.innerHTML = `
                        <img src="./static-resources/products/colors/${imgName}" 
                             title="${imgName}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;">
                        <button type="button" class="deleteImgBtn" onclick="deleteColorFile('${imgName}', this)">x</button>
                    `;
                    listContainer.appendChild(wrapper);
                });
            }
        });
}

/**
 * Supprime le fichier image sur le serveur
 */
function deleteColorFile(fileName, btn) {
    if (!confirm(`Supprimer l'image de couleur "${fileName}" ?`)) return;

    const formData = new FormData();
    formData.append('file_name', fileName);

    fetch("./api/superAdmin/POST/deleteColorImage", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            btn.parentElement.remove();
        } else {
            alert(data.message);
        }
    });
}

function uploadMultipleColors() {
    const fileInp = document.querySelector('#color_imgs');
    const formData = new FormData();

    if (fileInp.files.length === 0) {
        alert("Sélectionnez au moins un fichier.");
        return;
    }

    // On utilise "color_img[]" pour que PHP reçoive un tableau
    for (let i = 0; i < fileInp.files.length; i++) {
        formData.append('color_img[]', fileInp.files[i]);
    }

    fetch("./api/superAdmin/POST/uploadColorImage", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadExistingColors(); // Rafraîchir la liste
        fileInp.value = ''; // Vider le champ
    })
    .catch(error => console.error('Erreur:', error));
}
