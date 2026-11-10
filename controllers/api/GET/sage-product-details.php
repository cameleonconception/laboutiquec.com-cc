<?php

    require_once('classes/API/Products.php');


    $spc = isset($_GET['spc']) ? trim($_GET['spc']) : null;

    $product = new Products;
    $product->getSageProductDetailsBySpc($spc);
    //require_once('controllers/json/eid.json');
?>





