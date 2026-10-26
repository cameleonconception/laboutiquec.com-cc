function addNewEmptySupplierRow() {
    const tbody = document.getElementById('suppliers-body');
    const container = document.getElementById('suppliers-container');
    
    // 1. On affiche immédiatement le conteneur (le tableau et ses titres)
    if (container) {
        container.classList.remove('hidden');
    }

    const row = document.createElement('tr');
    const emptyData = { name: "", shippingCost: "", freeShippingAt: ""};

    makeRowEditable(row, emptyData);
    tbody.prepend(row);
    
    const firstInput = row.querySelector('input');
    if (firstInput) firstInput.focus();
}

function renderRowContent(row, data) {
    row.dataset.freeShippingAt = data.freeShippingAt;
    if (data.id) row.dataset.id = data.id;

    // Fonction de formatage : si la valeur est 0, vide ou nulle, on affiche "-"
const formatPrice = (val) => {
    // Si val est null, undefined ou vide, on affiche '-'
    if (val === null || val === "" || isNaN(parseFloat(val))) return '-';
    return parseFloat(val).toFixed(2) + '$';
};

    row.innerHTML = `
        <td>
            <div class="actions-wrapper">
                <button type="button" class="copyBtn" title="Dupliquer"><img class='icons' src='./static-resources/default/icons/white/copy.png'></button>
                <button type="button" class="editBtn"><img class='icons' src='./static-resources/default/icons/white/filter-2.png'></button>
            </div>
        </td>
        <td class="col-name">${data.name}</td>
        <td class="col-shippingCost">${parseFloat(data.shippingCost).toFixed(2)}$</td>
        <td class="col-freeShippingAt">${formatPrice(data.freeShippingAt)}</td>
    `;

    // --- CORRECTION DES ÉVÉNEMENTS ---
    
    // Duplication : stopPropagation empêche le déclenchement du dblclick de la ligne
    row.querySelector('.copyBtn').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        duplicateSupplier(data);
    };


    const editAction = (e) => {
        if(e) e.stopPropagation();
        makeRowEditable(row, data);
    };

    row.querySelector('.editBtn').onclick = editAction;
    row.ondblclick = editAction;
}

function duplicateSupplier(data) {
    const tbody = document.getElementById('suppliers-body');
    const newRow = document.createElement('tr');
    
    // On clone les données pour éviter toute référence partagée
    const dataCopy = JSON.parse(JSON.stringify(data));

    // On prépare la nouvelle ligne en mode édition immédiatement
    makeRowEditable(newRow, dataCopy);
    
    // Insertion au début
    tbody.prepend(newRow);
    
    const nameInput = newRow.querySelector('.edit-name');
    if (nameInput) nameInput.focus();
    
    checkContainers();
}

function checkContainers() {
    const varCont = document.querySelector('#suppliers-container');
    const varBody = document.querySelector('#suppliers-body');
    // Gestion du tableau des variantes
    // On le cache seulement s'il n'y a aucune ligne (<tr>) dans le tbody
    if (varCont && varBody) {
        if (varBody.querySelectorAll('tr').length === 0) {
            varCont.classList.add('hidden');
        } else {
            varCont.classList.remove('hidden');
        }
    }
}

function makeRowEditable(row, oldData) {
    // 1. On génère le HTML des champs de saisie
    row.innerHTML = `
    <td>
        <div class="actions-wrapper">
            <button type="button" class="saveBtn"><img class='icons' src='./static-resources/default/icons/white/checkmark.png'></button>
            <button type="button" class="cancelBtn"><img class='icons' src='./static-resources/default/icons/white/x.png'></button>
        </div>
    </td>
    <td><input type="text" placeholder="Canada sportswear" list="suppliers-list" value="${oldData.name || ''}" class="edit-name"></td>
    <td><input type="number" placeholder="0.00" step="0.01" value="${oldData.shippingCost || ''}" class="edit-shipping-cost" ></td>
    <td><input type="number" placeholder="0.00" step="0.01" value="${oldData.freeShippingAt || ''}" class="edit-free-shipping-at"></td>
    `;

    // 2. Gestion du bouton Enregistrer
    row.querySelector('.saveBtn').onclick = async (e) => {
        e.stopPropagation();

        let freeShippingVal = row.querySelector('.edit-free-shipping-at').value.trim();
        
        const newData = {
            id: row.dataset.id || null, // On récupère l'ID si existant
            name: row.querySelector('.edit-name').value.trim(),
            shippingCost: row.querySelector('.edit-shipping-cost').value.trim(),
            freeShippingAt: (freeShippingVal === "" || parseFloat(freeShippingVal) === 0) ? null : freeShippingVal
        };

        if (!newData.name || newData.shippingCost === "") {
            alert("Veuillez remplir le nom et le coût de livraison.");
            return;
        }

        await saveSupplier(row, newData);
    };

    // 3. Gestion du bouton Annuler (MODIFIÉ ICI)
    row.querySelector('.cancelBtn').onclick = (e) => {
        e.stopPropagation();

        // LOGIQUE : Si la ligne n'a pas d'ID, c'est une création (ou duplication) non sauvegardée
        const isNewRow = !row.dataset.id;

        if (isNewRow) {
            // C'est une nouvelle ligne, on la supprime purement et simplement
            row.remove();
            // On vérifie s'il reste des lignes pour afficher/cacher le titre du tableau
            if (typeof checkContainers === "function") checkContainers();
        } else {
            // C'est un fournisseur qui existe déjà en BD, on revient au mode affichage
            renderRowContent(row, oldData);
        }
    };
}


function loadExistingSuppliers() {
    const tbody = document.getElementById('suppliers-body');
    
    fetch("./api/superAdmin/GET/getSuppliers")
        .then(response => response.json())
        .then(data => {
            if (data.success && data.suppliers) {
                tbody.innerHTML = ""; // On nettoie le tableau
                data.suppliers.forEach(supplier => {
                    const row = document.createElement('tr');
                    renderRowContent(row, supplier);
                    tbody.appendChild(row);
                });
            }
        })
        .catch(err => console.error("Erreur de chargement :", err));
}


async function saveSupplier(row, newData, isNew = false) {
    const tbody = document.getElementById('suppliers-body');
    const allRows = Array.from(tbody.querySelectorAll('tr'));

    // 1. Vérification de l'unicité du nom (insensible à la casse)
    const nameExists = allRows.some(r => {
        // On ne compare pas la ligne que l'on est en train de modifier
        if (r === row) return false;
        const existingName = r.querySelector('.col-name')?.textContent.trim().toLowerCase();
        return existingName === newData.name.toLowerCase();
    });

    if (nameExists) {
        alert(`Le fournisseur "${newData.name}" existe déjà dans la liste.`);
        return false;
    }

    // 2. Envoi des données au serveur en POST
    try {
        const response = await fetch("./api/superAdmin/POST/addSupplier", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newData)
        });

        const result = await response.json();

        if (result.success) {
            renderRowContent(row, newData);
            return true;
        } else {
            alert("Erreur serveur : " + result.message);
            return false;
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi :", error);
        alert("Impossible de contacter le serveur.");
        return false;
    }
}