<?php

require_once('classes/API/Products.php');

header('Content-Type: application/json');

$cartItems = json_decode(file_get_contents('php://input'), true);
$cartItems = $cartItems['products'];

$product = new Products();
$product->validateCart($cartItems);


?>






