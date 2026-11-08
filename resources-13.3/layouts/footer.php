<?php
// 1. Configuration de l'appel à l'API
$url_api = "https://cameleonconception.com/api/avis";
$cle_secrete = $_ENV['REVIEWS_API_KEY'] ?? getenv('REVIEWS_API_KEY');

// 2. Appel de l'API et traitement de la réponse
$reviews = [];

if (!is_string($cle_secrete) || trim($cle_secrete) === '') {
    error_log("REVIEWS_API_KEY is not configured.");
} else {
    $options = [
        "http" => [
            "method" => "POST",
            "header" => "Accept: application/json\r\nX-API-KEY: " . $cle_secrete . "\r\n",
            "content" => "",
            "timeout" => 5,
            "ignore_errors" => true
        ]
    ];
    $contexte = stream_context_create($options);
    $reponse_json = file_get_contents($url_api, false, $contexte);
    $statusCode = null;
    foreach ($http_response_header ?? [] as $statusLigne) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $statusLigne, $statusMatch)) {
            $statusCode = (int) $statusMatch[1];
        }
    }

    if ($reponse_json === false) {
        error_log("Reviews API request failed; HTTP status: " . ($statusCode ?? 'unknown') . ".");
    } elseif ($statusCode === null || $statusCode < 200 || $statusCode >= 300) {
        error_log("Reviews API returned HTTP status " . ($statusCode ?? 'unknown') . ".");
    } else {
        $donnees = json_decode($reponse_json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Reviews API returned invalid JSON; HTTP status: " . ($statusCode ?? 'unknown') . ".");
        } elseif (is_array($donnees) && !empty($donnees['success']) && isset($donnees['reviews']) && is_array($donnees['reviews'])) {
            $reviews = $donnees['reviews'];
        } else {
            error_log("Reviews API response did not contain successful reviews.");
        }
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
        <a href="www.cameleonconception.com/services/cartes-intelligentes">Cartes d'affaires intelligentes</a>
        <a href="www.cameleonconception.com/services/vetements">Vêtements et + personnalisés</a>
        <a href="www.cameleonconception.com/services/site-web">Site web et boutique</a>
        <a href="www.cameleonconception.com/services/services-connexes">Logos, visuels, et +</a>
    </div>
    <div>
        <div>
            <h3>Boutique</h3>
            <hr>
        </div>
        <a href="https://laboutiquec.com/cc/produits">Vêtements et accessoires blank</a>
        <a href="https://laboutiquec.com/cc/produits?query=hoodie">Hoodies</a>
        <a href="https://laboutiquec.com/cc/produits?query=hat">Casquettes</a>
        <a href="https://laboutiquec.com/cc/produits?categories=Article+de+bureau%2CArticle+promotionnel%2CDesks%2CPens">Articles promotionnels</a>
    </div>
    <div>
        <div>
            <h3>FAQ</h3>
            <hr>
        </div>
        <a href="www.cameleonconception.com/faq">Questions fréquentes</a>
        <a href="www.cameleonconception.com/faq#politiques">Nos politiques</a> 
        
    </div>
    <div>
        <div>
            <h3>Contact</h3>
            <hr>
        </div>
        
        <a href="https://share.google/cVFAiGCJ4iJXip7Mz">Lundi au vendredi de 9h à 16h</a>
        <a href="mailto:info@cameleonconception.com">info@cameleonconception.com</a>
        <a href="tel:4383170376">(438) 317-0376</a>
        <span style="color:var(--accent-color);">Aucun rendez-vous sur place</span>


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
