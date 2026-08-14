/**
 * Interprète une chaîne de date UTC (ex: "2025-10-21 17:35:43") et la formate
 * en utilisant le fuseau horaire et les conventions linguistiques locales de l'utilisateur.
 * @param {string} utcDateString - Chaîne de date provenant de la base de données (supposée être UTC).
 * @returns {string} Date et heure formatées localement.
 */
function formatDateToLocal(utcDateString) {
    if (!utcDateString) return 'Date inconnue';
    
    const dateObject = new Date(utcDateString.replace(' ', 'T') + 'Z');

    if (isNaN(dateObject)) {
        return utcDateString;
    }

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    
    return dateObject.toLocaleDateString(navigator.language, options);
}

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('order-details-container');
    const URL = window.location.search;
    const searchParams = new URLSearchParams(URL);
    const id = parseInt(searchParams.get("id")) ?? null;

    fetch('./api/GET/orders?id=' + id)
        .then(response => response.json())
        .then(data => {
            if(data.success && data.orders.length > 0){
                let order = data.orders[0];

                let feesHTML = '';
                if(data.role > 0){
                    feesHTML = `<br><p style="display:none;">Frais de gestion : ${order.handlingFees} $</p><p>Frais de carte de crédit : ${order.creditCardFees} $</p>`;
                }

                // --- LOGIQUE DU BOUTON PACKING SLIP ---
const packingBtn = document.getElementById('packingSlip');
if (packingBtn) {
    packingBtn.addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
        const orderLink = window.location.href;
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderLink)}`;

        const now = new Date();
        const creationDate = now.toLocaleDateString(navigator.language, {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // --- GÉNÉRATION DES LIGNES ---
        let rowsHtml = '';
        const items = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;

        if (items && Array.isArray(items)) {
            items.forEach(item => {
            let thumbPath = (item.designSignature && item.designSignature !== 'null') 
                    ? `${baseUrl}static-resources/temp-designs/${item.designSignature}/preview_v1.png`
                    : '';

            if(order.status === 0){
                thumbPath = (item.designSignature && item.designSignature !== 'null') 
                    ? `${baseUrl}static-resources/temp-designs/${item.designSignature}/preview_v1.png`
                    : '';
            }

                // Logique de personnalisation stricte
            let persoDisplay = '';
            if (item.studioData && item.studioData.selectedPersonalizationOption) {
                const opt = item.studioData.selectedPersonalizationOption;
                if (opt !== 'Aucune' && opt !== 'Aucune personnalisation') {
                    persoDisplay = `<br><small style="color:#e67e22;">Personnalisation : ${opt} ${item.studioData.orderDtfIn}</small>`;
                }
            }

                item.sizes.forEach(s => {
                    const productUrl = `${baseUrl}produits/details?pid=${item.id}&selectedColor=${encodeURIComponent(item.color)}`;
                    const miniQR = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(productUrl)}`;

                    let isPersonnalized = item.studioData != null ? " (personnalisé)" : '';


                    rowsHtml += `
                        <tr>
                            <td class="center"><div class="checkbox"></div></td>
                            <td class="center"><strong>${s.qte}</strong></td>
                            <td>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                    <strong>${item.name} ${isPersonnalized}</strong><br>
                                    <small>${item.sku} / ${item.color}</small>
                                    ${persoDisplay}
                                    </div>
                                    ${thumbPath ? `<img src="${thumbPath}" style="width:70px; height:70px; object-fit:contain; border:1px solid #eee; background:#fff; margin-left:10px;">` : ''}
                                </div>
                            </td>
                            <td>${item.color}</td>
                            <td>${s.size}</td>
                            <td class="center"><img class="qr-mini" src="${miniQR}" /></td>
                        </tr>`;
                });
            });
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Packing Slip #${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.2; color: #333; font-size: 12px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .info-grid { display: flex; gap:20px; margin: 20px 0; }
                    .info-grid div { width:50%; border: 1px solid #eee; padding: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .center { text-align: center; }
                    .checkbox { width: 20px; height: 20px; border: 2px solid #000; display: inline-block; }
                    #logo { height:50px; margin-bottom:25px; }
                    .qr-mini { width: 60px; height: 60px; }
                    .order-notes { margin-top: 20px; padding: 15px; background: #f9f9f9; border: 1px dashed #ccc; }
                </style>
            </head>
            <body>
                <img id="logo" src='https://cameleonconception.com/static-resources/img/logos/Logo_complet_noir_orange.png'>
                <div class="header">
                    <div>
                        <h1>BON DE COMMANDE${order.status === 0 ? ' <span style="color:red;">(ANNULÉ)</span>' : ''}</h1>
                        ${order.status === 0 ? ' <P style="color:red;">'+status+'</P>' : ''}
                        <p><strong>COMMANDE :</strong> /cc #${order.id}</p>
                        <p><strong>DATE COMMANDE :</strong> ${formatDateToLocal(order.date)}</p>
                        <p><strong>GÉNÉRÉ LE :</strong> ${creationDate}</p>
                    </div>
                    <div class="center">
                        <img src="${qrCodeImageUrl}" style="width:100px;" />
                        <br><small>VOIR COMMANDE</small>
                    </div>
                </div>
                <div class="info-grid">
                <div><strong>VENDU À :</strong><p>${order.fname} ${order.lname}<br>${order.clientEmail}<br>${order.phone}</p></div>
                <div><strong>EXPÉDIÉ À :</strong><p>${order.address}<br>${order.city}, ${order.province}, ${order.postalCode}</p></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th class="center" style="width:50px;">✓</th>
                            <th class="center">Qté</th>
                            <th>Description</th>
                            <th>Couleur</th>
                            <th>Taille</th>
                            <th class="center" style="width:70px;">Lien</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="order-notes">
                    <strong>Notes de commande :</strong>
                    <p>${order.notes ? order.notes : 'Aucune note particulière.'}</p>
                </div>
            </body>
            </html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    });
}

             const invoiceBtn = document.getElementById('invoice');
