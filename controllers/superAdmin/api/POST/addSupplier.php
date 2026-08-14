<?php

require_once('classes/API/Suppliers.php');

header('Content-Type: application/json');

$suppliersAPI = new Suppliers();
$suppliersAPI->addSupplier();


