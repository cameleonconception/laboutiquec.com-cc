<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Catalogues');
    $HEADER->setDescription('Parcourez les catalogues de fournisseurs pour vous donner des idées ou pour voir ce que l\'on peut personnaliser');
    $HEADER->validateHeader();

    $activePage = 'Catalogues';
    
    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');

    // 1. Récupération des filtres sélectionnés dans l'URL
    $selectedCategories = isset($_GET['categories']) && $_GET['categories'] !== '' ? explode(',', $_GET['categories']) : [];
    $selectedSuppliers = isset($_GET['fournisseurs']) && $_GET['fournisseurs'] !== '' ? explode(',', $_GET['fournisseurs']) : [];
    $selectedBrands = isset($_GET['marques']) && $_GET['marques'] !== '' ? explode(',', $_GET['marques']) : [];
    $query = isset($_GET['query']) ? strtolower(trim($_GET['query'])) : '';

    // --- DICTIONNAIRE INTELLIGENT SIMPLIFIÉ ---
    $mappingCategories = [
        "Vêtements" => [
            "Vêtements", "Haut", "Bas", "Manteau", "Veste", "Hoodie", "Chandail à capuche", "Kangourou", "Coton ouaté", 
            "Crewneck", "T-shirt", "Polo", "Chemise", "Chemise corporative", "Débardeur", "Camisole", "Chandail à manches longues", 
            "Pull", "Polaire", "Gilet sans manches", "Doudoune", "Parka", "Veste isolante", "Veste légère", "Coupe-vent", 
            "Softshell", "Coquille souple", "Pantalon", "Short", "Jogging", "Jupe", "Robe", "Chaussettes", "Bas", 
            "Vêtement personnalisé", "Mode corporative", "Vêtement vierge", "Streetwear"
        ],
        "Vêtements de travail" => [
            "Vêtements de travail", "Vêtement de construction", "Haute visibilité", "Construction", "Pêche", "Vêtement offshore", 
            "Veste de travail", "Pantalon de travail", "Pantalon cargo", "Pantalon de pluie", "Pantalon d'hiver", "Salopette", 
            "Combinaison", "Vêtement ignifugé", "Résistant au feu", "Multinorm", "Veste haute visibilité", "Veste de pluie", 
            "Veste shell", "Veste de congélateur", "Chemise de travail", "Jean de travail", "Manteau de travail", "Veste de sécurité", 
            "Gilet de sécurité", "Short de travail", "Pantalon de peintre", "Uniforme", "Sarrau", "Uniforme médical", 
            "Uniforme de chef", "Uniforme hôtellerie", "Uniforme hospitalier", "Tunique médicale", "Tablier"
        ],
        "Vêtements de sport" => [
            "Sport", "Vêtement de sport", "Vêtement de golf", "Polo de golf", "Veste de golf", "Articles de golf", 
            "Chapeau de golf", "Accessoire de golf", "Serviette de golf", "Veste de sport", "Warm-up", "Pantalon de sport", 
            "Maillot", "Jersey", "Uniforme sportif", "Uniforme de soccer", "Uniforme de basketball", "Uniforme de football", 
            "Uniforme de baseball", "Fanwear", "Sublimation", "Vêtement de course", "Vêtement de vélo", "Vêtement de ski de fond", 
            "Vêtement de triathlon", "Vêtement d'équipe", "Balle de golf", "Bâton de golf", "Driver", "Fer", "Wedge", "Putter", 
            "Sac de golf", "Gant de golf", "Chaussures de golf", "Balle de baseball", "Équipement de baseball", "Legging", "Cuissard", "Tennis",         
        ],
        "Saisons" => [
            "Vêtement d'hiver", "Vêtement de pluie", "Sous-vêtement thermique", "Couche de base", "Chaussures de sécurité", 
            "Bottes de travail", "Bottes d'hiver", "Gants", "Chaussettes", "Lunettes de sécurité", "EPI", "Équipement de protection", 
            "Genouillère", "Ceinture de travail", "Mitaines", "Moufles", "Gants d'hiver", "Gants de ski", "Gants de snowboard", 
            "Gants de cuir", "Gants de travail", "Gants de vélo", "Gants de course", "Sous-gants", "Manchons", "Accessoires d'hiver", 
            "Parapluie", "Lunettes de protection", "Casque", "Masque", "Lunettes de soleil"
        ],
        "Casquettes et accessoires" => [
            "Casquette", "Tuque", "Bonnet", "Cagoule", "Cache-cou", "Passe-montagne", "Chapeau", "Écharpe", "Casquette snapback", 
            "Casquette de baseball", "Casquette ajustable", "Casquette de camionneur", "Trucker hat", "Casquette 5 panneaux", 
            "Casquette 6 panneaux", "Visière", "Chapeau de paille", "Bob", "Bucket hat", "Bandeau", "Bandana", "Chapeau d'hiver"
        ],
        "Articles de bureau" => [
            "Articles de bureau", "Stylo", "Stylo en métal", "Stylo en plastique", "Crayon", "Marqueur", "Surligneur", 
            "Stylet", "Carnet de notes", "Cahier", "Journal", "Agenda", "Bloc-notes", "Horloge", "Cadre photo"
        ],
        "Breuvages" => [
            "Bouteille", "Bouteille d'eau", "Bouteille isotherme", "Gourde", "Tasse", "Tasse de voyage", "Tasse isotherme", 
            "Gobelet", "Mug", "Thermos", "Verre", "Verre à vin", "Verre à bière", "Verre à whisky", "Chope", "Carafe", 
            "Infuseur", "Seau à glace", "Flûte"
        ],
        "Sacs" => [
            "Sac", "Sac à dos", "Sac isotherme", "Sac de voyage", "Sac de sport", "Bagage", "Valise", "Portefeuille", 
            "Sac à cordon", "Glacière", "Sac réutilisable", "Tote bag", "Sac fourre-tout", "Sac en toile", "Sac d'épicerie", 
            "Sac en coton", "Trousse", "Trousse de toilette", "Sac écologique", "Sac personnalisé", "Sac à dos d'ordinateur", 
            "Sac de messager", "Sac bandoulière", "Housse d'ordinateur", "Pochette d'ordinateur", "Accessoires de voyage", 
            "Rangement technologique", "Sac d'équipement"
        ],
        "Technologie" => [
            "Technologie", "Clé USB", "Casque audio", "Écouteurs", "Haut-parleur Bluetooth", "Banque d'alimentation", 
            "Batterie externe", "Powerbank", "Chargeur", "Chargeur sans fil", "Accessoires technologiques", "Souris", 
            "Clavier", "Casque d'écoute", "Moniteur", "Tablette", "Accessoires informatiques"
        ],
        "Cadeaux corporatifs et articles promo." => [
            "Cadeau corporatif", "Cadeau de reconnaissance", "Trophée", "Cristal", "Plaque", "Médaille", "Coffret cadeau", 
            "Bougie", "Chandelle", "Montre", "Bijoux", "Lampe de poche", "Porte-clés", "Outil multifonction", "Couteau utilitaire", 
            "Couverture", "Coupe", "Acrylique", "Plaque gravée", "Ruban", "Prix corporatif", "Récompense", "Gravure laser", 
            "Cadeau d'entreprise", "Article promotionnel", "Articles promotionnel", 
        ],
        "Alimentaire" => [
            "Cadeau gastronomique", "Cadeau corporatif gourmand", "Planche à découper", "Couteau à fromage", "Couteau de cuisine", 
            "Sirop d'érable", "Sauce BBQ", "Sauce", "Condiment", "Épices", "Assaisonnement", "Marinade", "Panier cadeau", 
            "Coffret cadeau alimentaire"
        ],
        "Emballage industriel" => [
            "Emballage", "Boîte d'emballage", "Ruban adhésif", "Équipement d'entrepôt", "Rayonnage", "Palette", "Chariot", 
            "Fait au Québec", "Local", "Écoresponsable", "Coton biologique", "Matériaux recyclés", "Coton recyclé", 
            "Vêtement écoresponsable", "Vêtement recyclé"
        ],
        "Entreprise Local" => [
            "Fait au québec", "Fait au canada", "Montréal"
        ], 
        "Enfant" => [
            "Enfant", "Bébé"
        ], 
        "Bébé" => [
            "Bébé"
        ], 
        "Adulte" => [
            "Homme", "Femme"
        ], 
        "Homme" => [
            "Homme"
        ], 
        "Femme" => [
            "Femme"
        ], 
    ];

    // --- LISTE DES FOURNISSEURS ET CATALOGUES ---
    $catalogues = [
        [
            "name" => "Helly Hansen | Workwear",
            "img_url" => "hh_workwear",
            "categories" => "Vêtements, Vêtements de travail, Saisons, Casquettes et accessoires, Sacs",
            "url" => "https://www.dropbox.com/scl/fi/0ag8z4gikvvdr5chbi1d3/HHWW_2026_CA-Buyers-Guide-Digital.pdf?rlkey=jfavlfp2yj4y2pzvlfiduap68&st=jd8vlcwj&dl=0",
            "Marques" => "Helly Hansen, HH Workwear, Chelsea Evolution, Kensington, Magni Evolution, Manchester, Oxford, Luna, Alta, Alna, ICU, UC-ME, Addvis, Multinorm, Fakse, Fyre, Fargo, Tech, Bifrost, LIFA, LIFA Active, LIFA Merino, LifaLoft, Helly Tech, Polartec, PrimaLoft, BRZ, Evo"
        ],
        [
            "name" => "S&S Canada",
            "img_url" => "s_s_canada",
            "categories" => "Vêtements, Vêtements de travail, Vêtements de sport, Saisons, Casquettes et accessoires, Sacs, Emballage industriel, Enfant, Bébé, Adulte, Homme, Femme",
            "url" => "https://fr-ca.ssactivewear.com/",
            "Marques" => "Gildan, Comfort Colors, American Apparel, Champion, Adidas, Under Armour, Columbia, Oakley, Independent Trading Co., Richardson, M&O, BELLA + CANVAS, Hanes, Badger, Augusta Sportswear, Holloway, Russell Athletic, New Era, Flexfit, YP Classics, CORE365, Team 365, Harriton, Devon & Jones, North End, AllPro, Red Kap, Bulwark, DRI DUCK, Imperial, Puma Golf, Swannies, Boxercraft, J. America, Colortone, Shaka Wear, Weatherproof, HUK, Alleson Athletic, LAT, Kishigo, Nomadix, Paragon"
        ],
        [
            "name" => "Canada Sportswear",
            "img_url" => "canada_sportswear",
            "categories" => "Vêtements, Vêtements de travail, Saisons, Casquettes et accessoires, Cadeaux corporatifs, Enfant, Adulte, Homme, Femme",
            "url" => "https://canadasportswear.com/",
            "Marques" => "Canada Sportswear, CSW 24/7, Muskoka Trail Garment Co., Heritage 54, CX2, CX2 Rugged, CX2 Hi-Vis, Flexfit, Yupoong, CSW Custom, Genuine Leather"
        ],
        [
            "name" => "St-Regis Group",
            "img_url" => "st_regis_group",
            "categories" => "Articles de bureau, Breuvages, Sacs, Technologie, Cadeaux corporatifs, Alimentaire",
            "url" => "https://ca.stregisgrp.com/channel/home-office",
            "Marques" => "Ad hoc, All American Writing Instruments, Bubba, BUILT, Cerruti 1881, Contigo, Coleman, Cole & Mason, Eccolo, Euro Design, Garland, Glencairn, HidrateSpark, Hugo Boss, HydraPeak, K&R New York, LARQ, Logitech, mr Britesign, OtterBox, Pencil Heroes, Pen Heroes, PenScents, Pokka, ReelCharge, RePen, RevMark, RIEDEL, Ritter Pen, Rollink, Satechi, Shinola, Splitflask, SRG Global, Stilolinea, S'well, Swarovski, Swiss Force, Swissmar, Thermos, Tilley, Tumi, WaterH, Woodwick, Yankee Candle, Zyliss"
        ],
        [
            "name" => "Private Agent Group",
            "img_url" => "private_agent",
            "categories" => "Vêtements, Oversize, Casquettes et accessoires, Enfant, Adulte, Homme, Femme, Polo, hoodie",
            "url" => "https://www.privateagentdnd.com/",
            "Marques" => "AXISM, BEANIIEZ, INDEPENDENT, NISSI CAPS, OPTIMA, SHAKA WEAR"
        ],
        [
            "name" => "Sports Group Denmark",
            "img_url" => "sports_group_denmark",
            "categories" => "Vêtements, Hiver, Casquettes et accessoires, Enfant, Adulte, Homme, Femme, Polo, hoodie, Course, Vêtements de sport, Saisons, Legging, Cuissar, Vélo",
            "url" => "https://sports-group-sgd.com/",
            "Marques" => "Endurance, Virtus, Nou, Wheather report, Slope, SOS, Athelecia, SportswearQ, Elite Lab, Whistler, ZigZag, Cruz, FZ Forzam, Mizuno"
        ],
        [
            "name" => "Sanmar Canada",
            "img_url" => "sanmar_canada",
            "categories" => "Vêtements, Vêtements de travail, Vêtements de sport, Saisons, Casquettes et accessoires, Sacs, Emballage industriel, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.sanmarcanada.com/",
            "Marques" => "Allmade, ATC, Coal Harbour, Bulwark FR, Callaway, Carhartt, Dickies, DryFrame, Eddie Bauer, INIVI, KOI, New Era, Nike, Nike Dri-FIT, OGIO, Original Penguin, Red Kap, Red Kap Chef Designs, The North Face"
        ],
        [
            "name" => "Momentec",
            "img_url" => "momentec",
            "categories" => "Vêtements, Vêtements de sport, Casquettes et accessoires, Sacs, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.momentecbrands.ca/",
            "Marques" => "Augusta Sportswear, Holloway, Russell Athletic, High Five, Pacific Headwear, Badger Sport, Alleson Athletic, C2 Sport, Garb Athletic, ProSphere, CC Cap, Chromagear, Under Armour (licence équipes)"
        ],
        [
            "name" => "Cutter & Buck",
            "img_url" => "cutter_buck",
            "categories" => "Vêtements, Vêtements de sport, Enfant, Adulte, Homme, Femme",
            "url" => "https://cutterbuck.ca/",
            "Marques" => "Cutter & Buck, Clique, Annika, CB WeatherTec"
        ],
        [
            "name" => "Printer",
            "img_url" => "printer",
            "categories" => "Vêtements, Vêtements de travail, Emballage industriel, Enfant, Adulte, Homme, Femme",
            "url" => "https://cdn.shopify.com/s/files/1/0636/2152/9829/files/PRINTER_CATALOGUE_2025_LR.pdf?v=1755793159",
            "Marques" => "Printer Activewear, Printer Essentials, Printer Prime, ProJob"
        ],
        [
            "name" => "James Harvest",
            "img_url" => "james_harvest",
            "categories" => "Vêtements",
            "url" => "https://cdn.shopify.com/s/files/1/0636/2152/9829/files/JH_CATALOGUE_25_LR.pdf?v=1755793158",
            "Marques" => "James Harvest Sportswear, J.Harvest & Frost, Frost"
        ],
        [
            "name" => "Projob",
            "img_url" => "projob",
            "categories" => "Vêtements, Vêtements de travail, Saisons",
            "url" => "https://cdn.shopify.com/s/files/1/0636/2152/9829/files/2024_PROJOB_Catalog_NAM7_LR.pdf?v=1751241894",
            "Marques" => "ProJob Workwear, ProJob Ergonomic"
        ],
        [
            "name" => "Caldwell Recognition",
            "img_url" => "caldwell",
            "categories" => "Cadeaux corporatifs",
            "url" => "https://caldwellrecognition.com/",
            "Marques" => "Caldwell, Caldwell Awards"
        ],
        [
            "name" => "C'est beau",
            "img_url" => "cest_beau",
            "categories" => "Vêtements, Sacs, Entreprise Local, Enfant, Adulte, Homme, Femme",
            "url" => "https://cestbeau.co/",
            "Marques" => "C'est beau"
        ],
        [
            "name" => "Attraction",
            "img_url" => "attraction",
            "categories" => "Vêtements, Entreprise Local, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.attraction.com/",
            "Marques" => "Ethica, MainStreet, Attraction"
        ],
        [
            "name" => "Jameo",
            "img_url" => "jameo",
            "categories" => "Vêtements, Entreprise Local, Casquettes et accessoires, Saisons, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.jameo.com/",
            "Marques" => "Jameo"
        ],
        [
            "name" => "Fashion Biz",
            "img_url" => "fashion_biz",
            "categories" => "Vêtements, Vêtements de travail, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.fashionbiz.ca/",
            "Marques" => "Biz Collection, Biz Corporates, Biz Care, Biz Cool, Biz Comfortcool, Biz Tech, Biz Eco, Biz Scrubs, Syzmik Workwear, Yes!Chef"
        ],
        [
            "name" => "Uline",
            "img_url" => "uline",
            "categories" => "Articles de bureau, Breuvages, Sacs, Cadeaux corporatifs, Emballage industriel, Saisons, Vêtements, Vêtements de travail",
            "url" => "https://fr.uline.ca/",
            "Marques" => "Uline, Rubbermaid, 3M, DeWalt, Milwaukee"
        ],
        [
            "name" => "Altis",
            "img_url" => "altis",
            "categories" => "Vêtements, Vêtements de sport, Enfant, Adulte, Homme, Femme, Entreprise Local",
            "url" => "https://www.altiscreations.com/",
            "Marques" => "Altis, Altis Créations"
        ],
        [
            "name" => "Lenovo",
            "img_url" => "lenovo",
            "categories" => "Sacs, Technologie",
            "url" => "https://www.lenovo.com/ca/fr/",
            "Marques" => "Lenovo, ThinkPad, IdeaPad, Legion, Yoga"
        ],
        [
            "name" => "Stormtech",
            "img_url" => "stormtech",
            "categories" => "Vêtements, Saisons, Sacs, Casquettes et accessoires, Adulte, Homme, Femme",
            "url" => "https://www.stormtech.ca/",
            "Marques" => "Stormtech, Stormtech Performance, H2XTREME, H2X-DRY, Thermolex"
        ],
        [
            "name" => "PKG",
            "img_url" => "pkg",
            "categories" => "Sacs",
            "url" => "https://www.pkgshop.com/",
            "Marques" => "PKG Carry Goods, PKG"
        ],
        [
            "name" => "Headwear Professionals",
            "img_url" => "headwear",
            "categories" => "Casquettes et accessoires",
            "url" => "https://headwearcanada.ca/",
            "Marques" => "Headwear, Headwear Professionals"
        ],
        [
            "name" => "AJM",
            "img_url" => "ajm",
            "categories" => "Casquettes et accessoires, Enfant, Adulte, Homme, Femme",
            "url" => "https://www.ajmintl.com/",
            "Marques" => "AJM International, AJM"
        ],
        [
            "name" => "Fabrik & Co",
            "img_url" => "fabrik",
            "categories" => "Sacs, Cadeaux corporatifs",
            "url" => "https://www.fabrik-co.com/",
            "Marques" => "Fabrik & Co"
        ],
        [
            "name" => "Gatts",
            "img_url" => "gatts",
            "categories" => "Vêtements, Vêtements de travail, Saisons",
            "url" => "https://gattsworkwear.com/",
            "Marques" => "Gatts Workwear, Gatts"
        ],
        [
            "name" => "Busrel",
            "img_url" => "busrel",
            "categories" => "Articles de bureau, Breuvages, Sacs, Technologie, Cadeaux corporatifs",
            "url" => "https://www.busrel.com/",
            "Marques" => "Busrel, Pier Laurent, JG, Cross, High Sierra, Wenger"
        ],
        [
            "name" => "Just Like Hero",
            "img_url" => "just_like_hero",
            "categories" => "Vêtements",
            "url" => "https://www.justlikehero.com/",
            "Marques" => "Just Like Hero, Hero"
        ],
        [
            "name" => "PCNA / LEEDS",
            "img_url" => "pcna",
            "categories" => "Articles de bureau, Breuvages, Sacs, Technologie, Cadeaux corporatifs, Vêtements de sport, Adulte, Homme, Femme",
            "url" => "https://www.pcna.com/en-ca",
            "Marques" => "Leeds, Bullet, JournalBooks, Trimark, ETS, CamelBak, Bellroy, Case Logic, High Sierra, Herschel, Hydro Flask, Klean Kanteen, Mophie, OXO, Skullcandy, Stanley, Thule, Topo Designs, Arctic Zone, Wenger, Field & Co., Elleven"
        ],
        [
            "name" => "Craft Sports Canada",
            "img_url" => "craft",
            "categories" => "Vêtements, Vêtements de sport, Saisons, Adulte, Homme, Femme, Enfant",
            "url" => "https://craftsports.ca/",
            "Marques" => "Craft Sportswear, Craft"
        ],
        [
            "name" => "Auclair",
            "img_url" => "auclair",
            "categories" => "Saisons",
            "url" => "https://auclair.com/fr",
            "Marques" => "Auclair, Auclair Sports, Paris"
        ],
        [
            "name" => "Nexgen Golf Products",
            "img_url" => "nexgen",
            "categories" => "Vêtements de sport, Casquettes et accessoires, Sacs, Saisons, Adulte, Homme, Femme",
            "url" => "https://www.nexgengolf.com/en/cad",
            "Marques" => "Nexgen, Titleist, TaylorMade, Callaway, Wilson, Wilson Staff, Srixon, Bridgestone, Maxfli, Vice, FootJoy, Rawlings, Bushnell, Nike Vision"
        ],
        [
            "name" => "Get Sauced",
            "img_url" => "get_sauced",
            "categories" => "Alimentaire",
            "url" => "https://getsauced.com/",
            "Marques" => "Get Sauced, Get Sauced BBQ"
        ],
        [
            "name" => "Debco | HPG",
            "img_url" => "debco",
            "categories" => "Articles de bureau, Breuvages, Sacs, Technologie, Cadeaux corporatifs, Emballage industriel, Saisons, Vêtements de sport",
            "url" => "https://hpgbrands.ca/debco/",
            "Marques" => "Debco, Hub, Hub Pen, Origaudio, Handstands, Mixie, Evans, Beacon, Beacon Promotions, BEST"
        ],
    ];

    // --- RECHERCHE ET CORRESPONDANCES ---
    if (!empty($query)) {
        foreach ($mappingCategories as $parentCat => $subCats) {
            foreach ($subCats as $subCat) {
                if (strtolower($subCat) === $query) {
                    if (!in_array($parentCat, $selectedCategories)) {
                        $selectedCategories[] = $parentCat;
                    }
                    $query = ''; 
                    break 2;
                }
            }
        }
    }

    $mappedSelectedCategories = [];
    foreach ($selectedCategories as $selectedCat) {
        $mappedSelectedCategories[] = $selectedCat;
        foreach ($mappingCategories as $parentCat => $subCats) {
            if (in_array($selectedCat, $subCats)) {
                $mappedSelectedCategories[] = $parentCat;
            }
        }
    }
    $mappedSelectedCategories = array_unique($mappedSelectedCategories);

    // Extraction globale
    $rawSuppliers = []; $rawBrands = [];
    foreach ($catalogues as $item) {
        if (!empty($item['name'])) $rawSuppliers[] = trim($item['name']);
        if (!empty($item['Marques'])) {
            foreach (explode(',', $item['Marques']) as $b) $rawBrands[] = trim($b);
        }
    }
    
    $rawCategories = array_keys($mappingCategories); 
    $rawSuppliers = array_unique($rawSuppliers);
    $rawBrands = array_unique($rawBrands);

    // Éléments valides
    $validSuppliers = []; $validCategories = []; $validBrands = [];

    foreach ($catalogues as $item) {
        $itemCats = !empty($item['categories']) ? array_map('trim', explode(',', $item['categories'])) : [];
        $itemBrands = !empty($item['Marques']) ? array_map('trim', explode(',', $item['Marques'])) : [];

        $itemExtendedCats = $itemCats;
        foreach ($itemCats as $cat) {
            if (isset($mappingCategories[$cat])) {
                $itemExtendedCats = array_merge($itemExtendedCats, $mappingCategories[$cat]);
            }
        }

        $matchQuery = empty($query) || 
                     str_contains(strtolower($item['name']), $query) || 
                     !empty(array_filter($itemExtendedCats, function($v) use ($query) { return str_contains(strtolower($v), $query); })) ||
                     !empty(array_filter($itemBrands, function($v) use ($query) { return str_contains(strtolower($v), $query); }));

        $passSupplierFilter = empty($selectedSuppliers) || in_array($item['name'], $selectedSuppliers);
        $passCategoryFilter = empty($mappedSelectedCategories) || !empty(array_intersect($mappedSelectedCategories, $itemExtendedCats));
        $passBrandFilter = empty($selectedBrands) || !empty(array_intersect($selectedBrands, $itemBrands));

        if ($matchQuery && $passCategoryFilter && $passBrandFilter) {
            $validSuppliers[] = $item['name'];
        }
        if ($matchQuery && $passSupplierFilter && $passBrandFilter) {
            foreach ($itemCats as $c) $validCategories[] = $c;
        }
        if ($matchQuery && $passSupplierFilter && $passCategoryFilter) {
            foreach ($itemBrands as $b) $validBrands[] = $b;
        }
    }
    $validSuppliers = array_unique($validSuppliers);
    $validCategories = array_unique($validCategories);
    $validBrands = array_unique($validBrands);

    function sortAvailableFirst($rawList, $validList, $selectedList) {
        $available = []; $unavailable = [];
        foreach ($rawList as $value) {
            $is_checked = in_array($value, $selectedList);
            $is_valid = in_array($value, $validList);
            if ($is_checked || $is_valid) { $available[] = $value; } else { $unavailable[] = $value; }
        }
        sort($available); sort($unavailable);
        return array_merge($available, $unavailable);
    }

    $allSuppliers = sortAvailableFirst($rawSuppliers, $validSuppliers, $selectedSuppliers);
    $allCategories = sortAvailableFirst($rawCategories, $validCategories, $selectedCategories);
    $allBrands = sortAvailableFirst($rawBrands, $validBrands, $selectedBrands);
