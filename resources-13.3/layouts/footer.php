<?php
define('AVIS_DATA_ONLY', true);
$reviews = require __DIR__ . '/../../controllers/api/avisGoogle.php';
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
        <span style="color:var(--orange);">Aucun rendez-vous sur place</span>


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
