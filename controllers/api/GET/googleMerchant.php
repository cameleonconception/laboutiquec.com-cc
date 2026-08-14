<?php

    require_once('classes/API/Products.php');
    
    $products = new Products;
    $products->generateGoogleMerchantXML();

    echo "Le fichier a été mis à jour !"
?>






