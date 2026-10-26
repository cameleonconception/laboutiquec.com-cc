document.addEventListener('DOMContentLoaded', function() {
    fetch('./api/GET/myOrders')
        .then(response => response.json())
        .then(data => {
                if(data.success) {
                    let orders = data.orders;
                    ordersContainer.innerHTML = '<h1>MES SOUMISSIONS</h1>'; // Clear loading text
                    if(orders.length === 0) {
                        ordersContainer.innerHTML += '<p>Vous n\'avez aucune demande de soumission</p>';
                        return;
                    }
                    
                    orders.forEach(order => {
                        let ordersContainer = document.getElementById('ordersContainer');

                        ordersContainer.innerHTML += `
                            <div class="order-card" onclick="window.location.href='commande?id=${order.id}'">
                                <div>
                                <p class="orderId">WEB #${order.id}</p>
                                <p class="date">${formatDateToLocal(order.date)}</p>
                                </div>
                                <p class="price" style="display:none;">${order.total} $</p>
                            </div>
                        `; 
                    });
                }
        })
        .catch(error => console.error('Error fetching products:', error));
});

/**
 * Interprète une chaîne de date UTC (format SQL: "YYYY-MM-DD HH:MM:SS") et la formate
 * en utilisant le fuseau horaire et les conventions linguistiques locales de l'utilisateur.
 * @param {string} utcDateString - Chaîne de date provenant de la base de données (UTC).
 * @returns {string} Date et heure formatées localement.
 */
function formatDateToLocal(utcDateString) {
    if (!utcDateString) return 'Date inconnue';
    
    // Ajout de 'T' et 'Z' pour forcer l'interprétation de la chaîne comme UTC selon ISO 8601.
    const dateObject = new Date(utcDateString.replace(' ', 'T') + 'Z');

    if (isNaN(dateObject)) {
        return utcDateString; // Retourne l'original en cas d'erreur
    }

    // Utilisation des API d'internationalisation pour un format convivial et localisé
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    };
    
    // Utilise la langue du navigateur ('default') pour la localisation
    return dateObject.toLocaleDateString(navigator.language, options);
}






