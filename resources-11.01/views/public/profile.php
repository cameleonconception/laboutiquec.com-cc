<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Mon compte');
    $HEADER->setDescription('Description');
    $HEADER->addJsFile('api/GET/user-infos.js');
    $HEADER->addJsFile('api/UPDATE/user-infos.js');
    $HEADER->addJsFile('api/GET/orders.js');
    $HEADER->validateHeader();


    $activePage = "Profile";

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');


?>
<main>
    <section class="contentPage">
        <h1 class="title">Mon compte</h1>
        <div id="viewSelectorContainer">
            <div onclick="selectView(event,'ordersContainer')" class="active">
                Mes soumissions
            </div>
            <div onclick="selectView(event,'userInfosForm')">
                Réglages
            </div>

        </div>
        <div id="profileContent">
            <form id="userInfosForm" class="notSelectedView dash-container">
                        <label for="company">Entreprise (facultatif)</label>
                        <input id="company" name="company" type="text" maxlength="50" autocomplete="organization" placeholder="Caméléon conception">

                            <label class="" for="fname">Prénom</label>
                            <input class="" id="fname" name="fname" type="text" maxlength="50" autocomplete="given-name" required placeholder="Jean">

                            <label class="" for="lname">Nom de famille</label>
                            <input class="" id="lname" name="lname" type="text" maxlength="100" autocomplete="family-name" required placeholder="Dupont">

                            <label class="" for="phone">Téléphone</label>
                            <input class="" id="phone" name="phone" type="tel" maxlength="14" placeholder="(514) 555-0131" autocomplete="tel" required>

                            <label class="" for="email">Adresse courriel</label>
                            <input class="" id="email" name="email" type="email" maxlength="255" autocomplete="email" required readonly placeholder="jean.dupont@email.com">

                            <label class=" " style="" for="adress">Adresse de livraison</label>
                            <input class=" " style="" id="address" name="address" type="text" maxlength="255" autocomplete="street-address" required placeholder="123 rue Exemple">
                            <input class=" " style="" id="city" name="city" type="text" maxlength="100" autocomplete="city" required placeholder="Montréal">
                            <input class=" " style="" id="province" name="province" type="text" maxlength="50" required placeholder="Québec">
                            <input class=" " style="" id="country" name="country" type="text" maxlength="100" autocomplete="country-name" required placeholder="Canada">
                            <input class=" " style="" id="postalCode" name="postalCode" type="text" maxlength="10" autocomplete="postal-code" required placeholder="H2X 1Y4">

                            <button class=" " id="updateProfileBtn" type="button" style="" onclick="updateUserInfos()">Mettre à jour</button>
                            <button class="secondary" id="updateProfileBtn" type="button" style="" onclick="window.location.href='<?php echo $underLevelString?>nouveau-mot-de-passe'">Changer mon mot de passe</button>
                            <a href="<?php echo $underLevelString?>se-deconnecter">Me déconnecter</a>
            </form>
            <div id="ordersContainer" class="selectedView dash-container">
                <h1>Mes commandes</h1>
                <p>Chargement...</p>
            </div>
        </div>
    </section>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






