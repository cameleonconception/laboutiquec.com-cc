<nav>
    <h1 id="textLogo" onclick="window.location.href='<?php echo $underLevelString; ?>accueil'"><img class='logo' src="<?php echo $staticResources; ?>/default/logos/Logo_complet_blanc_orange.png"><p class="feat"></h1>

    <div class="flexNavLinks">


    <div id="navLinksContainer">
        <a class='<?php if($activePage === 'Accueil'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>accueil" style='display:none;'>Accueil</a>
        <a class='<?php if($activePage === 'Produits'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>produits">Produits </a>
        <a class='<?php if($activePage === 'Artiste'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>artistes" style="display:none;">Artistes</a>
        <a class='<?php if($activePage === 'Articles promotionnels'){ echo 'active';}; ?>' style="display:none;"href="<?php echo $underLevelString; ?>produits?categories=Article promotionnel">Articles promotionnels</a>
        <a class='<?php if($activePage === 'Catalogues'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>catalogues">Catalogues</a>
        <a class='<?php if($activePage === 'Outils'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>outils">Outils</a>
        <a href="https://www.cameleonconception.com/faq">FAQ</a>
        <a href="https://www.cameleonconception.com/contact">Nous joindre</a>
        <?php
            if($logged){

                if($activePage === 'Profile'){
                    $activePageProfile = 'active';
                };

                echo "
                    <a class='{$activePageProfile}' href='{$underLevelString}profil'>Mon compte</a>";

                if($admin){

                    if($activePage === 'Gestionnaire'){
                        $activePageGestionnaire = 'active';
                    };

                    echo "
                        <a class='{$activePageGestionnaire}' href='{$underLevelString}gestionnaire'>Gestionnaire</a>";
                }
                
            }else{

                if($activePage === 'Login'){
                    $activePage = 'active';
                };

                 echo "<a class='{$activePage}' href='{$underLevelString}se-connecter'>Se connecter</a>";
            }

        ?>
    </div>
    <div class="flexNavLinks reverse">
    <div id="menuBurger" class="">
            <div class="bar1"></div>
            <div class="bar2"></div>
            <div class="bar3"></div>
        </div>
        <a id="cartAElement" class='<?php if($activePage === 'Panier'){ echo 'active';}; ?>' href="<?php echo $underLevelString; ?>panier"><img src="<?php echo $staticResources;?>/default/icons/white/cart.png"><span id="cart-count"></span></a>
    </div>
    </div>
</nav>
<div class="banner-message" >Livraison gratuite &#224; partir de 75$</div>
