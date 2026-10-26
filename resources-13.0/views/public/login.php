<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Se connecter');
    $HEADER->setDescription(description: 'Description');
    $HEADER->addCssFile('/section/form/style.css');
    $HEADER->addCssFile('/section/main/login.css');
    $HEADER->addJsFile('/api/login.js');
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
    <form id="loginForm">
        <h1>Se connecter</h1>
        <label for="email">Adresse courriel</label>
        <input id="email" name="email" type="email" maxlength="255" autocomplete="email" required placeholder="jean.dupont@email.com">

        <label for="password">Mot de passe</label>
        <input id="password" name="password" type="password" maxlength="255"  autocomplete="off" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">

        <button id='submitBtn' type="button">Se connecter</button>
        <button class='secondary' onclick="window.location.href='<?php echo $underLevelString; ?>creer-un-compte'" type="button">Créer un compte</button>
        <a href='<?php echo $underLevelString; ?>nouveau-mot-de-passe'>Mot de passe oublié</a>
    </form>
    </section>

</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>






