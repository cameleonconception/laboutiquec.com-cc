<?php
    require_once('classes/Layouts/Header.php');

    $HEADER = new Header();
    $HEADER->setLanguage('fr');
    $HEADER->setTitle('Nouveau mot de passe');
    $HEADER->setDescription('Description');
    $HEADER->addCssFile('/section/form/style.css');
    $HEADER->addCssFile('/section/main/login.css');
    $HEADER->addJsFile('/api/newPassword.js');
    $HEADER->validateHeader();

    $activePage = '';

    require_once($absoluteResources.'/layouts/header.php');
    require_once($absoluteResources.'/layouts/nav.php');
?>


<main>
    <section class="contentPage">
    <form id="newPasswordForm">
        <h1>Nouveau mot de passe</h1>
        <label for="email">Adresse courriel</label>
        <input id="email" name="email" type="email" maxlength="255" autocomplete="email" placeholder="info@exemple.com"required>
        
        <button id='sendTemporaryCode' type="button">Recevoir un code temporaire</button>
    </form>
    </section>

</main>

<?php
    require_once($absoluteResources.'/layouts/footer.php');
?>









