<?php 
    require_once('classes/API/Logout.php');

    $logout = new Logout;
    $response = $logout->logout();

    if($response['success']){
        header('Location: se-connecter');
        exit;
    }else{
        header('Location: 500?message=Nous n\'avons pas été capable d\'effectuer la déconnection.');
        exit;
    }

?>






