<?php

require_once('classes/API/Products.php');

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$query = isset($_GET['query']) ? trim($_GET['query']) : '';

$categories = (isset($_GET['categories']) && $_GET['categories'] !== '') 
    ? explode(',', $_GET['categories']) 
    : [];

$colors = (isset($_GET['colors']) && $_GET['colors'] !== '') 
    ? explode(',', $_GET['colors']) 
    : [];

$product = new Products;
$product->getProducts($page, $query, $categories, $colors);