<?php

require_once('classes/API/Products.php');

// Récupération de la page (Entier)
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;

// Récupération de la recherche textuelle
$query = isset($_GET['query']) ? $_GET['query'] : '';

/**
 * Transformation des filtres en tableaux
 * Si l'URL est : products.php?colors=1,4,12
 * explode() transforme cela en : [1, 4, 12]
 */
$categories = (isset($_GET['categories']) && $_GET['categories'] !== '') 
    ? explode(',', $_GET['categories']) 
    : [];

$colors = (isset($_GET['colors']) && $_GET['colors'] !== '') 
    ? explode(',', $_GET['colors']) 
    : [];

$product = new Products;

// On passe maintenant des tableaux à la méthode getProducts
$product->getProducts($page, $query, $categories, $colors);

?>