?>

<style>
    .checkboxFilterContainer.disabled-filter {
        opacity: 0.4;
        text-decoration: line-through;
        cursor: not-allowed;
    }
    .checkboxFilterContainer.disabled-filter input {
        cursor: not-allowed;
    }
    /* Style pour les images & skeleton loader dans les cartes catalogues */
    .catalogue-item {
        position: relative;
        overflow: hidden;
        display: block;
    }
    .catalogue-img-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 180px;
    }
    .catalogue-img-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    .catalogue-img-wrapper img.loaded {
        opacity: 1;
    }
    .thumbnail-skeleton {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        z-index: 1;
    }
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
</style>

<main>
    <section class="cataloguesSection contentPage">
        <h1 class="title">CATALOGUES</h1>
        <p class="titleDesc">Notre boutique en ligne ne présente qu’une partie de nos articles personnalisables. <br>Si vous ne trouvez pas le produit idéal, explorez les catalogues de nos fournisseurs ici ou <a href="https://cameleonconception.com/contact" class="linkVisible">contactez-nous</a> !</p>
        <div id="toggle-filter-section" onclick="toggleFilterSection()">Filtres<img src="<?php echo $staticResources;?>/default/icons/white/filter-2.png"></div>
        
        <div id="filter-section">
            <details>
                <summary>Fournisseurs</summary>
                <div class='developedDetails'>
                    <input type="text" class="filter-search" placeholder="Rechercher un fournisseur" onkeyup="filterList(this, 'suppliers-container')">
                    <div id="suppliers-container">
                        <?php foreach ($allSuppliers as $supplier): 
                            $isChecked = in_array($supplier, $selectedSuppliers) ? 'checked' : '';
                            $isDisabled = !$isChecked && !in_array($supplier, $validSuppliers);
                        ?>
                            <div class='checkboxFilterContainer <?php echo $isDisabled ? 'disabled-filter' : ''; ?>'>
                                <input type='checkbox' data-type='fournisseurs' data-name='<?php echo htmlspecialchars($supplier); ?>' <?php echo $isChecked; ?> <?php echo $isDisabled ? 'disabled' : ''; ?>>
                                <label><?php echo htmlspecialchars($supplier); ?></label>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <button onclick='searchProduct()'>Filtrer</button>
                </div>
            </details>

            <details>
                <summary>Catégories</summary>
                <div class='developedDetails'>
                    <input type="text" class="filter-search" placeholder="Rechercher" onkeyup="filterList(this, 'categories-container')">
                    <div id="categories-container">
                        <?php foreach ($allCategories as $category): 
                            $isChecked = in_array($category, $selectedCategories) ? 'checked' : '';
                            $isDisabled = !$isChecked && !in_array($category, $validCategories);
                        ?>
                            <div class='checkboxFilterContainer <?php echo $isDisabled ? 'disabled-filter' : ''; ?>'>
                                <input type='checkbox' data-type='categories' data-name='<?php echo htmlspecialchars($category); ?>' <?php echo $isChecked; ?> <?php echo $isDisabled ? 'disabled' : ''; ?>>
                                <label><?php echo htmlspecialchars($category); ?></label>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <button onclick='searchProduct()'>Filtrer</button>
                </div>
            </details>

            <details>
                <summary>Marques</summary>
                <div class='developedDetails'>
                    <input type="text" class="filter-search" placeholder="Rechercher une marque" onkeyup="filterList(this, 'brands-container')">
                    <div id="brands-container">
                        <?php foreach ($allBrands as $brand): 
                            $isChecked = in_array($brand, $selectedBrands) ? 'checked' : '';
                            $isDisabled = !$isChecked && !in_array($brand, $validBrands);
                        ?>
                            <div class='checkboxFilterContainer <?php echo $isDisabled ? 'disabled-filter' : ''; ?>'>
                                <input type='checkbox' data-type='marques' data-name='<?php echo htmlspecialchars($brand); ?>' <?php echo $isChecked; ?> <?php echo $isDisabled ? 'disabled' : ''; ?>>
                                <label><?php echo htmlspecialchars($brand); ?></label>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <button onclick='searchProduct()'>Filtrer</button>
                </div>
            </details>

            <input id='searchBar' type='search' placeholder='Rechercher...' value='<?php echo htmlspecialchars($query); ?>'>
            <button onclick='searchProduct()'>Filtrer</button>
            <a class='toHideInBigScreen' href='./catalogues'>Supprimer les filtres</a>
            <img onclick='window.location.href="./catalogues"' class='icons' src='static-resources/default/icons/black/reload.png'>
        </div>

        <div id="ownedCategory"></div>

        <div id="cataloguesGallery">
            <?php
            $hasResults = false;
            foreach ($catalogues as $item) {
                $showItem = false;

                if (empty($query) && empty($selectedCategories) && empty($selectedSuppliers) && empty($selectedBrands)) {
                    $showItem = true;
                } else {
                    $matchQuery = empty($query) || str_contains(strtolower($item['name']), $query);

                    $matchCategory = true;
                    if (!empty($selectedCategories)) {
                        $itemCats = array_map('trim', explode(',', $item['categories']));
                        $matchCategory = !empty(array_intersect($selectedCategories, $itemCats));
                    }

                    $matchSupplier = true;
                    if (!empty($selectedSuppliers)) {
                        $matchSupplier = in_array($item['name'], $selectedSuppliers);
                    }

                    $matchBrand = true;
                    if (!empty($selectedBrands)) {
                        $itemBrands = !empty($item['Marques']) ? array_map('trim', explode(',', $item['Marques'])) : [];
                        $matchBrand = !empty(array_intersect($selectedBrands, $itemBrands));
                    }

                    if ($matchQuery && $matchCategory && $matchSupplier && $matchBrand) {
                        $showItem = true;
                    }
                }

                if ($showItem) {
                    $hasResults = true;
                    $safeName = htmlspecialchars($item['name']);
                    $safeUrl = htmlspecialchars($item['url']);
                    $safeCats = htmlspecialchars($item['categories']);
                    $imgSrc = "./static-resources/img/catalogues/" . htmlspecialchars($item['img_url']) . ".webp";

                    echo '<a class="catalogue-item" data-category="'.$safeCats.'" href="'.$safeUrl.'" target="_blank">
                             <span>'.$safeName.'</span>
                             <div class="catalogue-img-wrapper">
                                 <div class="thumbnail-skeleton"></div>
                                 <img src="'.$imgSrc.'" 
                                      alt="Catalogue '.$safeName.'" 
                                      loading="lazy"
                                      onload="this.classList.add(\'loaded\'); if(this.previousElementSibling) this.previousElementSibling.style.display=\'none\';"
                                      onerror="this.src=\'./static-resources/default/products/introuvable.webp\'; this.removeAttribute(\'onerror\'); this.classList.add(\'loaded\'); if(this.previousElementSibling) this.previousElementSibling.style.display=\'none\';">
                             </div>
                          </a>';
                }
            }

            if (!$hasResults) {
                echo '<div class="cartMessage">
                        <p>Nous n\'avons trouvé aucun catalogue correspondant à vos critères.</p>
                        <div class="actionContainer">
                            <a href="./catalogues" class="btn-primary">Réinitialiser les filtres</a>
                            <a href="https://cameleonconception.com/contact" class="btn-secondary">Nous joindre</a>
                        </div>
                      </div>';
            }
            ?>
        </div>
    </section>
