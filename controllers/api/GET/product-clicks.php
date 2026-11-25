<?php

require_once('classes/API/Products.php');

$products = new Products();
$products->getProductClickCounts();
