<?php

    require_once('classes/API/Order.php');

    $preOrderID = isset($_GET['preorder_id']) ? intval($_GET['preorder_id']) : null;

    $orders = new Order();
    $orders->getDashOrders($preOrderID);


?>






