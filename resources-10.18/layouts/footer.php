<?php
// 1. Configuration de l'appel à l'API
$url_api = "https://cameleonconception.com/api/avis"; // L'URL de votre API
$cle_secrete = "eqfndwk3123qsw%?!sRVAS/%1/%FFFDCSASAD**/CaRt(#!"; // La clé (doit être identique à celle de api.php)

// 2. Préparation de la requête avec la clé dans le Header
$options = [
    "http" => [
        "method" => "GET",
        "header" => "X-API-KEY: " . $cle_secrete . "\r\n"
    ]
];
$contexte = stream_context_create($options);

// 3. Appel de l'API
$reponse_json = @file_get_contents($url_api, false, $contexte);

// 4. Traitement et affichage des avis
$reviews = [];

if ($reponse_json !== FALSE) {
    $donnees = json_decode($reponse_json, true);
    if (isset($donnees['success']) && $donnees['success'] == true) {
        $reviews = $donnees['reviews'];
    }
}
?>

<div class="reviews-wrapper">
        
        <button class="nav-arrow prev" onclick="scrollReview('left')">❮</button>

        <div id="reviewsContainer">
            <div class="scroll-content">
        <?php 
            
            foreach($reviews as $review): 
            // On prépare le lien et le style
            $hasLink = !empty($review['link']);
            $style = $hasLink ? 'cursor: pointer;' : '';
        ?>
    <div class="review-item" 
        <?php if($hasLink): ?> 
            onclick="window.location.href='<?php echo htmlspecialchars($review['link']); ?>'" 
        <?php endif; ?>
        style="<?php echo $style; ?>"
    >
        <p class="name"><?php echo htmlspecialchars($review['name']); ?></p>
        
        <?php if (!empty($review['company'])): ?>
            <p class="company"><?php echo htmlspecialchars($review['company']); ?></p>
        <?php endif; ?>
        
        <p class="stars"><?php echo str_repeat("★", $review['stars']); ?></p>
        <p class="review"><?php echo htmlspecialchars($review['review']); ?></p>
    </div>
<?php endforeach; ?>
    </div>
    
</div>

        <button class="nav-arrow next" onclick="scrollReview('right')">❯</button>
        
    </div>
</main>
<?php require_once('cookie_preferences.php'); ?>

<footer>

<div id="sitemap">
    <div>
        <div>
            <h3>Services</h3>
            <hr>
        </div>
        <a href="<?php echo $underLevelString; ?>services/cartes-intelligentes">Cartes d'affaires intelligentes</a>
        <a href="<?php echo $underLevelString; ?>services/vetements">Vêtements et + personnalisés</a>
        <a href="<?php echo $underLevelString; ?>services/site-web">Site web et boutique</a>
        <a href="<?php echo $underLevelString; ?>services/services-connexes">Logos, visuels, et +</a>
    </div>
    <div>
        <div>
            <h3>Boutique</h3>
            <hr>
        </div>
        <a href="https://laboutiquec.com/cc/produits">Vêtements et accessoires blank</a>
        <a href="https://laboutiquec.com/cc/produits?query=&categories=Hoodie">Hoodies</a>
        <a href="https://laboutiquec.com/cc/produits?query=&categories=Casquette">Casquettes</a>
        <a href="https://laboutiquec.com/cc/produits?query=&categories=T-shirt">T-shirts</a>
    </div>
    <div>
        <div>
            <h3>FAQ</h3>
            <hr>
        </div>
        <a href="<?php echo $underLevelString; ?>faq">Questions fréquentes</a>
        <a href="<?php echo $underLevelString; ?>faq#politiques">Nos politiques</a> 
        <a href="https://laboutiquec.com/cc/catalogues">Nos catalogues</a> 
    </div>
    <div>
        <div>
            <h3>Contact</h3>
            <hr>
        </div>
        <a href="mailto:info@cameleonconception.com">info@cameleonconception.com</a>
        <a href="tel:4383170376">(438) 317-0376</a>
        <a href="https://www.google.com/maps/place/124+Rue+Saint-Laurent,+Saint-Eustache,+QC+J7P+5G1/@45.5683952,-73.8880124,17z/data=!3m1!4b1!4m6!3m5!1s0x4cc925871b6644c1:0x486b303c577d932e!8m2!3d45.5683915!4d-73.8854375!16s%2Fg%2F11b8v66t5n?entry=ttu&g_ep=EgoyMDI2MDMwOC4wIKXMDSoASAFQAw%3D%3D">124C rue Saint-Laurent, Sainte-Eustache, QC J7P 5G1</a>
        <span>Lundi au vendredi de 9h à 16h</span>

    </div>
</div>
<span id="copyright"></span>
</footer>
</body>
<script>
    const copyright = document.getElementById('copyright');
    const currentYear = new Date().getFullYear();
    copyright.textContent = "© " + currentYear + " Caméléon conception. Tous droits réservés";

    function scrollReview(direction) {
        const container = document.getElementById('reviewsContainer');
        const scrollAmount = 320; // Largeur d'une carte (300px) + gap (20px)
        
        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }
</script>
</html>
