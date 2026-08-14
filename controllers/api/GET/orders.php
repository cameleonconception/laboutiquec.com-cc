<?php

    require_once('classes/API/Order.php');

    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    $orders = new Order();
    $orders->getOrders($id);


?>