if (invoiceBtn && order) {
invoiceBtn.addEventListener('click', function() {
    const printWindow = window.open('', '_blank');
    const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`;

    let rowsHtml = '';
    const items = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;

    if (items && Array.isArray(items)) {
        items.forEach(item => {
            console.log(item);
            let thumbPath = (item.designSignature && item.designSignature !== 'null') 
                ? `${baseUrl}static-resources/temp-designs/${order.id}/${item.designSignature}/preview_v1.png`
                : '';

            if(order.status === 0){
                thumbPath = (item.designSignature && item.designSignature !== 'null') 
                    ? `${baseUrl}static-resources/temp-designs/${item.designSignature}/preview_v1.png`
                    : '';
            }

            let persoDisplay = '';
            if (item.studioData && item.studioData.selectedPersonalizationOption) {
                const opt = item.studioData.selectedPersonalizationOption;
                if (opt !== 'Aucune' && opt !== 'Aucune personnalisation') {
                    persoDisplay = `<br><small style="color:#e67e22;">Personnalisation : ${opt} ${item.studioData.orderDtfIn}</small>`;
                }
            }

            const groupedByPrice = {};

item.sizes.forEach(s => {
    const unitPrice = parseFloat(s.price) + (parseFloat(item.personalizationPrice) || 0);
    const priceKey = unitPrice.toFixed(2);

    if (!groupedByPrice[priceKey]) {
        groupedByPrice[priceKey] = { price: unitPrice, totalQte: 0, details: [] };
    }
    groupedByPrice[priceKey].totalQte += parseInt(s.qte);
    groupedByPrice[priceKey].details.push(`${s.qte}x(${s.size})`);
});

Object.values(groupedByPrice).forEach(group => {
    const lineTotal = group.price * group.totalQte;
    const miniQR = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(baseUrl + "produits/details?pid=" + item.id)}`;

    let isPersonnalized = item.studioData != null ? " (personnalisé)" : '';

    rowsHtml += `
        <tr>
            <td class="center" style="display:none;"><img src="${miniQR}" style="width:45px;"></td>
            <td class="center"><strong>${group.totalQte}</strong></td>
            <td>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.name} ${isPersonnalized}</strong><br>
                        <small>${item.sku} / ${item.color} / ${group.details.join(', ')}</small>
                        ${persoDisplay}
                    </div>
                    ${thumbPath ? `<img src="${thumbPath}" style="width:50px; height:50px; object-fit:contain; border:1px solid #f0f0f0;">` : ''}
                </div>
            </td>
            <td class="center">${group.price.toFixed(2)} $</td>
            <td class="center">${lineTotal.toFixed(2)} $</td>
        </tr>`;
});
        });
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Soumission</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.4; color: #333; font-size: 11px; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .info-grid { display: flex; gap:20px; margin: 20px 0; }
                .info-grid div { width:50%; border: 1px solid #eee; padding: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .right { text-align: right; }
                .totals-container { margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
                .payment-methods {width: 55%; font-size: 9px; border: 1px solid #eee; padding: 30px 10px 10px 10px; background: #fafafa; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; border-bottom: 1px solid #eee; padding: 4px; }
                .order-notes { margin-bottom: 15px; padding: 10px; border: 1px dashed #ccc; background: #fff; }
                .legal-mentions { margin-top: 25px; font-size: 9px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
                .center{text-align:center;}
            </style>
        </head>
        <body>
            <img src='https://cameleonconception.com/static-resources/img/logos/Logo_complet_noir_orange.png' style="height:45px; margin-bottom:15px;">
            <div class="header">
                <div><h1>Soumission${order.status === 0 ? ' <span style="color:red;">(ANNULÉE)</span>' : ''}</h1>
                    ${order.status === 0 ? ' <span style="color:red;">'+status+'</span>' : ''}
                    <p><strong>No. :</strong> web #${order.id}</p>
                    <p><strong>DATE :</strong> ${formatDateToLocal(order.date)}</p>
                </div>
                <div class="center"><img src="${qrCodeImageUrl}" style="width:80px;"><br><small>VOIR COMMANDE</small></div>
            </div>
            <div class="info-grid">
                <div><strong>VENDU À :</strong><p>${order.fname} ${order.lname}<br>${order.clientEmail}<br>${order.phone}</p></div>
                <div><strong>EXPÉDIÉ À :</strong><p>${order.address}<br>${order.city}, ${order.province}, ${order.postalCode}</p></div>
            </div>
            <table>
                <thead><tr><th style="width:50px; display:none">Lien</th><th  style="width:50px;">Qté</th><th>Description</th><th  style="width:75px;">Prix unit</th><th style="width:75px;">Montant</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>

            <div class="totals-container">
                <div class="payment-box" style="width:100%;">
                    ${order.notes ? `<div class="order-notes"><strong>Notes :</strong> ${order.notes}</div>` : ''}
                    <div style="display:flex; justify-content: space-between;">
                        <div class="payment-methods">
                            <strong>MODES DE PAIEMENT</strong><br>
                            • Comptant</br>
                            • Chèque: <strong>Caméléon conception Inc.</strong><br>
                            • Interac: <strong>info@cameleonconception.com</strong><br>
                            • Dépôt direct: Inst. 815 - Transit 30113 - Compte 0844852<br>
                            • Carte de crédit (sur demande)
                        </div>
                        <table class="totals-table">
                            <tr><td>Sous-total :</td><td class="right">${parseFloat(order.subtotal).toFixed(2)} $</td></tr>
                            <tr><td>Livraison :</td><td class="right">${parseFloat(order.shipping).toFixed(2)} $</td></tr>
                            <tr><td>TPS :</td><td class="right">${(parseFloat(order.tps)).toFixed(2)} $</td></tr>
                            <tr><td>TVQ :</td><td class="right">${(parseFloat(order.tvq)).toFixed(2)} $</td></tr>
                            <tr style="font-weight:bold; font-size:1.2em; border-top:2px solid #000;"><td>TOTAL :</td><td class="right">${parseFloat(order.total).toFixed(2)} $</td></tr>
                        </table>
                    </div>
                </div>
            </div>

            <div class="legal-mentions">
                <p>Facture payable sur réception</p>
<p>Les montants affichés sont taxes en sus. Livraison gratuite pour les commandes de 300 $ et plus (avant taxes).</p>
<p>Les prix sont déterminés en fonction des produits, des grandeurs, des quantités et des dimensions du logo. Tout changement pourrait faire varier les prix.</p>
<p>En payant cette facture, vous reconnaissez avoir les droits d'utilisation des logos et confirmez que vous acceptez les politiques disponibles sur notre site web.</p>
                <p style="margin-top:8px;">TPS: 735833816RT0001 | TVQ: 1230850824TQ0001 | NEQ: 1178956703</p>
            </div>
        </body>
        </html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
});
}

                                // --- LOGIQUE DU BOUTON ÉTIQUETTE D'EXPÉDITION (3x6) ---
                // --- LOGIQUE DU BOUTON ÉTIQUETTE SIMPLIFIÉE (3x6) ---
const shippingBtn = document.getElementById('shippingLabel');
if (shippingBtn && order) {
    shippingBtn.addEventListener('click', function() {
        const printWindow = window.open('', '_blank', 'width=400,height=800');
        const orderLink = window.location.href;
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderLink)}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Étiquette #${order.id}</title>
                <style>
                    @page { size: 3in 6in; margin: 0; }
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding-top: 50px; 
                        width: 3in; 
                        height: 6in; 
                        display: flex; 
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: flex-start; /* Tout à gauche */
                        box-sizing: border-box;
                    }
                    #logo { width: 175px;
                        position:absolute;
                        bottom:50px;
                        left:0
                        }
                    
                    .order-ref { 
                        font-size: 18px; 
                        font-weight: bold; 
                        margin-top: 20px; 
                        margin-bottom:15px;
                    }
                    
                    .address-block { 
                        font-size: 16px; 
                        line-height: 1.75;
                        margin-bottom: 40px;
                    }

                    .qr-code img { width: 75px; height: 75px;
                        position:absolute;
                        bottom:50px;
                        right:0; 
                        }
                </style>
            </head>
            <body>
                <img id="logo" src='https://cameleonconception.com/static-resources/img/logos/Logo_texte_noir.png'>

                <div class="order-ref">Soumission web #${order.id}</div>

                <div class="address-block">
                    ${order.fname} ${order.lname}<br>
                    ${order.address}<br>
                    ${order.city}, ${order.province}<br>
                    ${order.country}, ${order.postalCode}<br>
                    
                </div>

                <div class="qr-code">
                    <img src="${qrCodeImageUrl}" />
                </div>

                <script>
                    window.onload = function() { 
                        window.print(); 
                    };
                </script>
            </body>
            </html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    });
}

