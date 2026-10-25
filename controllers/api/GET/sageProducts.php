<?php
//var_dump($_SERVER['QUERY_STRING'], $_SERVER['REQUEST_URI'], $_GET);
require_once('classes/API/Products.php');

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$query = isset($_GET['query']) ? trim($_GET['query']) : '';

$categories = (isset($_GET['categories']) && $_GET['categories'] !== '') 
    ? array_filter(array_map('trim', explode(',', $_GET['categories']))) 
    : [];

$themes = (isset($_GET['themes']) && $_GET['themes'] !== '') 
    ? array_filter(array_map('trim', explode(',', $_GET['themes']))) 
    : [];

$colors = (isset($_GET['colors']) && $_GET['colors'] !== '') 
    ? array_filter(array_map('trim', explode(',', $_GET['colors']))) 
    : [];

$product = new Products;
$product->getSageProducts($page, $query, $categories, $themes, $colors);