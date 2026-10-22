<?php

    require_once('classes/API/Products.php');


    $eid = null;
    
    if (isset($_GET['eid'])) {
        $eidRaw = trim($_GET['eid']);
        $eid = ($eidRaw !== '' && filter_var($eidRaw, FILTER_VALIDATE_INT) !== false) ? (int)$eidRaw : null;
    }

    $sku = isset($_GET['sku']) ? trim($_GET['sku']) : null;

    $product = new Products;
    //$product->getSageProductDetails($eid, $sku);
    require_once('controllers/json/eid.json');
?>






