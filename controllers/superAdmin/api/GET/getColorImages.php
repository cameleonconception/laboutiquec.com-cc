<?php
require_once('classes/API/Products.php');
header('Content-Type: application/json');

$productsAPI = new Products();
echo json_encode($productsAPI->getAllColorImages());
