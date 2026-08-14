<?php

    require_once('classes/API/Products.php');


    $pid = null;
    
    if (isset($_GET['pid'])) {
        $pidRaw = trim($_GET['pid']);
        $pid = ($pidRaw !== '' && filter_var($pidRaw, FILTER_VALIDATE_INT) !== false) ? (int)$pidRaw : null;
    }

    $sku = isset($_GET['sku']) ? trim($_GET['sku']) : null;

    $product = new Products;
    $product->getProductDetails($pid, $sku);

?>






