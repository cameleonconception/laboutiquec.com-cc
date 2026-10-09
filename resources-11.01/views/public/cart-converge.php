<?php
require_once('classes/Layouts/Header.php');

$HEADER = new Header();
$HEADER->setLanguage(language: 'fr');
$HEADER->setTitle('Panier');
$HEADER->setDescription('Description');
$HEADER->addJsFile("/api/GET/cart.js");
if ($logged) {
    $HEADER->addJsFile("/api/GET/user-info-for-payment.js");
}
$HEADER->addJsFile("/api/UPDATE/edit-cart.js");
$HEADER->addJsFile('/api/loginFromCart.js');

$HEADER->validateHeader();

$activePage = 'Panier';

require_once($absoluteResources . '/layouts/header.php');
require_once($absoluteResources . '/layouts/nav.php');
?>
<script src="https://api.demo.convergepay.com/hosted-payments/Checkout.js"></script>
<!-- <script src="https://api.convergepay.com/hosted-payments/Checkout.js"></script> --->

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<main>
    <section class="contentPage">
        <h1 class="title">Panier</h1>
        <div id="paymentStep">
            <div id="cart-container">
            </div>
            
            <?php
            if ($logged) {
                echo '
                        <form id="paymentForm" class="">
                            <h1 class="to-hide-in-next-step-1">Informations de contact</h1>
                            <label class="to-hide-in-next-step-1" for="fname">Prénom</label>
                            <input class="to-hide-in-next-step-1" id="fname" name="fname" type="text" maxlength="50" autocomplete="given-name" required placeholder="Jean">

                            <label class="to-hide-in-next-step-1" for="lname">Nom de famille</label>
                            <input class="to-hide-in-next-step-1" id="lname" name="lname" type="text" maxlength="100" autocomplete="family-name" required placeholder="Dupont">

                            <label class="to-hide-in-next-step-1" for="phone">Téléphone</label>
                            <input class="to-hide-in-next-step-1" id="phone" name="phone" type="tel" maxlength="14" placeholder="(514) 555-0131" autocomplete="tel" required>

                            <label class="to-hide-in-next-step-1" for="email">Adresse courriel</label>
                            <input class="to-hide-in-next-step-1" id="email" name="email" type="email" maxlength="255" autocomplete="email" required readonly placeholder="jean.dupont@email.com">
                            <button id="button-step-1" class="to-hide-in-next-step-1" type="button" onclick="validateStep(1)">Continuer</button>

                            <h1 class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;">Informations de livraison</h1>
                           
                            <label class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" for="address">Adresse</label>
                            <input class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" id="address" name="address" type="text" maxlength="255" autocomplete="street-address" required placeholder="Adresse postale et rue">
                            <label class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" for="city">Ville</label>
                            <input class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" id="city" name="city" type="text" maxlength="100" autocomplete="city" required placeholder="Montréal">
                            <label class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" for="province">Province</label>
                            <input class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" id="province" name="province" type="text" maxlength="50" required placeholder="Québec">
                            <label class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" for="country">Pays</label>
                            <input class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" id="country" name="country" type="text" maxlength="100" autocomplete="country-name" required placeholder="Canada">
                            <label class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" for="postalCode">Code postal</label>
                            <input class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" id="postalCode" name="postalCode" type="text" maxlength="10" autocomplete="postal-code" required placeholder="H2X 1Y4">
                                                 
                            <button id="button-step-2" class="to-show-in-next-step-2 to-hide-in-next-step-2" style="display:none;" type="button" onclick="validateStep(2)">Continuer</button>
                            <button class="to-show-in-next-step-2 to-hide-in-next-step-2 secondary" onclick="prevStep(1)" style="display:none;">Revenir en arrière</button>

                            <h1 class="to-show-in-next-step-3 to-hide-in-next-step-3"style="display:none;">Informations de carte de crédit</h1>
                            <label class="to-show-in-next-step-3 to-hide-in-next-step-3" for="card" style="display:none;">Numéro de carte de crédit</label>
                            <input class="to-show-in-next-step-3 to-hide-in-next-step-3" id="card" type="text" name="card" value="4124939999999990" placeholder="12340000000000000000" style="display:none;"/>
                            <label class="to-show-in-next-step-3 to-hide-in-next-step-3" for="exp" style="display:none;">Date d\'expiration (MMYY)</label>
                            <input class="to-show-in-next-step-3 to-hide-in-next-step-3" id="exp" type="text" name="exp"  style="display:none;" value="1230" placeholder="0829">
                            <label class="to-show-in-next-step-3 to-hide-in-next-step-3" for="exp" style="display:none;">CVC</label>
                            <input class="to-show-in-next-step-3 to-hide-in-next-step-3" id="cvv" type="text" name="cvv" value="123"  style="display:none;" placeholder="123">
                            <input id="gettoken" type="hidden" name="gettoken" value="y">
                            <input id="addtoken" type="hidden" name="addtoken" value="y">
                            <input id="token" type="hidden" name="token" size="60">

                            <label class="to-show-in-next-step-3 to-hide-in-next-step-3" style="display:none;" for="notes">Note(s)</label>
                            <textarea class="to-show-in-next-step-3 to-hide-in-next-step-3" style="display:none;" id="notes" name="notes" rows="4" placeholder="Ex. : Proposition de nouveaux produits, note de livraison, etc."></textarea>
                            <button class="to-show-in-next-step-3 to-hide-in-next-step-3" id="paymentBtn" type="button" style="display:none;" onclick="validateStep(3)">Payer</button>                            
                            <button class="to-show-in-next-step-3 to-hide-in-next-step-3 secondary" onclick="prevStep(2)" style="display:none;">Revenir en arrière</button>
                            <p class="light">Livraison gratuite à partir de 300$ avant taxes</p>
                            <p class="light" style="display:none;">En cas de rupture de stock, nous vous contacterons par téléphone ou par courriel et votre commande sera temporairement mise en attente.</p>
                            <p class="light">Pour vérifier l\'inventaire ou pour toutes questions : 438-317-0376</p>
                            </form>
                    ';
            } else {
                echo '
                        <form id="loginForm" class="">
                            <h1>Se connecter</h1>
                            <label for="email">Adresse courriel</label>
                            <input id="email" name="email" type="email" maxlength="255" autocomplete="email" required placeholder="jean.dupont@email.com">

                            <label for="password">Mot de passe</label>
                            <input id="password" name="password" type="password" maxlength="255"  autocomplete="off" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">

                            <button id="submitBtn" type="button">Se connecter</button>
                            <button class="secondary" onclick=\'window.location.href="'.$underLevelString.'creer-un-compte"\' type="button">Créer un compte</button>
                            <a href="'.$underLevelString.'nouveau-mot-de-passe">Mot de passe oublié</a>
                        </form>
                    ';
            }
            ?>
        </div>
    </section>
</main>
<?php
require_once($absoluteResources . '/layouts/footer.php');
?>