const epreuveBtn = document.getElementById('epreuveBtn');
if (epreuveBtn && order) {
    epreuveBtn.addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -1).join('/') + '/';
        
        // --- UTILISATION DE LA DATE DE LA COMMANDE POUR LA NOMENCLATURE ---
        // On crée un objet Date basé sur la date de la commande stockée
        const orderDateObj = new Date(order.date.replace(' ', 'T')); 
        const yy = orderDateObj.getFullYear().toString().slice(-2);
        const mm = (orderDateObj.getMonth() + 1).toString().padStart(2, '0');
        const dd = orderDateObj.getDate().toString().padStart(2, '0');
        
        const fileNameBase = `Épreuve_#F_cc_${order.id}_${order.fname}_${order.lname}_${yy}_${mm}_${dd} ${order.status === 0 ? ' <span style="color:red;"> (ANNULÉE)</span>' : ''}`;

        const items = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;
        let fullHtmlContent = '';

        if (items && Array.isArray(items)) {
            let pageNum = 1;
            items.forEach((item) => {
                if (!item.designSignature || item.designSignature === 'null') return;

                let imagesHtml = '';
                if (item.studioData && item.studioData.views) {
                    item.studioData.views.forEach((view, vIdx) => {
                        let imgPath = `${baseUrl}static-resources/temp-designs/${item.designSignature}/preview_v${vIdx + 1}.png`;

                        if(order.status == 0){
                        imgPath = `${baseUrl}static-resources/temp-designs/${item.designSignature}/preview_v${vIdx + 1}.png`;
                        }
                        imagesHtml += `
                            <div class="zoom-wrapper">
                                <img src="${imgPath}" class="epreuve-image">
                            </div>`;
                    });
                }

                fullHtmlContent += `
                    <div class="page-container">
                        <div class="header">
                            <div class="brand">
                                <img src="https://cameleonconception.com/static-resources/img/logos/Logo_complet_noir_orange.png" style="height:60px;">
                            </div>
                            <div class="order-ref">
                                ${fileNameBase}<br>
                                Page ${pageNum}
                            </div>
                        </div>

                        <div class="visual-container">
                            ${imagesHtml}
                        </div>

                        <div class="footer-gray-box">
                            <p class="product-info"><strong>${item.name} (personnalisé) - ${item.sku} - ${item.color}</strong></p>
                
                            <div class="disclaimer">
                                <p>Avant d'approuver cette épreuve, veuillez vérifier attentivement que toutes les informations (dimensions, couleurs, produits, textes, logos, etc.) correspondent à vos attentes.
                                En approuvant cette épreuve, vous confirmez également avoir les droits d'utilisation des logos et des éléments graphiques fournis.
                                Veuillez noter que les couleurs affichées sur cette épreuve peuvent légèrement différer des couleurs finales après impression, en raison des variations des supports et des procédés d'impression.</p>
                                <p><strong>IMPORTANT: Caméléon Conception Inc. ne pourra en aucun cas être tenu responsable des erreurs de production si celles-ci sont présentes sur l'épreuve au moment de l'approbation / commande.</strong></p>
                                <br>
                                <p>www.cameleonconception.com | info@cameleonconception.com | (438) 317-0376</p>
                            </div>
                        </div>
                    </div>
                `;
                pageNum++;
            });
        }

        const finalTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${fileNameBase}</title>
                <style>
                    @page { size: letter landscape; margin: 0; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; line-height: 1.3; }
                    .page-container { padding: 30px 30px; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; page-break-after: always; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
                    .order-ref { font-size: 10px; text-align: right; color: #555; }
                    .visual-container { flex-grow: 1; display: flex; justify-content: center; align-items: center; gap: 10px; margin: 10px 0; overflow: hidden; }
                    .zoom-wrapper { position: relative; width: 48%; height: 95%; overflow: hidden; display: flex; justify-content: center; align-items: center; cursor: zoom-in; }
                    .epreuve-image { max-width: 100%; max-height: 100%; object-fit: contain; border: none !important; box-shadow: none !important; transition: transform 0.3s ease-out; }
                    .zoom-wrapper:hover .epreuve-image { transform: scale(2.5); }
                    .footer-gray-box { background: rgba(230, 229, 229, 0.3); padding: 15px; border-radius: 5px; }
                    .product-info { font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; }
                    .disclaimer { font-size: 9.5px; text-align: left; }
                    .disclaimer p { margin: 0 0 5px 0; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .page-container { height: 100vh; }
                        .zoom-wrapper { cursor: default; }
                        .zoom-wrapper:hover .epreuve-image { transform: none; }
                    }
                </style>
            </head>
            <body>
                ${fullHtmlContent || '<div style="padding:0; display:flex; width:100%; height:100vh; align-items:center; justify-content:center; text-align:center;">Vous n\'avez aucun produit personnalisé</div>'}
                <script>
                    document.querySelectorAll('.zoom-wrapper').forEach(wrapper => {
                        wrapper.addEventListener('mousemove', function(e) {
                            const img = this.querySelector('img');
                            const rect = this.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            img.style.transformOrigin = \`\${x}% \${y}%\`;
                        });
                        wrapper.addEventListener('mouseleave', function() {
                            this.querySelector('img').style.transformOrigin = 'center';
                        });
                    });
                </script>
            </body>
            </html>`;

        printWindow.document.write(finalTemplate);
        printWindow.document.close();
    });
}
                // 3. Logique du statut (Select)
                let statusAction = document.getElementById('statusAction');
                let shippingLabel = document.getElementById('shippingLabel');
                if(statusAction){
                    if(order.status != 0){
                        statusAction.querySelector('option[value="'+ order.status +'"]').selected = true;
                        statusAction.addEventListener('change', updateOrderStatus);
                    }else{
                        statusAction.style.display = 'none';
                        shippingLabel.style.display = 'none';
                    }
                }
                
                let status = "";

                if(order.paymentError === '' || order.paymentError === null){
                    status = '<span style="color:red;">Commande annulée | Erreur lors de la commande</span>';
                }else{
                    status =  '<span style="color:red;">Commande annulée | ' + order.paymentError + '</span>';
                }

                let shippingInfo = "";

                if (order.status === 1) {
                    status = 'Votre commande sera bientôt produite';
                } else if (order.status === 2) {
                    status = 'Votre commande est en production';
                } else if (order.status === 3) {
                    status = 'Votre commande est terminée';
                    if(order.shippingMessage){
                        shippingInfo += "<div id='shippingInfoContainer'>";
                        shippingInfo += '<strong>Message de livraison :</strong><p>'+ order.shippingMessage + '</p>';
                        if(!order.shippingLink){
                            shippingInfo += "</div>";
                        }
                    }
                    if(order.shippingLink){
                        if(!order.shippingMessage){
                            shippingInfo += "<div id='shippingInfoContainer'>";
                        }
                        shippingInfo += '<strong>Suivre ma commande : </strong><p><a href="'+ order.shippingLink + '" target="_blank">'+ order.shippingLink + '</a></p></div>';
                    }
                } else if (order.status === 4) {
                    status = 'Votre commande a été livrée / récupérée';
                    if(order.shippingLink){
                        shippingInfo += "<div id='shippingInfoContainer'>";
                        shippingInfo += '<strong>Suivre ma commande : </strong><p><a href="'+ order.shippingLink + '" target="_blank">'+ order.shippingLink + '</a></p></div>';
                    }
                }
    
                
                
                container.innerHTML = `
                    <h1>SOUMISSION WEB #${order.id}</h1>
                    ${shippingInfo}
                    <p>Date : ${formatDateToLocal(order.date)}</p>
                    <p style="display:none;">Status : ${status}</p>
                    <p id="notes">Note(s) : ${order.notes ? order.notes : 'Aucune'}</p>
                    

                    <div id="orderInformationContainer">
                        <div id="selledTo">
                            <strong>Vendu à :</strong>
                             ${(order.company ? "<p>" + order.company + "</p>" : "")}
                            <p>${order.fname} ${order.lname} <span class='lightText'></span></p>
                            <p>${order.clientEmail}</p>
                            <p>${order.phone}</p>
                        </div>
                        <div id="shippedTo">
                            <strong>Adresse de livraison :</strong>
                            ${(order.company ? "<p>" + order.company + "</p>" : "")}
                            <p>${order.address}</p>
                            <p>${order.city}, ${order.province}</p>
                            <p>${order.country}, ${order.postalCode}</p>
                        </div>
                    </div>
                
                    <div id="orderProductsContainer">
                    </div>
                    <div id="orderTotalsContainer" style="display:none;">
                    <p>Sous-total : ${parseFloat(order.subtotal).toFixed(2)} $</p>
                    <p>Livraison : ${parseFloat(order.shipping).toFixed(2)} $</p>
                    <p>TPS : ${parseFloat(order.tps).toFixed(2)} $</p>
                    <p>TVQ : ${parseFloat(order.tvq).toFixed(2)} $</p>
                    <p>Total : ${parseFloat(order.total).toFixed(2)} $</p>
                    ${feesHTML}
                </div>
                `;
                
                const orderProductsContainer = document.getElementById('orderProductsContainer');
                
                if (order.details) {
                    try {
    const cartItems = JSON.parse(order.details);
    let productsHtml = '';

    cartItems.forEach(item => {
    const personalizationPrice = parseFloat(item.personalizationPrice) || 0;
    
    // --- NOUVELLE LOGIQUE DE REGROUPEMENT PAR PRIX ---
    const groupedByPrice = {};
let totalGroupPrice = 0;

item.sizes.forEach(s => {
    const unitPrice = parseFloat(s.price) + personalizationPrice;
    const priceKey = unitPrice.toFixed(2);
    totalGroupPrice += (unitPrice * s.qte);

    if (!groupedByPrice[priceKey]) {
        groupedByPrice[priceKey] = { price: unitPrice, totalQte: 0, details: [] };
    }
    groupedByPrice[priceKey].totalQte += parseInt(s.qte);
    // On stocke le format "qte (taille)"
    groupedByPrice[priceKey].details.push(`<span class="editableQte">${s.qte}</span><span>x(${s.size})</span>`);
});

const sizesHtml = Object.values(groupedByPrice).map(group => {
    return `<div class="size-row">
                <div>
                    ${group.details.join(', ')}
                </div>
                <div class="size-prices">
                    <span style="display:none;">${group.price.toFixed(2)} $ ch</span>
                </div>
            </div>`;
}).join('');
    // --- FIN DE LA LOGIQUE DE REGROUPEMENT ---

    const shortName = item.name.length > 25 ? item.name.substring(0, 25) + "..." : item.name;
    let isPersonnalized = item.studioData != null ? "Personnalisation : " + item.studioData.selectedPersonalizationOption : '';
    const cleanSig = (item.designSignature === 'null' || !item.designSignature) ? 'null' : item.designSignature;

    productsHtml += `
        <div class="cart-product-container" data-pid="${item.id}" data-sku="${item.sku}" data-color="${item.color}" data-design-signature="${cleanSig}"> 
            <summary onclick="toggleDetails(event)">
                <div class="quickInfoSummary">
                    <span>${shortName} (${item.sku}) - ${item.color}</span>
                    <span>${isPersonnalized}</span>
                </div>
                <span style="display:none;">${totalGroupPrice.toFixed(2)} $</span>
            </summary>
            <div class="editableSizesContainer" style="display:none;">
                <div class="product-meta-detail">
                </div>           
                ${generateStudioHTMLForOrder(order.id, item, order.status)}
                ${sizesHtml}
                ${(item.personalizationValue && item.personalizationValue !== 'Aucune personnalisation') ? `<p><strong>Option :</strong> ${item.personalizationValue}</p>` : ''}

            </div>
        </div>`;
});

    orderProductsContainer.innerHTML = productsHtml;

} catch (e) {
    console.error("Erreur parsing details:", e);
}
                } else {
                    orderProductsContainer.innerHTML = '<p>Aucun détail de produit trouvé pour cette commande.</p>';
                }
            } else if (data.success) {
                window.location.href = '403';
            } else {
                console.error("Erreur de l'API:", data.message);
                container.innerHTML = `<h1>Erreur : ${data.message}</h1>`;
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des commandes:', error));
});

function generateStudioHTMLForOrder(orderId, item, orderStatus) {
    // 1. Vérification de la présence d'une signature de design
    if (!item.designSignature || item.designSignature === 'null') return '';

    // 2. Récupération des données studio et vérification des vues
    const design = item.studioData;
    if (!design || !design.views) return '';

    // 3. Détermination du mode de personnalisation sélectionné
    const selectedOption = (design && design.selectedPersonalizationOption)
        || item.selectedPersonalizationOption
        || item.personalizationOption;

    const isCustomMode = selectedOption === "Personnalisé";

    // 4. Construction des rangées par vue
    let viewRows = design.views.map((view, index) => {
        // Sélection du chemin d'accès selon le statut de la commande (0 = annulation / dossier temporaire)
        let imagePath = `static-resources/temp-designs/${item.designSignature}/preview_v${index + 1}.png`;
        if (orderStatus === 0) {
            imagePath = `static-resources/temp-designs/${item.designSignature}/preview_v${index + 1}.png`;
        }
        
        // Génération de la liste des logos pour chaque vue
        const logosHtml = view.logos.map((l, logoIndex) => {
            let logoPath = `static-resources/temp-designs/${item.designSignature}/logo_v${index + 1}_n${logoIndex + 1}.png`;
            if (orderStatus === 0) {
                logoPath = `static-resources/temp-designs/${item.designSignature}/logo_v${index + 1}_n${logoIndex + 1}.png`;
            }

            if (isCustomMode) {
                // Mode Personnalisé : Masquer les dimensions et afficher uniquement le lien source
                return `
                    <li>
                        <span>Logo #${logoIndex + 1} ....</span> 
                        <a href="${logoPath}" target="_blank" title="Voir l'image source originale">
                            (source)
                        </a>
                    </li>`;
            } else {
                // Modes standards (DTF, UV DTF, Broderie, etc.) : Afficher dimensions + lien source
                const dimW = l.width || '0';
                const dimH = l.height || '0';
                return `
                    <li>
                        <span>${dimW}" x ${dimH}" ....</span> 
                        <a href="${logoPath}" target="_blank" title="Voir l'image source originale">
                            (source)
                        </a>
                    </li>`;
            }
        }).join('');

        return `
            <div class="cart-studio-row" style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center;">
                <div class="cart-preview-item">
                    <img src="${imagePath}" 
                         alt="Vue ${index + 1}" 
                         style="width: 100px; height: auto; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;"
                         onerror="this.parentElement.innerHTML='<small>Image non disponible</small>'"
                         onclick="openPreviewModal('${imagePath}')">
                </div>
                <div class="cart-logos-info-pale">
                    <p style="font-weight: bold; margin-bottom: 5px;">Vue ${index + 1}</p>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em; line-height: 1.5;">
                        ${logosHtml}
                    </ul>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="cart-studio-summary" style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
            <div class="cart-studio-container">
                ${viewRows}
            </div>
        </div>
    `;
}

// Fonction pour ouvrir/fermer les détails (identique au cart)
function toggleDetails(event) {
    let container = event.target.closest('.cart-product-container');
    let details = container.querySelector('.editableSizesContainer');
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'flex';
        container.classList.add('active');
    } else {
        details.style.display = 'none';
        container.classList.remove('active');
    }
}

function openPreviewModal(src) {
    let modal = document.getElementById('previewModal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="previewModal" class="preview-modal" onclick="this.style.display='none'; document.body.style.overflow='auto'">
                <span class="close-modal">&times;</span>
                <img class="modal-content" id="modalImage">
            </div>`);
        modal = document.getElementById('previewModal');
    }
    document.getElementById('modalImage').src = src;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}
function updateOrderStatus(event) {
    let selectElement = event.target;
    let selectedOption = selectElement.options[selectElement.selectedIndex];
    
    const newStatus = selectedOption.value;

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("id");
    
    let shippingMessage = '';
    let shippingLink = '';

    if (!orderId || !newStatus) {
        alert("Impossible de mettre à jour : ID de commande ou statut manquant.");
        return;
    }

    // -----------------------------------------------------
    // LOGIQUE MISE À JOUR : Gérer Message ET Lien pour le statut 3
    if (newStatus === '3') {
        
        // 1. Demander si l'utilisateur veut un message
        const wantMessage = window.confirm("Voulez-vous ajouter un message de livraison ?");
        
        if (wantMessage) {
            const messagePrompt = prompt("Veuillez entrer le message de livraison :");
            
            if (messagePrompt !== null && messagePrompt.trim() !== '') {
                shippingMessage = messagePrompt.trim();
            } else if (messagePrompt === null) {
                // L'utilisateur a annulé, on arrête tout
                return;
            }
        } 
        
        // 2. Demander si l'utilisateur veut un lien
        const wantLink = window.confirm("Voulez-vous ajouter un lien de suivi ?");
        
        if (wantLink) {
            const linkPrompt = prompt("Veuillez entrer le lien de suivi de la commande :", "");
            
            if (linkPrompt !== null && linkPrompt.trim() !== '') {
                shippingLink = linkPrompt.trim();
            } else if (linkPrompt === null) {
                // L'utilisateur a annulé, on arrête tout
                return;
            }
        }
        
        // Validation : Si rien n'a été fourni, annuler l'opération
        if (shippingMessage === '' && shippingLink === '') {
            alert("Mise à jour annulée. Veuillez fournir un message OU un lien pour le statut 'En livraison'.");
            return;
        }
    }
    // -----------------------------------------------------

    if (window.confirm("Voulez-vous mettre à jour le statut ?")) {
        
        // 🛠️ Préparation de l'URL de base
        let updateUrl = './api/UPDATE/orderStatus?id=' + orderId + '&newStatus=' + newStatus;
        
        // 🌟 Ajout des deux paramètres s'ils existent
        if (shippingMessage !== '') {
            updateUrl += '&shippingMessage=' + encodeURIComponent(shippingMessage);
        }
        if (shippingLink !== '') {
            updateUrl += '&shippingLink=' + encodeURIComponent(shippingLink);
        }

        fetch(updateUrl)
            .then(response => {
                 if (!response.ok) {
                    return response.json().then(errorData => { throw errorData; });
                 }
                 return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert("Statut mis à jour avec succès!");
                    window.location.reload();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                let message = error.message || error.msg || 'Erreur de connexion au serveur.';
                alert('Mise à jour échouée : ' + message);
            });
    }
}