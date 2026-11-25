<?php

require_once('classes/API/Products.php');

$products = new Products();
$products->recordProductClick($_POST['type'] ?? null, $_POST['id'] ?? null);
