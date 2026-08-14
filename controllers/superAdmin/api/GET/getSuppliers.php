<?php
require_once('classes/API/Suppliers.php');
header('Content-Type: application/json');

$suppliersAPI = new Suppliers();
echo json_encode($suppliersAPI->getSuppliers());
