Étape pour le clonage d'une boutique

1. Composer install dans le dossier
2. ajouter dans laboutiquec.com dossier de base. Dans le rooter ajouter le lien du fichier index du nouveau sous dossier exemple laboutiquec.com/ah/tb
3. Mettre à jour le fichier .env
4. remplacer le nom du sous dossier dans les fichiers : (ex: laboutiquec.com/ah/tb pour laboutiquec.com/cc)
    - htaccess
    - ressources-1.0/js/script.js (l'api pour allPreOrder)
    - Controllers/Rooter.php
5. Ajouter la base de donnée de base
6. Mettre les informations de connection a la base de donnée dans .env
7. Ajouter des produits dans la bd

8. ajouter les images/fiche techniques des produits : 
- dans static-resources/product/{sku} -- le sku qui est lien a la bd du produit
    - pour la fiche technique nomenclature : fiche-technique.pdf
    - pour le thumbnail du produit : thumbnail.webp
    - pour les photos : noir-1.webp -> mettre la couleur en minuscule et -1 jusqu'a 5 image par produit.

9. dans layout/nav.php -> ajuster le nom du comité étudiants dans la navbar

Une fois en live
10. ajouter les vraie stripe key dans .env
11. mettre les stripe key en mode live dans Controllers/config:         
    'appStripeStatus' => [
            'status' => 'TRUE',
            'key' => 'TEST', // 'TEST' or 'LIVE'
    ]


*** si jamais ce n'est pas livrer au comité directement a l'école il faut modifier le js api/get/user-info-for-payement et remplacer : if(key === 'address'){
                            document.getElementById(key).value = 'Cégep Ahuntsic, 9155 Rue St-Hubert';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'city'){
                            document.getElementById(key).value = 'Montréal';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'province'){
                            document.getElementById(key).value = 'Québec';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                             document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'country'){
                            document.getElementById(key).value = 'Canada';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                             document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'postalCode'){
                            document.getElementById(key).value = 'H2M1Y8';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else{
                            document.getElementById(key).value = value;
                        }

                        par : document.getElementById(key).value = value;


en mode live

- changer le htaccess dans la racine et dans le sous site web
- ajouter le nom du sous dossier au début des lien de addVIewdans controlers/rooter (Pas si on est dans un double sous dossier exemple cc)
- dans class/rooter/rooter.php changer le -1 par -2 ($underLevelCount = substr_count($this->getRequestUri(), '/') - 1); (Pas si on est dans un double sous dossier exemple cc)
- changer le chemin du fetch pour get all pre order ET KEEPaLIVE pour /template/api/GET/pre-orders
- modifier les textes et lien dans les static-ressources/emailTemplate
- modifier le lien et la nomenclature du $paymentResult = $stripeProcessor->processPayment( dans controller/POST/stripePayment
- mettre les stripe key live et mettre stripe en mode live
- changer le message au paiement pour la livraison dans js/get/user-info-for-payment et dans le message au cart
- Mettre a jour le shipping rate dans cart.js et dans controller stripePayment


1. Mettre dans le htaccess de la racine de laboutiquec.com le nouveau lien en addView()
2. Ajuster les lien dans .htaccess du sous-dossier
3. dans controllers/Rooter.php, ajouter devant toutes les path des pages et api le sous-dossier exemple : /cc
4. Dans class/Rooter/Rooter.php, ajuster le underLevelCount selon le nombre de sous-dossier. (faire une recherche de "$underLevelCount") et ajuste le -1 par le nb de sous dossiers. Exemple pour /cc ça va être -3
5. Mettre les api js avec la bonne fetch dans keepalive.js et script.js