</main>

<script>
// Fonction universelle pour ajouter un tag/badge de filtre (Harmonisée avec products)
function addNewFilterTag(filterValue, filterType) {
    let ownedCategory = document.querySelector('#ownedCategory');
    if (!ownedCategory || !filterValue) return;

    ownedCategory.style.display = 'flex';

    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'badge-filter filter-tag-item';
    badgeDiv.setAttribute('data-filter-value', filterValue);
    badgeDiv.setAttribute('data-filter-type', filterType);
    
    badgeDiv.innerHTML = `<span>${escapeHTML(filterValue)}</span><button type="button" class="deleteBtn">x</button>`;

    badgeDiv.querySelector('.deleteBtn').onclick = () => {
        const checkbox = document.querySelector(`input[type="checkbox"][data-type="${filterType}"][data-name="${CSS.escape(filterValue)}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
        badgeDiv.remove();
        
        if (ownedCategory.children.length === 0) {
            ownedCategory.style.display = 'none';
        }

        searchProduct();
    };

    ownedCategory.appendChild(badgeDiv);
}

// Nettoyage HTML des caractères spéciaux
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#39;")
        .replace(/"/g, "&quot;");
}

// Chargement automatique des tags actifs au chargement de la page
document.addEventListener("DOMContentLoaded", function() {
    <?php if (!empty($selectedCategories)): ?>
        const phpCategories = <?php echo json_encode($selectedCategories); ?>;
        phpCategories.forEach(value => addNewFilterTag(value, 'categories'));
    <?php endif; ?>

    <?php if (!empty($selectedSuppliers)): ?>
        const phpSuppliers = <?php echo json_encode($selectedSuppliers); ?>;
        phpSuppliers.forEach(value => addNewFilterTag(value, 'fournisseurs'));
    <?php endif; ?>

    <?php if (!empty($selectedBrands)): ?>
        const phpBrands = <?php echo json_encode($selectedBrands); ?>;
        phpBrands.forEach(value => addNewFilterTag(value, 'marques'));
    <?php endif; ?>
});

function toggleFilterSection() {
    let toggleBtn = document.querySelector('#toggle-filter-section');
    let filterSection = document.querySelector('#filter-section');
    let icon = document.querySelector('#toggle-filter-section img');

    toggleBtn.classList.toggle('open');

    if (toggleBtn.classList.contains('open')) {
        filterSection.style.display = 'flex';
        icon.src = 'static-resources/default/icons/white/x.png';
        toggleBtn.classList.add("fullWidth");
    } else {
        filterSection.style.display = 'none';
        icon.src = 'static-resources/default/icons/white/filter-2.png';
        toggleBtn.classList.remove("fullWidth");
    }
}

function searchProduct() {
    let searchBar = document.querySelector('#searchBar');
    let searchBarValue = searchBar ? searchBar.value.trim().toLowerCase() : "";
    
    let checkedCategories = [];
    document.querySelectorAll('input[type="checkbox"][data-type="categories"]:checked').forEach(cat => {
        checkedCategories.push(cat.dataset.name);
    });

    let checkedSuppliers = [];
    document.querySelectorAll('input[type="checkbox"][data-type="fournisseurs"]:checked').forEach(sup => {
        checkedSuppliers.push(sup.dataset.name);
    });

    let checkedBrands = [];
    document.querySelectorAll('input[type="checkbox"][data-type="marques"]:checked').forEach(brand => {
        checkedBrands.push(brand.dataset.name);
    });

    let url = './catalogues?query=' + encodeURIComponent(searchBarValue) + 
              '&categories=' + encodeURIComponent(checkedCategories.join(',')) +
              '&fournisseurs=' + encodeURIComponent(checkedSuppliers.join(',')) +
              '&marques=' + encodeURIComponent(checkedBrands.join(','));
              
    window.location.href = url;
}

function filterList(input, containerId) {
    const filter = input.value.toLowerCase().trim();
    const container = document.getElementById(containerId);
    const items = container.getElementsByClassName('checkboxFilterContainer');

    const mapping = <?php echo json_encode($mappingCategories); ?>;

    for (let i = 0; i < items.length; i++) {
        const label = items[i].querySelector('label');
        const mainCategoryText = (label.textContent || label.innerText).trim();
        
        let isMatch = mainCategoryText.toLowerCase().includes(filter);

        if (!isMatch && mapping[mainCategoryText]) {
            const subCategories = mapping[mainCategoryText];
            isMatch = subCategories.some(sub => sub.toLowerCase().includes(filter));
        }

        items[i].style.display = isMatch ? "" : "none";
    }
}

let searchBarEl = document.querySelector('#searchBar');
if (searchBarEl) {
    searchBarEl.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchProduct();
        }
    });
}
</script>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>