<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Créer un compte');
    $HEADER->setDescription('Description');
    $HEADER->addCssFile('/section/form/style.css');
    $HEADER->addCssFile('/section/main/login.css');
    $HEADER->addJsFile('/api/signup.js');
    $HEADER->validateHeader();

    $activePage = 'Login';

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');

        if($logged){
        header('Location: ./profil');
        exit;
    }
    
?>


<main>
    <section class="contentPage">

    <form id="signupForm">
        <h1>Créer un compte</h1>
        <label for="company">Entreprise (facultatif)</label>
        <input id="company" name="company" type="text" maxlength="50" autocomplete="organization" placeholder="Caméléon conception">

        <label for="fname">Prénom</label>
        <input id="fname" name="fname" type="text" maxlength="50" autocomplete="given-name" required placeholder="Jean">

        <label for="lname">Nom de famille</label>
        <input id="lname" name="lname" type="text" maxlength="100" autocomplete="family-name" required placeholder="Dupont">

        <label for="phone">Téléphone</label>
        <input id="phone" name="phone" type="tel" maxlength="14" placeholder="(514) 555-0131" autocomplete="tel" required>

        <label for="email">Adresse courriel</label>
        <input id="email" name="email" type="email" maxlength="255" autocomplete="email" required placeholder="jean.dupont@email.com">

        <label for="confirmedEmail">Confirmer votre courriel</label>
        <input id="confirmedEmail" name="confirmedEmail" type="email" maxlength="255" autocomplete="off" required placeholder="Confirmez votre courriel">


        <label for="password">Mot de passe</label>
        <input id="password" name="password" type="password" maxlength="255"  autocomplete="off" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">

        <label for="confirmedPassword">Confirmer votre mot de passe</label>
        <input id="confirmedPassword" name="confirmedPassword" type="password" maxlength="255"  autocomplete="off" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" required placeholder="Confirmez le mot de passe">
            
        
        <button id='submitBtn' type="button">Créer</button>
        <a href='<?php echo $underLevelString; ?>se-connecter'>Se connecter</a>

    </form>
    </section>
</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






