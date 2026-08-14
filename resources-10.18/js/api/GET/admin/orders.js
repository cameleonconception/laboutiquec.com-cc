document.addEventListener('DOMContentLoaded', function() {
    let ordersContainer = document.getElementById('dash-ordersContainer');
    let allOrdersData = [];
    let globalSummaryData = [];
    let globalTotalContent = ''; 

    const sizeOrder = [
        "XXS", "XS", "S", "M", "L", "XL", 
        "2XL", "3XL", "4XL", "5XL", 
        "2.5 X 2.25\"", "3 X 2.69\"", "3.5 X 3.14\"", "4 X 3.59\""
    ];

    function calculateProductSummary(orders) {
        const summaryMap = new Map();
        orders.forEach(order => {
            try {
                const detailsString = typeof order.details === 'string' ? order.details : JSON.stringify(order.details);
                const productDetails = JSON.parse(detailsString);
                productDetails.forEach(product => {
                    if (Array.isArray(product.sizes)) {
                        product.sizes.forEach(sizeItem => {
                            const unitPrice = (sizeItem.price || 0) + (product.personalizationPrice || 0);
                            const groupKey = `${product.sku}-${product.color}-${product.personalizationValue || ''}-${unitPrice.toFixed(2)}`;
                            const quantityToAdd = sizeItem.qte || 0;
                            
                            if (summaryMap.has(groupKey)) {
                                const existingGroup = summaryMap.get(groupKey);
                                existingGroup.totalQte += quantityToAdd;
                                const existingSize = existingGroup.sizes.find(s => s.size === sizeItem.size);
                                if (existingSize) {
                                    existingSize.qte += quantityToAdd;
                                } else {
                                    existingGroup.sizes.push({ size: sizeItem.size, qte: quantityToAdd });
                                }
                            } else {
                                summaryMap.set(groupKey, {
                                    name: product.name, sku: product.sku, color: product.color,
                                    personalizationValue: product.personalizationValue || '',
                                    personalizationPrice: product.personalizationPrice || 0,
                                    unitPrice: unitPrice, totalQte: quantityToAdd,
                                    sizes: [{ size: sizeItem.size, qte: quantityToAdd }],
                                });
                            }
                        });
                    }
                });
            } catch (e) {
                console.error(e);
            }
        });
        return Array.from(summaryMap.values());
    }

    function renderSummaryTable(summaryData) {
        let tableContainer = document.getElementById('productSummaryContainer');
        if (!tableContainer) return;
        
        if (summaryData.length === 0) {
            tableContainer.innerHTML = '<p>Aucun article trouvé dans les demandes de soumission sélectionnées.</p>';
            return;
        }

        let tableHtml = '<h3>Sommaire des articles pour la production</h3>';
        tableHtml += '<div class="table-scroll-wrapper"><table class="product-summary-table"><thead><tr>';
        tableHtml += '<th>SKU</th><th>Nom</th><th>Couleur</th><th>Person.</th><th>Tailles agrégées</th><th>Qté Totale</th>';
        tableHtml += '</tr></thead><tbody>';

        summaryData.sort((a, b) => {
            if (a.sku < b.sku) return -1;
            if (a.sku > b.sku) return 1;
            return 0;
        });

        summaryData.forEach(item => {
            const sizesString = item.sizes
                .sort((a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size))
                .map(s => `${s.qte}x(${s.size})`)
                .join(', ');

            const personalizationDisplay = item.personalizationValue 
                ? `${item.personalizationValue} (${item.personalizationPrice > 0 ? '+' + item.personalizationPrice.toFixed(2) + '$' : 'Gratuit'})`
                : 'N/A';
            
            tableHtml += `<tr>
                <td>${item.sku}</td>
                <td>${item.name}</td>
                <td>${item.color}</td>
                <td title="${item.personalizationValue}">${personalizationDisplay}</td>
                <td>${sizesString}</td>
                <td>${item.totalQte}</td>
            </tr>`;
        });

        tableHtml += '</tbody></table></div>';
        tableContainer.innerHTML = tableHtml;
    }

    function calculateAndRenderTotals(ordersToCalculate) {
        let finalSubtotal = 0, finalShipping = 0, finalTPS = 0, finalTVQ = 0, finalTotal = 0, finalHandlingTotal = 0, finalCreditCardTotal = 0;

        ordersToCalculate.forEach(order => {
            finalSubtotal += parseFloat(order.subtotal) || 0;
            finalShipping += parseFloat(order.shipping) || 0;
            finalTPS += parseFloat(order.tps) || 0;
            finalTVQ += parseFloat(order.tvq) || 0;
            finalTotal += parseFloat(order.total) || 0;
            finalHandlingTotal += parseFloat(order.handlingFees) || 0;
            finalCreditCardTotal += parseFloat(order.creditCardFees) || 0;
        });
        
        globalTotalContent = (ordersToCalculate.length === 0) ? '' : 
            `<p>Sous-total : ${finalSubtotal.toFixed(2)} $</p>
             <p>Livraison : ${finalShipping.toFixed(2)} $</p>
             <p>TPS : ${finalTPS.toFixed(2)} $</p>
             <p>TVQ : ${finalTVQ.toFixed(2)} $</p>
             <p>Total : ${finalTotal.toFixed(2)} $</p>
             <p style="display:none;">Frais de gestion : ${finalHandlingTotal.toFixed(2)} $</p>
             <br>
             <p>Frais de carte de crédit : ${finalCreditCardTotal.toFixed(2)} $</p>`;

        const totalPriceContainer = document.getElementById('totalPriceContainer');
        if (totalPriceContainer) totalPriceContainer.innerHTML = globalTotalContent;
    }

    function filterOrdersByStatus() {
        const checkedStatuses = Array.from(document.querySelectorAll('input[name="orderStatus"][type="checkbox"]:checked')).map(cb => cb.value);
        const searchInput = document.getElementById('orderSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        let ordersToDisplay = allOrdersData;
        
        if (checkedStatuses.length > 0) {
            ordersToDisplay = ordersToDisplay.filter(order => checkedStatuses.includes(String(order.status)));
        }
        
        if (searchTerm) {
            ordersToDisplay = ordersToDisplay.filter(order => {
                const searchString = `${order.id} ${order.fname} ${order.lname} ${order.clientEmail} ${order.details}`.toLowerCase();
                return searchString.includes(searchTerm);
            });
        }
        renderOrderCards(ordersToDisplay);
    }
    
    function filterOrders() {
        filterOrdersByStatus();
    }

    function renderOrderCards(ordersToDisplay) {
        let ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        ordersList.innerHTML = ordersToDisplay.length === 0 ? '<p>Aucune demande de soumission n\'a été trouvée.</p>' : '';
        
        ordersToDisplay.forEach(order => {
            ordersList.innerHTML += `
                <div class="order-card ${String(order.status) === '0' ? 'canceled' : ''}" onclick="window.location.href='commande?id=${order.id}'">
                    <div>
                        <p class="orderId">WEB #${order.id}</p>
                        <p class="date">${(order.company ? order.company + " - " : "")}${order.fname} ${order.lname}</p>
                        <p class="date">${formatDateToLocal(order.date)}</p>
                    </div>
                    <p class="price" style="display:none;">${order.total} $</p>
                </div>`;
        });
    }

    function loadAndRenderOrders(preorderId = '') {
        let apiUrl = './api/GET/admin/orders' + (preorderId ? `?preorder_id=${preorderId}` : '');

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    allOrdersData = data.orders;
                    const ordersForReports = allOrdersData.filter(order => String(order.status) !== '0');

                    calculateAndRenderTotals(ordersForReports);
                    
                    if (!document.getElementById('preOrderSelect') || preorderId === '') {
                        ordersContainer.innerHTML = `
                        <details>
                            <summary>Rapports</summary>
                            <div id='filterView'>
                                <select id='preOrderSelect'><option value=''>Toutes les précommandes</option></select>
                                <div id="productSummaryContainer"></div>
                                <div id="totalPriceContainer" style="display:none;">${globalTotalContent}</div>
                            </div>
                        </details>
                        <h1>Soumissions</h1>
                        <input type='search' placeholder='Rechercher' id='orderSearchInput'>
                        <div id='orderStatusContainer'>
                            <div><label>À produire</label><input type='checkbox' name='orderStatus' value='1' checked></div>
                            <div><label>En production</label><input type='checkbox' name='orderStatus' value='2'></div>
                            <div><label>En livraison</label><input type='checkbox' name='orderStatus' value='3'></div>
                            <div><label>Archivée</label><input type='checkbox' name='orderStatus' value='4'></div>
                            <div><label>Erreur de commande</label><input type='checkbox' name='orderStatus' value='0'></div>
                        </div>
                        <div id="ordersList"></div>`; 

                        let preOrderSelect = document.getElementById('preOrderSelect');
                        preOrderSelect.addEventListener('change', updateAdminDashboard);
                        document.getElementById('orderSearchInput').addEventListener('input', filterOrders);
                        document.querySelectorAll('input[name="orderStatus"]').forEach(cb => cb.addEventListener('change', filterOrdersByStatus));

                        data.preOrders.forEach(po => {
                            preOrderSelect.innerHTML += `<option value='${po.id}'>${formatDateToLocal(po.open_at)} au ${formatDateToLocal(po.close_at)}</option>`;
                        });
                        
                        renderSummaryTable(calculateProductSummary(ordersForReports));
                    } else {
                        calculateAndRenderTotals(ordersForReports);
                        renderSummaryTable(calculateProductSummary(ordersForReports));
                    }
                    filterOrdersByStatus(); 
                }
            })
            .catch(error => console.error(error));
    }

    function updateAdminDashboard() {
        const selectedId = document.getElementById('preOrderSelect').value;
        if (document.getElementById('orderSearchInput')) document.getElementById('orderSearchInput').value = '';
        document.querySelectorAll('input[name="orderStatus"]').forEach(cb => cb.checked = (cb.value === '1'));
        loadAndRenderOrders(selectedId);
    }
    
    loadAndRenderOrders();

    function formatDateToLocal(utcDateString) {
        if (!utcDateString) return 'Date inconnue';
        const dateObject = new Date(utcDateString.replace(' ', 'T'));
        if (isNaN(dateObject)) return utcDateString;
        const datePart = dateObject.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const timePart = dateObject.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h');
        return `${datePart} à ${timePart}`;
    }
});