<?php

    require_once('classes/API/Order.php');
    require_once('vendor/autoload.php');

    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $newStatus = isset($_GET['newStatus']) ? intval($_GET['newStatus']) : null;
    
    $shippingMessage = isset($_GET['shippingMessage']) ? $_GET['shippingMessage'] : null;
    $shippingLink = isset($_GET['shippingLink']) ? $_GET['shippingLink'] : null;

    $order = new Order();
    $order->updateOrderStatus($id, $newStatus, $shippingLink, $shippingMessage); 

?>






