<?php
   
   define('API_KEY', 'eqfndwk3123qsw%?!sRVAS/%1/%FFFDCSASAD**/CaRt(#!'); 

    if (!defined('AVIS_DATA_ONLY')) {
        // Récupération des en-têtes de la requête
        $headers = getallheaders();

        // Vérification si la clé est absente ou incorrecte
        if (!isset($headers['X-API-KEY']) || $headers['X-API-KEY'] !== API_KEY) {
            http_response_code(403); // Code d'erreur : Accès interdit
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'erreur' => 'Accès refusé. Clé API invalide.'
            ]);
            exit; // On arrête immédiatement l'exécution
        }
    }
   
    // ['name' => '', 'company' => '', 'link' => '', 'stars' => 5, 'review' => ''],

    $reviews = [

    // Avis très détaillés et élogieux (Top Priorité)
    ['name' => 'François A.', 'company' => 'Club Volleyball Volcanik', 'link' => 'https://maps.app.goo.gl/3Hq95QkJev1gu762A', 'stars' => 5, 'review' => 'Super gentil, communications rapides, service rapide. Absolument rien à redire. Good job!'],
    ['name' => 'Médérik R.', 'company' => 'Medcanique', 'link' => 'https://maps.app.goo.gl/8Rq7eGwD7GTBwVhWA', 'stars' => 5, 'review' => 'Excellent service très bonne qualité et très rapide'],
    ['name' => 'Éric B.', 'company' => 'École Secondaire Curé-Mercure', 'link' => 'https://maps.app.goo.gl/zwer7Z7Kxz6KPNXU8', 'stars' => 5, 'review' => 'Très content des résultats. Produits de très bonne qualité. Rapide, conciliant et courtois. Bravo !'],
    ['name' => 'Dhanna', 'company' => '', 'link' => 'https://maps.app.goo.gl/yotWKEfkbPNd77EPA', 'stars' => 5, 'review' => 'Bonjour, j’ai adoré mon expérience avec vous vraiment un grand professionnalisme et beaucoup de compréhension. Merci encore spécialement à Étienne. Bonne journée à tous.'],
    ['name' => 'Marilou L.', 'company' => 'Lecompte Excavation', 'link' => 'https://maps.app.goo.gl/hZwNjAMvVFr6fRfTA', 'stars' => 5, 'review' => 'Super expérience et services'],
    ['name' => 'Victoria P.', 'company' => 'Petch Agricultural', 'link' => 'https://maps.app.goo.gl/NE6VeK6qtkafH5AXA', 'stars' => 5, 'review' => 'Excellent service from the introduction email, the quotes, the samples, the final product and the delivery! Cannot recommend Caméléon conception enough! Thank you!'],
    ['name' => 'Elodie F.', 'company' => 'Boots to bloom', 'link' => 'https://maps.app.goo.gl/tGCNU2ousAHHUfxR9', 'stars' => 5, 'review' => 'Service impeccable et de grande qualité! J’ai fait une demande à la dernière minute et, malgré le court délai, ils ont accepté de m’accommoder. Je recommande sans hésitation!'],
    ['name' => 'Ginette M.', 'company' => 'CPE L\'antre-Temps', 'link' => 'https://maps.app.goo.gl/gvUiRdQN6KB5hwec8', 'stars' => 5, 'review' => 'Très bon service et très beau produit. Merci pour votre professionnalisme. Nous vous recommandons sans aucune hésitation.'],
    ['name' => 'CPE L\'antre-Temps', 'company' => '', 'link' => 'https://maps.app.goo.gl/cNX7pUm4QebDpLcX6', 'stars' => 5, 'review' => 'Qualité du service impeccable! Nous avons commandé des vestes et des hoodies: Notre logo est de haute qualité et brodé à la perfection, les couleurs sont très représentatives de ce que nous avons vu dans les catalogues, la qualité des matériaux est supérieure: les vêtements choisis sont doux et confortables. Merci et au plaisir de refaire affaire avec CAMÉLÉON CONCEPTION!'],
    ['name' => 'Stéphanie D.', 'company' => 'CPE L\'antre-Temps', 'link' => 'https://maps.app.goo.gl/NkfMWtDQHA9ZmBsa9', 'stars' => 5, 'review' => 'Wow les chandails et vestes sont de belle qualité, le logo est très beau et souple donc agréable à porter. Toutes les couleurs sont belles.'],
    ['name' => 'Kariann K.', 'company' => 'Chandelles Authenti-K', 'link' => 'https://maps.app.goo.gl/i6Lu7zpC4hJzWnEJ8', 'stars' => 5, 'review' => 'Le meilleur pour tous mes projets de creations, rapide, professionel et minutieux !!!'],
    ['name' => 'Éric B.', 'company' => 'Vélotour Curé-Mercure', 'link' => 'https://maps.app.goo.gl/a3HEQwZicCY3K9sAA', 'stars' => 5, 'review' => 'Très content des résultats. Produits de très bonne qualité. Rapide, conciliant et courtois. Bravo !'],
    ['name' => 'Sam-Dony I.', 'company' => 'Génie Civil Cégep Ahuntsic', 'link' => 'https://maps.app.goo.gl/bG6hNKFVsR6wBWor7', 'stars' => 5, 'review' => 'Camélion Conception est un excellent fournisseur de vêtements personnalisés. Nous avons passé une commande de plus de 100 articles, et tous ont répondu à nos attentes — et même au-delà ! La qualité est au rendez-vous et le service est impeccable. Le gestionnaire est professionnel, efficace et très agréable à travailler.'],
    ['name' => 'Cindy C.', 'company' => 'École des Entrepreneurs du Québec', 'link' => 'https://maps.app.goo.gl/x2ueyPBzbRUeEouw6', 'stars' => 5, 'review' => 'Excellant service ! Rapide et agréable :) Merci'],
    ['name' => 'Annie M.', 'company' => 'Cégep de Terrebonne', 'link' => 'https://maps.app.goo.gl/aiLCvpyhWPVp3wvX6', 'stars' => 5, 'review' => 'Travailler avec l\'équipe de Caméléon est toujours un réel bonheur! Ils sont à l\'écoute de nos besoins, répondent en un temps record, et chaque commande présente un niveau de qualité incomparable, peu importe les produits que nous ajoutons! Merci à toute l\'équipe!'],
    ['name' => 'Catherine D.', 'company' => 'Maison de la Famille du Nord', 'link' => 'https://maps.app.goo.gl/2tdBf1YaBZstECm98', 'stars' => 5, 'review' => 'Excellent service, rapide, précis et courtois ! Nous sommes de plus très satisfaits d\'Avoir pu faire l\'achat de chandails fait avec du coton biologique et équitable, en lien avec les valeurs de notre organisme. <3'],
    ['name' => 'Megane L.', 'company' => 'Comité Étudiant - Collège Ahuntsic', 'link' => 'https://maps.app.goo.gl/MsRV2bSqBkN5Mjs86', 'stars' => 5, 'review' => 'Un service rapide, humain et de qualité qui s\'adapte aux besoins de ses clients ! Étienne nous a créé un site web pour notre comité étudiant afin que les étudiants puissent passer leur commande de merch !'],
    ['name' => 'Vincent P.', 'company' => '', 'link' => 'https://maps.app.goo.gl/gEhzcYvugWHr2X4i8', 'stars' => 5, 'review' => 'Service toujours impeccable !!! Le propriétaire, Étienne est toujours serviable, accommodant et j\'en passe! Bref, là place où faire affaire'],
    ['name' => 'Fleuriste St-Jovite', 'company' => '', 'link' => 'https://maps.app.goo.gl/pyWhdxb4XGshDXx58', 'stars' => 5, 'review' => 'Excellent service et excellente qualité de t-shirt! Etienne a personnalisé exactement ce que notre équipe voulait pour notre équipe de Baseball.'],
    ['name' => 'Annik P.', 'company' => 'École Secondaire Curé-Mercure (Concentration musique)', 'link' => 'https://maps.app.goo.gl/dzFxExwi4nXzYtbr8', 'stars' => 5, 'review' => 'Excellents produits et service rapide. Nous sommes très satisfaits et referons affaire avec Caméléon conception dans l\'avenir assurément.'],
    ['name' => 'Reception', 'company' => 'JSM Micro', 'link' => 'https://maps.app.goo.gl/wjifh585ZguvanVU7', 'stars' => 5, 'review' => 'Nous vous remercions pour vos excellents polos avec le logo envoyés. Nous garderons votre entreprise comme la meilleure option au cas où nous aurions besoin de vos excellents produits.'],
    ['name' => 'Lesly D.', 'company' => '', 'link' => 'https://maps.app.goo.gl/4xuayroH95MGR3iW7', 'stars' => 5, 'review' => 'Super compagnie avec un propriétaire qui répond très rapidement au message et question'],
    ['name' => 'Xavier V.', 'company' => 'CAPSolar', 'link' => 'https://maps.app.goo.gl/ELFDYDjUi6qHbQ1N6', 'stars' => 5, 'review' => 'Produit de bonne qualité et service très efficace, et irréprochable. Je recommande grandement !'],
    ['name' => 'Karine R.', 'company' => 'École des Entrepreneurs du Québec', 'link' => 'https://maps.app.goo.gl/ddLpTrm3H3p6F3vt8', 'stars' => 5, 'review' => 'Service et produit impeccables, grand merci!'],
    ['name' => 'Joanne G.', 'company' => '', 'link' => 'https://maps.app.goo.gl/Gx4NynHZ1pmG6ZVW6', 'stars' => 5, 'review' => 'Bravo aux jeunes entrepreneurs, service rapide, travail de qualité,'],
    
    // Avis courts et positifs (5 étoiles)
    ['name' => 'Rafael R.', 'company' => '', 'link' => 'https://maps.app.goo.gl/wFy2GhuN7mnHqV8u6', 'stars' => 5, 'review' => 'Super professionel , rapide , fiable a 100%. J’ai pu besoin chercher ailleur. Pour tous me project sa sera Cameleon'],
    ['name' => 'Cesar-Maira Solis-Ventura', 'company' => 'Sushi Taxi (Sainte-Thérèse)', 'link' => 'https://maps.app.goo.gl/7ya86nirPtp4jthk7', 'stars' => 5, 'review' => 'J’ai demandé d’imprimer mes carte d’affaire et nous sommes très satisfait du service, de l’efficacité et la qualité du produit!'],
    ['name' => 'Yanick B.', 'company' => 'Cégep de Terrebonne', 'link' => 'https://maps.app.goo.gl/AwURLV7Qtk5PTKoh9', 'stars' => 5, 'review' => 'Super produit super service!'],
    ['name' => 'Élise T.', 'company' => 'Ville Amherst', 'link' => 'https://maps.app.goo.gl/XDDwDyEzoY1XcYvEA', 'stars' => 5, 'review' => 'Réponse rapide et chandails de qualité !'],
    ['name' => 'Annik P.', 'company' => '', 'link' => 'https://maps.app.goo.gl/9mYr4mwDKB21zN8W8', 'stars' => 5, 'review' => 'Excellent produit et service rapide et impeccable.'],
    ['name' => 'Fred D.', 'company' => '', 'link' => 'https://maps.app.goo.gl/cVS7RwRVeXMywfde9', 'stars' => 5, 'review' => 'Très bon service et à de très bon prix et juste je vous les Recommande fortement'],
    ['name' => 'lea V.', 'company' => '', 'link' => 'https://maps.app.goo.gl/aLRydvXPS85pUA838', 'stars' => 5, 'review' => 'Service et qualité impeccable !'],
    ['name' => 'Sassy S.', 'company' => '', 'link' => 'https://maps.app.goo.gl/RZd5Z6TAULcTnP7L9', 'stars' => 5, 'review' => 'Très bon service rapide et courtois.'],
    ['name' => 'Simon L.', 'company' => 'Construction SN', 'link' => 'https://maps.app.goo.gl/H99PbzYwxEtQ7ZCu9', 'stars' => 5, 'review' => 'Bon service, rapide'],
    ['name' => 'William H.', 'company' => '', 'link' => 'https://maps.app.goo.gl/5EhAWtVqGEVuNL2r9', 'stars' => 5, 'review' => 'Professionnel, qualité, à l\'écoute'],
    ['name' => 'Louis-Yuki S.', 'company' => '', 'link' => 'https://maps.app.goo.gl/FKmzhpubA77wSrweA', 'stars' => 5, 'review' => 'Excellent service!'],
    ['name' => 'Scott C.', 'company' => 'Dune-Buggy', 'link' => 'https://maps.app.goo.gl/zXcnNqnzZtviezW1A', 'stars' => 5, 'review' => 'A1'],
    ['name' => 'Antoine D.', 'company' => '', 'link' => 'https://maps.app.goo.gl/Zkfc7stNA5UVmvtr9', 'stars' => 5, 'review' => 'Super professionnel et efficace, je recommande à 200%'],
    ['name' => 'Loriève P.', 'company' => '', 'link' => 'https://maps.app.goo.gl/9hB5nmXaXXfAGXYs7', 'stars' => 5, 'review' => 'Local et de qualité'],

    // Avis sans texte
    ['name' => '', 'company' => 'Gîte Nature et confiture', 'link' => 'https://maps.app.goo.gl/XpGosbqjJZNykvkP7', 'stars' => 5, 'review' => ''],
    ['name' => 'Félix R.', 'company' => 'La Micro du Fourquet', 'link' => 'https://maps.app.goo.gl/41cGwwMDxTquHBhV9', 'stars' => 5, 'review' => ''],
    ['name' => 'Félix S.', 'company' => 'Construction Scie-Roi inc', 'link' => 'https://maps.app.goo.gl/jj3Ld9H7vKVM1JfN6', 'stars' => 5, 'review' => ''],
    ['name' => 'Guylaine N.', 'company' => 'Collège Ahuntsic Montréal', 'link' => 'https://maps.app.goo.gl/7CiKwtUu1uoBTJbw9', 'stars' => 5, 'review' => ''],
    ['name' => 'Juliane C.', 'company' => '', 'link' => 'https://maps.app.goo.gl/5Vd76go6Jck69tiv5', 'stars' => 5, 'review' => ''],
    ['name' => 'P-A M.', 'company' => '', 'link' => 'https://maps.app.goo.gl/rV7kq8yoqCusPLF76', 'stars' => 5, 'review' => ''],
    ['name' => 'Mathis S.', 'company' => '', 'link' => 'https://maps.app.goo.gl/MuBRwRiqWVt44nMW8', 'stars' => 5, 'review' => ''],
    ['name' => 'Simon C.', 'company' => '', 'link' => 'https://maps.app.goo.gl/96g1q7WY7EL3tDHF6', 'stars' => 5, 'review' => ''],
    ['name' => 'Jeremie C.', 'company' => '', 'link' => 'https://maps.app.goo.gl/p6Gdc1WDDFFEPzM2A', 'stars' => 5, 'review' => ''],
    ['name' => 'Typhon', 'company' => '', 'link' => 'https://maps.app.goo.gl/W5JPqJDrfpdTQwj77', 'stars' => 5, 'review' => ''],

        
    // Avis 4 étoiles
    ['name' => 'L H', 'company' => '', 'link' => 'https://maps.app.goo.gl/7t6oGDrCpmgc3DNY8', 'stars' => 4, 'review' => 'Merci! Très heureuse de ma commande. Tout est arrivé en bon état et la qualité des matériaux est très bonne.']
    
    ];

    if (defined('AVIS_DATA_ONLY')) {
        return $reviews;
    }

    header('Content-Type: application/json');

    echo json_encode([
            'success' => true, 
            'reviews' => $reviews
    ]);
?>