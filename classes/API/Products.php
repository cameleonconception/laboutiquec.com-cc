<?php

// --- ACTIVATION LOGS PHP ---
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php_errors.log');

require_once('classes/Database/Connection.php');
require_once('classes/API/Profile.php');

class Products
{
    // ---------------------------------------------------------
    // FONCTION DE DEBUG : ENVOIE var_dump DANS php_errors.log
    // ---------------------------------------------------------
    private function debug_log($label, $data)
    {
        ob_start();
        var_dump($data);
        $dump = ob_get_clean();
        error_log("\n==== DEBUG : $label ====\n$dump\n", 3, __DIR__ . '/logs/php_errors.log');
    }

// ---------------------------------------------------------
    // MISE À JOUR RAPIDE D'UNE COULEUR DE VARIANTE
    // ---------------------------------------------------------
    public function updateVariantColor($oldColorName, $newColorName, $productId)
    {
        $dbConnection = new Connection();
        $pdo = $dbConnection->getPDO();

        $oldColorName = trim($oldColorName);
        $newColorName = trim($newColorName);
        $productId = (int)$productId;

        if (empty($oldColorName) || empty($newColorName) || $productId <= 0) {
            return ['success' => false, 'message' => 'Données invalides pour la modification de couleur.'];
        }

        try {
            $pdo->beginTransaction();

            // 1. Récupération ou création de la nouvelle couleur dans la table 'colors'
            $stmtC = $pdo->prepare("SELECT id FROM colors WHERE name = ?");
            $stmtC->execute([$newColorName]);
            $newColorId = $stmtC->fetchColumn();

            if (!$newColorId) {
                $stmtIns = $pdo->prepare("INSERT INTO colors (name) VALUES (?)");
                $stmtIns->execute([$newColorName]);
                $newColorId = $pdo->lastInsertId();
            }

            // 2. Récupération de l'ID de l'ancienne couleur
            $stmtOldC = $pdo->prepare("SELECT id FROM colors WHERE name = ?");
            $stmtOldC->execute([$oldColorName]);
            $oldColorId = $stmtOldC->fetchColumn();

            if ($oldColorId) {
                // 3. Mise à jour des déclinaisons de ce produit dans 'product_size_color_price'
                $stmtUpdate = $pdo->prepare("
                    UPDATE product_size_color_price 
                    SET color_id = ? 
                    WHERE product_id = ? AND color_id = ?
                ");
                $stmtUpdate->execute([$newColorId, $productId, $oldColorId]);
            }

            $pdo->commit();
            return ['success' => true, 'message' => 'Couleur mise à jour avec succès.'];

        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return ['success' => false, 'message' => 'Erreur SQL : ' . $e->getMessage()];
        }
    }

    // ---------------------------------------------------------
    // RENOMMER UNE IMAGE SUR LE DISQUE ET DANS imgNames
    // ---------------------------------------------------------
    public function renameProductImage($productId, $oldFileName, $newFileName)
    {
        $dbConnection = new Connection();
        $pdo = $dbConnection->getPDO();

        $productId = (int)$productId;
        $oldFileName = basename(trim($oldFileName));
        $newFileName = basename(trim($newFileName));

        if ($productId <= 0 || empty($oldFileName) || empty($newFileName)) {
            return ['success' => false, 'message' => 'Paramètres invalides pour le renommage d\'image.'];
        }

        // S'assurer que le nouveau nom conserve l'extension si elle a été omise
        $oldExt = pathinfo($oldFileName, PATHINFO_EXTENSION);
        $newExt = pathinfo($newFileName, PATHINFO_EXTENSION);

        if (empty($newExt) && !empty($oldExt)) {
            $newFileName .= '.' . $oldExt;
        }

        try {
            $pdo->beginTransaction();

            // 1. Récupération du SKU et du champ imgNames en BDD
            $stmt = $pdo->prepare("SELECT sku, imgNames FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                return ['success' => false, 'message' => 'Produit introuvable.'];
            }

            $sku = $product['sku'];
            $imgNamesRaw = $product['imgNames'];

            // Décodage de la liste des images
            $imgList = [];
            if (!empty($imgNamesRaw)) {
                $decoded = is_array($imgNamesRaw) ? $imgNamesRaw : json_decode($imgNamesRaw, true);
                if (is_array($decoded)) {
                    $imgList = $decoded;
                }
            }

            // 2. Mise à jour physique du fichier sur le serveur
            $basePath = dirname(__DIR__, 2);
            $productDir = $basePath . "/static-resources/products/" . $sku . "/";
            $oldFilePath = $productDir . $oldFileName;
            $newFilePath = $productDir . $newFileName;

            if (file_exists($oldFilePath)) {
                if (!rename($oldFilePath, $newFilePath)) {
                    throw new \Exception("Impossible de renommer le fichier physique sur le serveur.");
                }
            }

            // 3. Remplacement dans la liste JSON
            $updatedList = array_map(function($item) use ($oldFileName, $newFileName) {
                return ($item === $oldFileName) ? $newFileName : $item;
            }, $imgList);

            // 4. Sauvegarde de la nouvelle liste JSON dans 'imgNames'
            $stmtUpdate = $pdo->prepare("UPDATE products SET imgNames = ? WHERE id = ?");
            $stmtUpdate->execute([json_encode($updatedList, JSON_UNESCAPED_UNICODE), $productId]);

            $pdo->commit();

            return [
                'success'      => true,
                'message'      => 'Image renommée avec succès.',
                'newFileName'  => $newFileName
            ];

        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return ['success' => false, 'message' => 'Erreur : ' . $e->getMessage()];
        }
    }
public function getProducts($page, $query, $categories, $colors) {
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();
    
    $whereClauses = [];
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    
    // 1. Contrôle des droits d'accès
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRole = $stmtRole->fetchColumn();

    if ((int)$userRole === 2) {
        $whereClauses[] = "P.active IN (0, 1)";
    } else {
        $whereClauses[] = "P.active = 1";
    }

    // 2. Gestion de la pagination
    $itemsPerPage = 20;
    $limitSql = "";
    if ($page && is_numeric($page) && $page >= 1) {
        $offset = ($page - 1) * $itemsPerPage;
        $limitSql = " LIMIT $offset, $itemsPerPage";
    }

    $pdo->exec("SET SESSION group_concat_max_len = 1000000;");

    // Nettoyage des paramètres d'entrée
    $categoriesClean = is_array($categories) ? array_filter($categories, fn($c) => trim($c) !== '') : [];
    $colorsClean = is_array($colors) ? array_filter($colors, fn($c) => trim($c) !== '') : [];
    $queryClean = trim((string)$query);

    // -------------------------------------------------------------------------
    // DÉTECTION DES CATÉGORIES ET COULEURS PROCHES VIA LA RECHERCHE (LIKE)
    // -------------------------------------------------------------------------
    $detectedCategories = [];
    $detectedColors = [];

    if (!empty($queryClean)) {
        $searchTerm = "%" . $queryClean . "%";

        // Détecte les catégories dont le nom ressemble au texte recherché
        $stmtCat = $pdo->prepare("SELECT name FROM categories WHERE name LIKE ?");
        $stmtCat->execute([$searchTerm]);
        $detectedCategories = $stmtCat->fetchAll(PDO::FETCH_COLUMN);

        // Détecte les couleurs dont le nom ressemble au texte recherché
        $stmtCol = $pdo->prepare("SELECT name FROM colors WHERE name LIKE ?");
        $stmtCol->execute([$searchTerm]);
        $detectedColors = $stmtCol->fetchAll(PDO::FETCH_COLUMN);
    }

    // Fusion des filtres saisis et des filtres détectés
    $allCategoriesToSearch = array_unique(array_merge($categoriesClean, $detectedCategories));
    $allColorsToSearch = array_unique(array_merge($colorsClean, $detectedColors));

    // -------------------------------------------------------------------------
    // CONSTRUCTION DES CLAUSES ET DU CALCUL DU SCORE DE PERTINENCE
    // -------------------------------------------------------------------------
    $params = [];
    $searchConditions = [];
    $scoreCalculations = ["0"];

    // PRIORITÉ 1 : La Recherche Textuelle ($query)
    if (!empty($queryClean)) {
        $searchParam = "%" . $queryClean . "%";
        $searchConditions[] = "(
            P.name LIKE ? 
            OR P.description LIKE ? 
            OR P.sku LIKE ? 
            OR P.supplierId IN (SELECT id FROM suppliers WHERE name LIKE ?)
        )";
        array_push($params, $searchParam, $searchParam, $searchParam, $searchParam);

        // SCORE MAXIMAL : 500 points si le nom ou le SKU contient le texte
        $scoreCalculations[] = "IF(P.name LIKE '$searchParam' OR P.sku LIKE '$searchParam', 500, 0)";
        // SCORE SECONDAIRE : 200 points si la description contient le texte
        $scoreCalculations[] = "IF(P.description LIKE '$searchParam', 200, 0)";
    }

    // PRIORITÉ 2 : Les Catégories (Optionnelles / Bonus)
    if (!empty($allCategoriesToSearch)) {
        $catPlaceholders = implode(',', array_fill(0, count($allCategoriesToSearch), '?'));
        $searchConditions[] = "P.id IN (
            SELECT pc.product_id 
            FROM product_category pc 
            JOIN categories C ON pc.category_id = C.id 
            WHERE C.name IN ($catPlaceholders)
        )";
        foreach ($allCategoriesToSearch as $catName) { 
            $params[] = $catName; 
        }

        // Bonus si la catégorie est directement cochée par l'utilisateur (50 points)
        if (!empty($categoriesClean)) {
            $catListSql = "'" . implode("','", array_map('addslashes', $categoriesClean)) . "'";
            $scoreCalculations[] = "IF(P.id IN (SELECT pc.product_id FROM product_category pc JOIN categories C ON pc.category_id = C.id WHERE C.name IN ($catListSql)), 50, 0)";
        }

        // Petit bonus pour les catégories détectées automatiquement (15 points)
        if (!empty($detectedCategories)) {
            $catDetectedSql = "'" . implode("','", array_map('addslashes', $detectedCategories)) . "'";
            $scoreCalculations[] = "IF(P.id IN (SELECT pc.product_id FROM product_category pc JOIN categories C ON pc.category_id = C.id WHERE C.name IN ($catDetectedSql)), 15, 0)";
        }
    }

    // PRIORITÉ 3 : Les Couleurs (Optionnelles / Bonus)
    if (!empty($allColorsToSearch)) {
        $colorPlaceholders = implode(',', array_fill(0, count($allColorsToSearch), '?'));
        $searchConditions[] = "P.id IN (
            SELECT pscp.product_id 
            FROM product_size_color_price pscp 
            JOIN colors Cl ON pscp.color_id = Cl.id 
            WHERE Cl.name IN ($colorPlaceholders)
        )";
        foreach ($allColorsToSearch as $colorName) { 
            $params[] = $colorName; 
        }

        // Bonus pour couleur sélectionnée explicitement (30 points)
        if (!empty($colorsClean)) {
            $colorListSql = "'" . implode("','", array_map('addslashes', $colorsClean)) . "'";
            $scoreCalculations[] = "IF(P.id IN (SELECT pscp.product_id FROM product_size_color_price pscp JOIN colors Cl ON pscp.color_id = Cl.id WHERE Cl.name IN ($colorListSql)), 30, 0)";
        }
    }

    // Assemblage final des filtres
    if (!empty($searchConditions)) {
        $whereClauses[] = "(" . implode(" OR ", $searchConditions) . ")";
    }

    $whereSql = " WHERE " . implode(" AND ", $whereClauses);
    $relevanceScoreSql = implode(" + ", $scoreCalculations);

    // -------------------------------------------------------------------------
    // EXÉCUTION SQL ET CALCUL DES RÉSULTATS
    // -------------------------------------------------------------------------
    $countSql = "SELECT COUNT(DISTINCT P.id) FROM products AS P $whereSql";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalProducts = $countStmt->fetchColumn();

    $sql = "SELECT
            P.*,
            ($relevanceScoreSql) AS relevance_score,
            c.categories,
            v.variants_prices,
            v.availableColors,
            v.availableSizes,
            S.name AS supp_name,
            S.shippingCost AS supp_shippingCost,
            S.freeShippingAt AS supp_freeShippingAt
        FROM
            products AS P
        LEFT JOIN suppliers AS S ON P.supplierId = S.id
        LEFT JOIN (
            SELECT
                pc.product_id,
                GROUP_CONCAT(DISTINCT Cat.name) AS categories
            FROM
                product_category AS pc
            JOIN
                categories AS Cat ON pc.category_id = Cat.id
            GROUP BY pc.product_id
        ) AS c ON P.id = c.product_id
        LEFT JOIN (
            SELECT
                pscp.product_id,
                GROUP_CONCAT(pscp.price SEPARATOR ';') AS variants_prices,
                GROUP_CONCAT(DISTINCT Cl.name SEPARATOR ',') AS availableColors,
                GROUP_CONCAT(DISTINCT Sz.name SEPARATOR ',') AS availableSizes
            FROM
                product_size_color_price AS pscp
            LEFT JOIN colors AS Cl ON pscp.color_id = Cl.id
            LEFT JOIN sizes AS Sz ON pscp.size_id = Sz.id
            GROUP BY pscp.product_id
        ) AS v ON P.id = v.product_id
        $whereSql
        ORDER BY relevance_score DESC, P.id ASC
        {$limitSql};";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mise en forme de la réponse JSON
    foreach ($products as &$product) {
        $product['supplier'] = [
            'id'             => $product['supplierId'],
            'name'           => $product['supp_name'],
            'shippingCost'   => $product['supp_shippingCost'],
            'freeShippingAt' => $product['supp_freeShippingAt']
        ];
        
        unset($product['supp_name'], $product['supp_shippingCost'], $product['supp_freeShippingAt'], $product['relevance_score']);

        $product['categories'] = $product['categories'] ? explode(',', $product['categories']) : [];
        $product['availableColors'] = $product['availableColors'] ? explode(',', $product['availableColors']) : [];
        $product['availableSizes'] = $product['availableSizes'] ? explode(',', $product['availableSizes']) : [];

        $prices = [];
        if (!empty($product['variants_prices'])) {
            $pricesArray = explode(';', $product['variants_prices']);
            foreach ($pricesArray as $price) {
                if (is_numeric($price)) {
                    $prices[] = (float)$price;
                }
            }
        }
        $product['lowestPrice'] = !empty($prices) ? min($prices) : null;
        unset($product['variants_prices']); 
    }

    $baseWhereRole = ((int)$userRole === 2) ? "P.active IN (0, 1)" : "P.active = 1";

    $allColors = $pdo->query("SELECT DISTINCT Cl.id, Cl.name FROM colors Cl JOIN product_size_color_price pscp ON Cl.id = pscp.color_id JOIN products P ON pscp.product_id = P.id WHERE $baseWhereRole ORDER BY Cl.name ASC")->fetchAll(PDO::FETCH_ASSOC);
    $allCategories = $pdo->query("SELECT DISTINCT C.id, C.name FROM categories C JOIN product_category pc ON C.id = pc.category_id JOIN products P ON pc.product_id = P.id WHERE $baseWhereRole ORDER BY C.name ASC")->fetchAll(PDO::FETCH_ASSOC);
    $allSizes = $pdo->query("SELECT DISTINCT S_size.id, S_size.name FROM sizes S_size JOIN product_size_color_price pscp ON S_size.id = pscp.size_id JOIN products P ON pscp.product_id = P.id WHERE $baseWhereRole ORDER BY S_size.name ASC")->fetchAll(PDO::FETCH_ASSOC);
    $allSuppliers = $pdo->query("SELECT id, name, shippingCost, freeShippingAt FROM suppliers ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'           => true,
        'totalProducts'     => (int)$totalProducts,
        'products'          => $products,
        'categories'        => $allCategories,
        'colors'            => $allColors,
        'sizes'             => $allSizes,
        'suppliers'         => $allSuppliers,
        'appliedCategories' => array_values($allCategoriesToSearch),
        'appliedColors'     => array_values($allColorsToSearch)
    ]);
    exit();
}


public function generateGoogleMerchantXML() {
    @ini_set('memory_limit', '512M');
    @set_time_limit(300);

    $feedLocation = __DIR__ . "/../../google-merchant.xml";
    $domain = !empty($this->rootPath) ? $this->rootPath : $_SERVER['HTTP_HOST'];

    try {
        $dbConnection = new Connection();
        $pdo = $dbConnection->getPDO();

        $pdo->exec("SET SESSION group_concat_max_len = 10000000;");

        $sql = "SELECT
                    P.id AS product_id, 
                    P.sku, 
                    P.name, 
                    P.description, 
                    P.imgNames, 
                    Supp.name AS supp_name,
                    c.categories,
                    v.variants
                FROM products AS P
                LEFT JOIN suppliers AS Supp ON P.supplierId = Supp.id
                LEFT JOIN (
                    SELECT pc.product_id, GROUP_CONCAT(DISTINCT Cat.name SEPARATOR ' > ') AS categories
                    FROM product_category AS pc
                    JOIN categories AS Cat ON pc.category_id = Cat.id
                    GROUP BY pc.product_id
                ) AS c ON P.id = c.product_id
                LEFT JOIN (
                    SELECT
                        pscp.product_id,
                        GROUP_CONCAT(
                            CONCAT_WS('~', pscp.id, IFNULL(Sz.name, ''), IFNULL(Cl.name, ''), pscp.price, pscp.stock)
                            SEPARATOR ';;'
                        ) AS variants
                    FROM product_size_color_price AS pscp
                    LEFT JOIN sizes AS Sz ON pscp.size_id = Sz.id
                    LEFT JOIN colors AS Cl ON pscp.color_id = Cl.id
                    GROUP BY pscp.product_id
                ) AS v ON P.id = v.product_id
                WHERE P.active = 1
                ORDER BY P.id ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xmlHeader .= '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' . "\n";
        $xmlHeader .= '<channel>' . "\n";
        $xmlHeader .= '  <title>Produits personnalisables de La Boutique C de Caméléon conception</title>' . "\n";
        $xmlHeader .= '  <link>https://' . htmlspecialchars($domain) . '/cc</link>' . "\n";
        $xmlHeader .= '  <description>Fichier XML Complet contenant les produits personnalisables de La Boutique C de Caméléon conception</description>' . "\n";

        $xmlBody = '';

        while ($product = $stmt->fetch(PDO::FETCH_ASSOC)) {
            
            // --- CHARGEMENT DU TABLEAU GLOBAL DES IMAGES DU PRODUIT ---
            $rawImgNames = [];
            if (!empty($product['imgNames'])) {
                $decoded = is_array($product['imgNames']) ? $product['imgNames'] : json_decode($product['imgNames'], true);
                if (is_array($decoded)) {
                    $rawImgNames = $decoded;
                }
            }

            // --- DESCRIPTION ---
            $rawDesc = '';
            if (!empty($product['description'])) {
                $decoded = base64_decode($product['description'], true);
                $rawDesc = ($decoded !== false) ? $decoded : $product['description'];
            }
            $cleanDescription = htmlspecialchars(trim(strip_tags((string)$rawDesc)));

            // SKU Parent
            $baseSku = !empty($product['sku']) ? $product['sku'] : 'PROD_' . $product['product_id'];

            // --- TRAITEMENT DES VARIANTES (RÉDUITES PAR COULEUR UNIQUE) ---
            if (!empty($product['variants'])) {
                $variantItems = explode(';;', $product['variants']);
                $processedColors = [];

                foreach ($variantItems as $variantString) {
                    if (trim($variantString) === '') continue;

                    $parts = explode('~', $variantString);
                    if (count($parts) < 5) continue;

                    list($variantId, $size, $color, $price, $stock) = $parts;

                    $colorClean = trim($color);

                    // 1. DÉDOUBLONNAGE : UNE SEULE DÉCLINAISON PAR COULEUR UNIQUE (TAILLES IGNORÉES)
                    $colorKey = mb_strtolower($colorClean);
                    if (!empty($colorClean) && isset($processedColors[$colorKey])) {
                        continue;
                    }
                    if (!empty($colorClean)) {
                        $processedColors[$colorKey] = true;
                    }

                    // --- FILTRAGE ET MATCH STRICT DES IMAGES PAR COULEUR ---
                    $mainImage = '';
                    $additionalImages = [];
                    $colorImages = [];

                    if (!empty($colorClean)) {
                        // Regex stricte pour isoler les images correspondant à la couleur exacte
                        $escapedColor = preg_quote(mb_strtolower($colorClean), '/');
                        $colorPattern = preg_replace('/\s+/', '(\s|\+|\%20)', $escapedColor);
                        $regex = '/\b' . $colorPattern . '[\-_\.]/i';

                        foreach ($rawImgNames as $imgFileName) {
                            $decodedImgName = mb_strtolower(urldecode($imgFileName));
                            if (preg_match($regex, $decodedImgName)) {
                                $colorImages[] = $imgFileName;
                            }
                        }
                    }

                    // Fallback sur toutes les images si aucune spécifique à la couleur n'a été trouvée
                    $targetImages = !empty($colorImages) ? $colorImages : $rawImgNames;

                    if (!empty($targetImages)) {
                        $matchedIndex = null;
                        
                        // Recherche prioritaire de thumbnail-1 dans les images filtrées
                        foreach ($targetImages as $idx => $imgFileName) {
                            if (strpos(mb_strtolower($imgFileName), 'thumbnail-1') !== false) {
                                $matchedIndex = $idx;
                                break;
                            }
                        }

                        if ($matchedIndex === null) {
                            $matchedIndex = 0;
                        }

                        // Conversion garantie en .JPG
                        $mainImage = $this->ensureJpegUrl($product['sku'], $targetImages[$matchedIndex], $domain);

                        foreach ($targetImages as $idx => $imgFileName) {
                            if ($idx !== $matchedIndex) {
                                $additionalImages[] = $this->ensureJpegUrl($product['sku'], $imgFileName, $domain);
                            }
                        }
                    }

                    // --- PRIX ET STOCK ---
                    $numericPrice = floatval($price);
                    if ($numericPrice <= 0) {
                        $numericPrice = 1.00;
                    }

                    $itemPrice = number_format($numericPrice, 2, '.', '') . ' CAD';
                    $stockValue = ($stock === '-') ? '-' : intval($stock);
                    $availability = ($stockValue === '-' || $stockValue > 0) ? 'in_stock' : 'out_of_stock';
                    
                    // --- IDENTIFIANTS PAR COULEUR ---
                    $idParts = [$baseSku];
                    if ($colorClean !== '') {
                        $idParts[] = $colorClean;
                    } else {
                        $idParts[] = $variantId;
                    }

                    $uniqueVariantSku = implode('_', $idParts);
                    $itemId = htmlspecialchars($uniqueVariantSku);
                    $itemGroupId = htmlspecialchars($baseSku);

                    // Titre avec couleur uniquement (sans taille)
                    $itemTitle = $product['name'];
                    if ($colorClean !== '') {
                        $itemTitle .= ' - ' . $colorClean;
                    }
                    $itemTitle = htmlspecialchars($itemTitle);

                    // Structure URL pour le Studio de Personnalisation
                    $encodedColorParam = urlencode($colorClean);
                    $itemLink = 'https://' . $domain . '/cc/produits/studio?pid=' . $product['product_id'];
                    if (!empty($colorClean)) {
                        $itemLink .= '&amp;selectedColor=' . $encodedColorParam;
                    }

                    $xmlBody .= "    <item>\n";
                    $xmlBody .= "      <g:id>{$itemId}</g:id>\n";
                    $xmlBody .= "      <g:item_group_id>{$itemGroupId}</g:item_group_id>\n";
                    $xmlBody .= "      <g:title>{$itemTitle}</g:title>\n";
                    $xmlBody .= "      <g:description>{$cleanDescription}</g:description>\n";
                    $xmlBody .= "      <g:link>{$itemLink}</g:link>\n";
                    
                    if (!empty($mainImage)) {
                        $xmlBody .= "      <g:image_link>{$mainImage}</g:image_link>\n";
                    }

                    foreach ($additionalImages as $addImg) {
                        $xmlBody .= "      <g:additional_image_link>{$addImg}</g:additional_image_link>\n";
                    }

                    $xmlBody .= "      <g:availability>{$availability}</g:availability>\n";
                    $xmlBody .= "      <g:price>{$itemPrice}</g:price>\n";

                    if ($colorClean !== '') {
                        $xmlBody .= "      <g:color>" . htmlspecialchars($colorClean) . "</g:color>\n";
                    }

                    $xmlBody .= "      <g:mpn>" . $itemId . "</g:mpn>\n";

                    if (!empty($product['supp_name'])) {
                        $xmlBody .= "      <g:brand>" . htmlspecialchars($product['supp_name']) . "</g:brand>\n";
                    }

                    if (!empty($product['categories'])) {
                        $xmlBody .= "      <g:product_type>" . htmlspecialchars($product['categories']) . "</g:product_type>\n";
                    }

                    $xmlBody .= "      <g:condition>new</g:condition>\n";
                    $xmlBody .= "      <g:identifier_exists>true</g:identifier_exists>\n";
                    $xmlBody .= "    </item>\n";
                }
            }
        }

        $xmlFooter = "</channel>\n</rss>";
        $fullContent = $xmlHeader . $xmlBody . $xmlFooter;

        @file_put_contents($feedLocation, $fullContent, LOCK_EX);

        return $fullContent;

    } catch (Exception $e) {
        return '<?xml version="1.0" encoding="UTF-8"?><error>' . htmlspecialchars($e->getMessage()) . '</error>';
    }
}

/**
 * Force la génération et le retour d'une URL .jpg pour Google Merchant.
 */
private function ensureJpegUrl($sku, $filename, $domain) {
    // 1. Détermination du nom en .jpg avec VRAIS ESPACES
    $jpegFilename = pathinfo($filename, PATHINFO_FILENAME) . '.jpg';
    
    // Si le domaine ne contient pas http/https, on ajoute https://
    $scheme = (strpos($domain, 'http') === 0) ? '' : 'https://';

    // Base des dossiers avec vrais espaces
    $basePath = dirname(__DIR__, 2) . "/cc/static-resources/products/" . $sku . "/";
    $jpegFile = $basePath . $jpegFilename;
    $webpFile = $basePath . $filename;

    // 2. Si le fichier JPG n'existe pas physiquement sur le disque, on tente la conversion depuis le WebP
    if (!file_exists($jpegFile) && file_exists($webpFile)) {

        // Tentative 1 : Librairie PHP GD
        if (function_exists('imagecreatefromwebp') && function_exists('imagejpeg')) {
            $img = @imagecreatefromwebp($webpFile);
            if ($img !== false) {
                $w = imagesx($img);
                $h = imagesy($img);

                $bg = imagecreatetruecolor($w, $h);
                $white = imagecolorallocate($bg, 255, 255, 255);
                imagefill($bg, 0, 0, $white);
                imagecopy($bg, $img, 0, 0, 0, 0, $w, $h);

                imagejpeg($bg, $jpegFile, 85);
                imagedestroy($img);
                imagedestroy($bg);
            }
        }

        // Tentative 2 : ImageMagick / dwebp (si GD n'est pas activée)
        if (!file_exists($jpegFile) && function_exists('exec')) {
            @exec("convert " . escapeshellarg($webpFile) . " " . escapeshellarg($jpegFile));
            if (!file_exists($jpegFile)) {
                @exec("dwebp " . escapeshellarg($webpFile) . " -o " . escapeshellarg($jpegFile));
            }
        }
    }

    // 3. Construction de l'URL HTTP COMPLÈTE avec de VRAIS ESPACES
    // Exemple : https://laboutiquec.com/cc/static-resources/products/TBC813/Vert Sécurité-1-1785266938002.jpg
    $rawUrl = $scheme . $domain . '/cc/static-resources/products/' . $sku . '/' . $jpegFilename;

    // On échappe uniquement le caractère '&' pour ne pas casser la structure XML
    $xmlSafeUrl = str_replace('&', '&amp;', $rawUrl);

    // 4. Vérification d'existence sur l'URL avec espaces (HTTP 200 OK)
    if ($this->urlExists($rawUrl)) {
        return $xmlSafeUrl;
    }

    // Retour par défaut de l'URL propre avec espaces
    return $xmlSafeUrl;
}

/**
 * Helper : Vérifie l'existence de l'URL avec vrais espaces
 */
private function urlExists($url) {
    // Si l'URL contient des espaces, on encode uniquement les espaces en %20 pour le test HTTP curl/get_headers
    $encodedUrlForTest = str_replace(' ', '%20', $url);

    $headers = @get_headers($encodedUrlForTest);
    if ($headers && strpos($headers[0], '200') !== false) {
        return true;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($encodedUrlForTest);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($code === 200);
    }

    return false;
}
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // GET PRODUCT DETAILS
    // ---------------------------------------------------------
public function getProductDetails($pid, $sku)
{
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();
    $pdo->exec("SET SESSION group_concat_max_len = 1000000;");

    // 0. Vérification du rôle
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();
    
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRole = (int)$stmtRole->fetchColumn();

    // 1. Clause Active
    $activeClause = ($userRole === 2) ? "P.active IN (0, 1)" : "P.active = 1";

    if ($pid === null && $sku !== null) {
        $sqlPID = "SELECT id FROM products WHERE sku = :sku";
        $stmtPID = $pdo->prepare($sqlPID);
        $stmtPID->execute([':sku' => $sku]);
        $productId = $stmtPID->fetchColumn();
        if ($productId === false) {
            echo json_encode(['success' => false, 'message' => 'Produit introuvable']);
            exit();
        }
        $pid = (int)$productId;
    }

    // 2. Requête principale
    $sql = "SELECT
            P.*,
            c.categories,
            v.variants,
            Supp.name AS supp_name,
            Supp.shippingCost AS supp_shippingCost,
            Supp.freeShippingAt AS supp_freeShippingAt
        FROM
            products AS P
        LEFT JOIN suppliers AS Supp ON P.supplierId = Supp.id
        LEFT JOIN (
            SELECT
                pc.product_id,
                GROUP_CONCAT(DISTINCT Cat.name) AS categories
            FROM
                product_category AS pc
            JOIN
                categories AS Cat ON pc.category_id = Cat.id
            GROUP BY pc.product_id
        ) AS c ON P.id = c.product_id
        LEFT JOIN (
            SELECT
                pscp.product_id,
                GROUP_CONCAT(pscp.id, '|', Sz.name, '|', Cl.name, '|', pscp.price, '|', pscp.stock
                             SEPARATOR ';') AS variants
            FROM
                product_size_color_price AS pscp
            LEFT JOIN sizes AS Sz ON pscp.size_id = Sz.id
            LEFT JOIN colors AS Cl ON pscp.color_id = Cl.id
            GROUP BY pscp.product_id
        ) AS v ON P.id = v.product_id
        WHERE
            P.id = :pid AND $activeClause";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':pid' => $pid]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        echo json_encode(['success' => false, 'message' => 'Produit introuvable']);
        exit();
    }

    // Objet Supplier rattaché au produit
    $product['supplier'] = [
        'id'             => $product['supplierId'],
        'name'           => $product['supp_name'],
        'shippingCost'   => $product['supp_shippingCost'],
        'freeShippingAt' => $product['supp_freeShippingAt']
    ];
    unset($product['supp_name'], $product['supp_shippingCost'], $product['supp_freeShippingAt']);

    $product['categories'] = $product['categories'] ? explode(',', $product['categories']) : [];

    $variantsByColor = [];
    $prices = [];
    $colors = [];
    $sizes = [];

    if ($product['variants']) {
        foreach (explode(';', $product['variants']) as $variantString) {
            if (!empty($variantString)) {
                list($variantId, $size, $color, $price, $stock) = explode('|', $variantString);
                
                $basePrice = (float)$price;
                $stockValue = ($stock === '-') ? '-' : intval($stock);
                
                $prices[] = $basePrice;

                if (!isset($variantsByColor[$color])) {
                    $variantsByColor[$color] = [];
                }

                $variantsByColor[$color][] = [
                    'variant_id' => (int)$variantId,
                    'size'       => $size,
                    'price'      => $basePrice,
                    'stock'      => $stockValue
                ];

                $colors[] = $color;
                $sizes[] = $size;
            }
        }
    }

    $product['variants'] = $variantsByColor;
    $product['lowestPrice'] = $prices ? min($prices) : null;
    $product['colors'] = array_values(array_unique($colors));
    $product['sizes'] = array_values(array_unique($sizes));

    // --- LISTES GLOBALES POUR LES SÉLECTEURS ADMIN ---
    $allColors = $pdo->query("SELECT id, name FROM colors ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
    $allCategories = $pdo->query("SELECT id, name FROM categories ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
    $allSizes = $pdo->query("SELECT id, name FROM sizes ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
    
    // NOUVEAU : Récupération de tous les fournisseurs
    $allSuppliers = $pdo->query("SELECT id, name, shippingCost, freeShippingAt FROM suppliers ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
// --- PRODUITS SIMILAIRES (Triage par similarité SKU + Catégories en commun) ---
    $currentSku = $product['sku'];

    $sqlSimilar = "
        SELECT 
            P.id,
            P.sku, 
            P.name,
            P.imgNames,
            COUNT(pc_other.category_id) AS common_categories_count,
            CASE 
                WHEN P.sku LIKE :sku_prefix THEN 2
                WHEN :current_sku LIKE CONCAT(P.sku, '%') THEN 1
                ELSE 0
            END AS sku_match
        FROM product_category AS pc_target
        JOIN product_category AS pc_other ON pc_target.category_id = pc_other.category_id
        JOIN products AS P ON pc_other.product_id = P.id
        WHERE pc_target.product_id = :pid 
          AND P.id != :pid
          AND $activeClause
        GROUP BY P.id, P.sku, P.name, P.imgNames
        ORDER BY sku_match DESC, common_categories_count DESC, P.sku ASC
    ";

    $stmtSimilar = $pdo->prepare($sqlSimilar);
    $stmtSimilar->execute([
        ':pid'         => $pid,
        ':sku_prefix'  => $currentSku . '%',
        ':current_sku' => $currentSku
    ]);
    
    $rawSimilarProducts = $stmtSimilar->fetchAll(PDO::FETCH_ASSOC);

    $similarProducts = [];

    foreach ($rawSimilarProducts as $item) {
        // Décodage du JSON des images
        $imgList = [];
        if (!empty($item['imgNames'])) {
            $decoded = json_decode($item['imgNames'], true);
            if (is_array($decoded)) {
                $imgList = $decoded;
            }
        }

        $similarProducts[] = [
            'sku'      => $item['sku'],
            'name'     => $item['name'],
            'imgNames' => $imgList
        ];
    }

    echo json_encode([
        'success'         => true,
        'productDetails'  => $product,
        'allColors'       => $allColors,
        'allCategories'   => $allCategories,
        'allSizes'        => $allSizes,
        'allSuppliers'    => $allSuppliers,
        'similarProducts' => $similarProducts
    ]);

    exit();
    
}
    // ---------------------------------------------------------
    // VALIDATE CART FOR PAYMENT (corrigée HY093 + logs)
    // ---------------------------------------------------------
public function validateCartForPayment($cartItems)
    {
        $this->debug_log("CART ITEMS REÇUS POUR PAIEMENT", $cartItems);

        $productIds = [];
        foreach ($cartItems as $item) {
            if (isset($item['id']) && is_numeric($item['id'])) {
                $productIds[] = intval($item['id']);
            }
        }

        $uniqueProductIds = array_values(array_unique(array_filter($productIds, fn($id) => $id > 0)));

        if (empty($uniqueProductIds)) {
            return ['success' => false, 'message' => 'Aucun ID de produit valide.'];
        }

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();
        $pdo->exec("SET SESSION group_concat_max_len = 1000000;");

        $placeholders = implode(',', array_fill(0, count($uniqueProductIds), '?'));

        // 1. REQUÊTE SQL : Récupération des données de variantes et de stock
        $sql = "
        SELECT P.id, P.sku, P.name,
            GROUP_CONCAT(CONCAT(Cl.name, ':', S.name, ':', pscp.stock, ':', pscp.price)) AS pricingData
        FROM products AS P
        LEFT JOIN product_size_color_price AS pscp ON P.id = pscp.product_id
        LEFT JOIN colors AS Cl ON pscp.color_id = Cl.id
        LEFT JOIN sizes AS S ON pscp.size_id = S.id
        WHERE P.id IN ($placeholders) AND P.active = 1
        GROUP BY P.id, P.sku, P.name";

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($uniqueProductIds);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $lookup = [];
            foreach ($rows as $p) {
                $pricing = [];
                if (!empty($p['pricingData'])) {
                    $entries = explode(',', $p['pricingData']);
                    foreach ($entries as $entry) {
                        $parts = explode(':', $entry);
                        if (count($parts) === 4) {
                            list($c, $s, $stock, $price) = $parts;
                            $pricing[trim($c)][trim($s)] = [
                                'stock' => trim($stock),
                                'rawPrice' => (float)$price
                            ];
                        }
                    }
                }
                $lookup[$p['id']] = ['sku' => $p['sku'], 'pricing' => $pricing];
            }

            // 2. VALIDATION DU PANIER POUR PAIEMENT
            $invalid = [];
            foreach ($cartItems as $item) {
                $id = $item['id'];
                $signature = $item['designSignature'] ?? 'null';
                $color = $item['color'] ?? '';

                // A. Vérification de la présence et de l'état actif du produit
                if (!isset($lookup[$id])) {
                    $invalid[] = ['id' => $id, 'designSignature' => $signature, 'reason' => "Produit inactif ou inexistant"];
                    continue;
                }

                // B. Détection de la méthode de personnalisation
                $personalizationOption = $item['studioData']['selectedPersonalizationOption'] 
                    ?? $item['selectedPersonalizationOption'] 
                    ?? null;

                // SI MODE "PERSONNALISÉ" : Le produit existe et est actif, on saute la vérification des variantes et du stock
                if ($personalizationOption === "Personnalisé") {
                    continue;
                }

                $pricing = $lookup[$id]['pricing'];

                // C. Validation des variantes et des stocks pour les modes standard (DTF, Broderie, etc.)
                if (isset($item['sizes']) && is_array($item['sizes'])) {
                    foreach ($item['sizes'] as $sizeItem) {
                        $sizeName = $sizeItem['size'];
                        $qte = (int)$sizeItem['qte'];

                        if (!isset($pricing[$color][$sizeName])) {
                            $invalid[] = ['id' => $id, 'designSignature' => $signature, 'size' => $sizeName, 'reason' => "Variante non disponible"];
                            continue;
                        }

                        $info = $pricing[$color][$sizeName];

                        // Validation du Stock
                        $stockVal = trim($info['stock']);
                        if ($stockVal !== '-' && $stockVal !== '') {
                            if ($qte > (int)$stockVal) {
                                $invalid[] = ['id' => $id, 'designSignature' => $signature, 'size' => $sizeName, 'reason' => "Stock insuffisant ($stockVal restant)"];
                            }
                        }
                    }
                }
            }

            if (!empty($invalid)) {
                return ['success' => false, 'invalid_products' => $invalid];
            }

            return ['success' => true, 'cart' => $cartItems];

        } catch (PDOException $e) {
            error_log("SQL ERROR validateCartForPayment: " . $e->getMessage());
            return ['success' => false, 'message' => "Erreur technique lors de la validation du paiement."];
        }
    }


    // ---------------------------------------------------------
    // VALIDATE CART (VERSION JSON pour affichage)
    // ---------------------------------------------------------
    public function validateCart($cartItems)
    {
        $productIds = [];
        foreach ($cartItems as $item) {
            if (isset($item['id']) && is_numeric($item['id'])) {
                $productIds[] = intval($item['id']);
            }
        }

        $uniqueProductIds = array_values(array_unique(array_filter($productIds, fn($id) => $id > 0)));

        if (empty($uniqueProductIds)) {
            echo json_encode(['success' => true, 'message' => 'Panier vide']);
            exit();
        }

        $dbConnection = new Connection;
        $pdo = $dbConnection->getPDO();
        $pdo->exec("SET SESSION group_concat_max_len = 1000000;");

        $placeholders = implode(',', array_fill(0, count($uniqueProductIds), '?'));

        // On récupère les infos produits et le rawPrice par variante
        $sql = "
        SELECT P.id, P.sku, P.name,
            GROUP_CONCAT(CONCAT(Cl.name, ':', S.name, ':', pscp.stock, ':', pscp.price)) AS pricingData
        FROM products AS P
        LEFT JOIN product_size_color_price AS pscp ON P.id = pscp.product_id
        LEFT JOIN colors AS Cl ON pscp.color_id = Cl.id
        LEFT JOIN sizes AS S ON pscp.size_id = S.id
        WHERE P.id IN ($placeholders) AND P.active = 1
        GROUP BY P.id, P.sku, P.name";

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($uniqueProductIds);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $lookup = [];
            foreach ($rows as $p) {
                $pricing = [];
                if (!empty($p['pricingData'])) {
                    $entries = explode(',', $p['pricingData']);
                    foreach ($entries as $entry) {
                        $parts = explode(':', $entry);
                        if (count($parts) === 4) {
                            list($c, $s, $stock, $price) = $parts;
                            $pricing[trim($c)][trim($s)] = [
                                'stock' => trim($stock),
                                'rawPrice' => (float)$price
                            ];
                        }
                    }
                }
                $lookup[$p['id']] = ['sku' => $p['sku'], 'pricing' => $pricing];
            }

            // --- VALIDATION ---
            $invalid = [];
            foreach ($cartItems as $item) {
                $id = $item['id'];
                $signature = $item['designSignature'] ?? 'null';
                $color = $item['color'] ?? '';

                if (!isset($lookup[$id])) {
                    $invalid[] = ['id' => $id, 'designSignature' => $signature, 'reason' => "Produit inactif"];
                    continue;
                }

                // Détection si l'article est en mode "Personnalisé"
                $personalizationOption = $item['studioData']['selectedPersonalizationOption'] 
                    ?? $item['selectedPersonalizationOption'] 
                    ?? null;

                // SI MODE "PERSONNALISÉ" : On saute les validations de variantes/prix/couleur
                if ($personalizationOption === "Personnalisé") {
                    continue;
                }

                $sku = $lookup[$id]['sku'];
                $pricing = $lookup[$id]['pricing'];

                foreach ($item['sizes'] as $sizeItem) {
                    $sizeName = $sizeItem['size'];
                    $clientPrice = (float)($sizeItem['price'] ?? 0);

                    if (!isset($pricing[$color][$sizeName])) {
                        $invalid[] = ['id' => $id, 'designSignature' => $signature, 'reason' => "Variante $sizeName non trouvée"];
                        continue;
                    }

                    $dbRawPrice = $pricing[$color][$sizeName]['rawPrice'];

                    // On calcule le prix attendu avec la même logique que JS
                    $expectedPrice = $this->calculateItemPricePHP($item, $cartItems, $dbRawPrice);

                    // Validation avec une tolérance de 0.05$ pour les arrondis
                    if (abs($clientPrice - $expectedPrice) > 0.05) {
                        $invalid[] = [
                            'id' => $id,
                            'designSignature' => $signature,
                            'size' => $sizeName,
                            'reason' => "Prix invalide ($clientPrice $). Attendu : $expectedPrice $"
                        ];
                    }
                }
            }

            echo json_encode($invalid ? ['success' => true, 'invalid_products' => $invalid] : ['success' => true]);

        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }

private function calculateItemPricePHP($currentItem, $allCartItems, $rawPrice) {
    // 1. Coût de base (Inversion de la marge 1.6)
    $initialCost = $rawPrice / 1.6;

    // 2. Calcul des volumes globaux
    $totalQtyGlobal = 0;
    $qtySameSupp = 0;
    $totalQtyCustomized = 0;
    $globalSurfaceStandard = 0;
    
    $currentSupplierId = $currentItem['supplierId'];

    foreach ($allCartItems as $item) {
        $itemQty = 0;
        foreach ($item['sizes'] as $s) { $itemQty += (int)$s['qte']; }
        
        $totalQtyGlobal += $itemQty;
        
        if ($item['supplierId'] == $currentSupplierId) {
            $qtySameSupp += $itemQty;
        }

        if (!empty($item['designSignature']) && $item['designSignature'] !== 'null') {
            $totalQtyCustomized += $itemQty;
            
            // Calcul de la surface globale (uniquement nécessaire pour le barème DTF)
            if (isset($item['studioData']['views']) && is_array($item['studioData']['views'])) {
                foreach ($item['studioData']['views'] as $view) {
                    if (isset($view['logos']) && is_array($view['logos'])) {
                        foreach ($view['logos'] as $logo) {
                            $globalSurfaceStandard += ((float)$logo['width'] * (float)$logo['height'] * $itemQty);
                        }
                    }
                }
            }
        }
    }

    // 3. Part de livraison Fournisseur
    $supplier = $currentItem['supplier'] ?? [];
    $shippingFee = (float)($supplier['shippingCost'] ?? 0);
    $freeAt = (float)($supplier['freeShippingAt'] ?? 0);
    
    $currentShippingFee = ($qtySameSupp * $rawPrice >= $freeAt && $freeAt > 0) ? 0 : $shippingFee;
    $shippingShare = $currentShippingFee / max(1, $qtySameSupp);

    // 4. Coût de décoration (DTF, UV DTF ou Option Fixe)
    $decorationCostUnit = 0;
    $personalizationOption = $currentItem['studioData']['selectedPersonalizationOption'] ?? null;

    if (!empty($currentItem['designSignature']) && $currentItem['designSignature'] !== 'null' && isset($currentItem['studioData']['views'])) {
        
        // --- Calcul des specs de l'item actuel ---
        $itemLogoCount = 0;
        $itemSurface = 0;
        foreach ($currentItem['studioData']['views'] as $view) {
            if (isset($view['logos']) && is_array($view['logos'])) {
                foreach ($view['logos'] as $logo) {
                    $itemLogoCount++;
                    $itemSurface += ((float)$logo['width'] * (float)$logo['height']);
                }
            }
        }

        $decoShippingShare = 2.50 / max(1, $totalQtyCustomized);

        if ($personalizationOption === "DTF") {
            // Logique DTF : Barème dégressif
            $getRate = function($area) {
                if ($area >= 3000) return 0.017;
                if ($area >= 1600) return 0.020;
                if ($area >= 700) return 0.022;
                if ($area >= 20) return 0.030;
                return 0.060;
            };
            $rate = $getRate($globalSurfaceStandard);
            $labor = 1.67 * $itemLogoCount;
            $decorationCostUnit = $labor + ($itemSurface * $rate) + $decoShippingShare;

        } elseif ($personalizationOption === "UV DTF") {
            // Logique UV DTF : Prix fixe 0.036$ / po²
            $labor = 0.67 * $itemLogoCount;
            $decorationCostUnit = $labor + ($itemSurface * 0.036) + $decoShippingShare;
        }

    } else {
        // Option de personnalisation hors studio (Blank avec extra)
        $decorationCostUnit = (float)($currentItem['personalizationPrice'] ?? 0);
    }

    // 5. Multiplicateur de marge global
    $multiplier = 1.6;
    if ($totalQtyGlobal >= 50) $multiplier = 1.3;
    elseif ($totalQtyGlobal >= 26) $multiplier = 1.4;

    // 6. Total Final
    $finalPrice = ($initialCost + $decorationCostUnit + $shippingShare) * $multiplier;

    return round($finalPrice, 2);
}

public function deleteProduct($id, $sku) {
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    try {
        $pdo->beginTransaction();

        // 1. Suppression des relations (si pas de CASCADE en SQL)
        $pdo->prepare("DELETE FROM product_category WHERE product_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM product_size_color_price WHERE product_id = ?")->execute([$id]);

        // 2. Suppression du produit
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);

        // 3. Suppression physique du dossier et de son contenu
        $basePath = dirname(__DIR__, 2);
        $dirPath = $basePath . "/static-resources/products/" . $sku;

        if (is_dir($dirPath)) {
            $this->deleteDirectory($dirPath);
        }

        $pdo->commit();
        return ['success' => true, 'message' => 'Produit supprimé.'];

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        return ['success' => false, 'message' => $e->getMessage()];
    }
}


// --- AJOUT DANS Products.php ---

public function duplicateProduct($originalId)
{
    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    try {
        $pdo->beginTransaction();

        // 1. Récupération de l'ensemble des données du produit d'origine
        $stmtProd = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmtProd->execute([$originalId]);
        $originalProduct = $stmtProd->fetch(PDO::FETCH_ASSOC);

        if (!$originalProduct) {
            return ['success' => false, 'message' => 'Produit d\'origine introuvable.'];
        }

        // 2. Génération automatique du nouveau SKU (ex: SKU-1, SKU-2...)
        $baseSku = $originalProduct['sku'];
        $newSku = $baseSku . "_1";
        $counter = 1;

        while (true) {
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM products WHERE sku = ?");
            $stmtCheck->execute([$newSku]);
            if ($stmtCheck->fetchColumn() == 0) {
                break;
            }
            $counter++;
            $newSku = $baseSku . "-" . $counter;
        }

        // 3. Insertion du produit copié en base de données
        $sqlInsert = "INSERT INTO products (
            name, sku, description, personalization, active, supplierId, 
            blank, dtf, broderie, customPersonalization, tampographie, 
            vividPrint, screenPrint, engraving, patch, uvdtf, 
            blankDetails, embroideryDetails, customPersonalizationDetails, 
            tampographieDetails, vividPrintDetails, screenPrintDetails, 
            engravingDetails, patchDetails, zoom
        ) VALUES (
            :name, :sku, :description, :personalization, :active, :supplierId, 
            :blank, :dtf, :broderie, :customPersonalization, :tampographie, 
            :vividPrint, :screenPrint, :engraving, :patch, :uvdtf, 
            :blankDetails, :embroideryDetails, :customPersonalizationDetails, 
            :tampographieDetails, :vividPrintDetails, :screenPrintDetails, 
            :engravingDetails, :patchDetails, :zoom
        )";

        $stmt = $pdo->prepare($sqlInsert);
        $stmt->execute([
            ':name'                         => $originalProduct['name'] . ' (Copie)',
            ':sku'                          => $newSku,
            ':description'                  => $originalProduct['description'],
            ':personalization'              => $originalProduct['personalization'],
            ':active'                       => 0, // Désactivé par défaut pour des raisons de sécurité
            ':supplierId'                   => $originalProduct['supplierId'],
            ':blank'                        => $originalProduct['blank'],
            ':dtf'                          => $originalProduct['dtf'],
            ':broderie'                     => $originalProduct['broderie'],
            ':customPersonalization'        => $originalProduct['customPersonalization'],
            ':tampographie'                 => $originalProduct['tampographie'],
            ':vividPrint'                   => $originalProduct['vividPrint'],
            ':screenPrint'                  => $originalProduct['screenPrint'],
            ':engraving'                    => $originalProduct['engraving'],
            ':patch'                        => $originalProduct['patch'],
            ':uvdtf'                        => $originalProduct['uvdtf'],
            ':blankDetails'                 => $originalProduct['blankDetails'],
            ':embroideryDetails'            => $originalProduct['embroideryDetails'],
            ':customPersonalizationDetails' => $originalProduct['customPersonalizationDetails'],
            ':tampographieDetails'          => $originalProduct['tampographieDetails'],
            ':vividPrintDetails'            => $originalProduct['vividPrintDetails'],
            ':screenPrintDetails'           => $originalProduct['screenPrintDetails'],
            ':engravingDetails'             => $originalProduct['engravingDetails'],
            ':patchDetails'                 => $originalProduct['patchDetails'],
            ':zoom'                         => $originalProduct['zoom']
        ]);

        $newProductId = (int)$pdo->lastInsertId();

        // 4. Copie des catégories rattachées
        $stmtCategories = $pdo->prepare("SELECT category_id FROM product_category WHERE product_id = ?");
        $stmtCategories->execute([$originalId]);
        $categories = $stmtCategories->fetchAll(PDO::FETCH_COLUMN);

        $stmtInsCat = $pdo->prepare("INSERT INTO product_category (product_id, category_id) VALUES (?, ?)");
        foreach ($categories as $catId) {
            $stmtInsCat->execute([$newProductId, $catId]);
        }

        // 5. Copie des variantes (Tailles, Couleurs, Prix, Stocks)
        $stmtVariants = $pdo->prepare("SELECT size_id, color_id, price, stock FROM product_size_color_price WHERE product_id = ?");
        $stmtVariants->execute([$originalId]);
        $variants = $stmtVariants->fetchAll(PDO::FETCH_ASSOC);

        $stmtInsVar = $pdo->prepare("INSERT INTO product_size_color_price (product_id, size_id, color_id, price, stock) VALUES (?, ?, ?, ?, ?)");
        foreach ($variants as $v) {
            $stmtInsVar->execute([
                $newProductId,
                $v['size_id'],
                $v['color_id'],
                $v['price'],
                $v['stock']
            ]);
        }

        // 6. Duplication du dossier d'images et fichiers sur le serveur
        $basePath = dirname(__DIR__, 2);
        $oldDir = $basePath . "/static-resources/products/" . $originalProduct['sku'];
        $newDir = $basePath . "/static-resources/products/" . $newSku;

        if (is_dir($oldDir)) {
            $this->copyDirectory($oldDir, $newDir);
        }

        $pdo->commit();

        return [
            'success'    => true,
            'message'    => 'Produit dupliqué avec succès.',
            'new_id'     => $newProductId,
            'new_sku'    => $newSku
        ];

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return ['success' => false, 'message' => 'Erreur lors de la duplication : ' . $e->getMessage()];
    }
}

/**
 * Fonction helper pour copier un dossier et tout son contenu
 */
private function copyDirectory($src, $dst) {
    if (!is_dir($dst)) {
        mkdir($dst, 0777, true);
    }
    $dir = opendir($src);
    while (false !== ($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($src . '/' . $file)) {
                $this->copyDirectory($src . '/' . $file, $dst . '/' . $file);
            } else {
                copy($src . '/' . $file, $dst . '/' . $file);
            }
        }
    }
    closedir($dir);
}

/**
 * Fonction helper pour supprimer un dossier et tout son contenu (fichiers/sous-dossiers)
 */
private function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return unlink($dir);

    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }

    return rmdir($dir);
}

public function updateProduct($post, $files, $categories, $variants, $personalization, $supplierId, $imgNames)
{
    $productId = (int)$post['id'];
    $newSku = trim($post['sku']);
    $oldSku = trim($post['old_sku']);

    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    try {
        $pdo->beginTransaction();

        // 1. Mise à jour des informations de base
        $sqlProd = "UPDATE products 
                    SET name = :name, sku = :sku, description = :description, imgNames = :imgNames,
                        personalization = :personalization, 
                        active = :active, 
                        supplierId = :supplierId, 
                        blank = :blank, 
                        dtf = :dtf, 
                        broderie = :broderie, 
                        customPersonalization = :customPersonalization, 
                        tampographie = :tampographie, 
                        vividPrint = :vividPrint,
                        screenPrint = :screenPrint,
                        engraving = :engraving,
                        patch = :patch,
                        uvdtf = :uvdtf, 
                        blankDetails = :blankDetails, 
                        embroideryDetails = :embroideryDetails, 
                        customPersonalizationDetails = :customPersonalizationDetails,
                        tampographieDetails = :tampographieDetails, 
                        vividPrintDetails = :vividPrintDetails,
                        screenPrintDetails = :screenPrintDetails,
                        engravingDetails = :engravingDetails,
                        patchDetails = :patchDetails,
                        zoom = :zoom
                    WHERE id = :id";
        
        $stmtProd = $pdo->prepare($sqlProd);
        
        $stmtProd->execute([
            ':name'            => $post['name'] ?? '',
            ':sku'             => $newSku,
            ':description'     => $post['description'] ?? '',
            ':imgNames'        => is_array($imgNames) ? json_encode($imgNames, JSON_UNESCAPED_UNICODE) : $imgNames,
            ':blankDetails'     => $post['blankDetails'] ?? '',
            ':embroideryDetails' => $post['embroideryDetails'] ?? '',
            ':customPersonalizationDetails' => $post['customPersonalizationDetails'] ?? '',
            ':tampographieDetails' => $post['tampographieDetails'] ?? '',
            ':vividPrintDetails' => $post['vividPrintDetails'] ?? '',
            ':screenPrintDetails' => $post['screenPrintDetails'] ?? '',
            ':engravingDetails' => $post['engravingDetails'] ?? '',
            ':patchDetails'     => $post['patchDetails'] ?? '',
            ':personalization' => $personalization,
            ':active'          => (int)$post['active'],
            ':blank'           => (int)$post['blank'],
            ':dtf'             => (int)$post['dtf'],
            ':broderie'        => (int)$post['broderie'],
            ':customPersonalization' => (int)$post['customPersonalization'],
            ':tampographie'    => (int)$post['tampographie'],
            ':vividPrint'      => (int)$post['vividPrint'],
            ':screenPrint'     => (int)$post['screenPrint'],
            ':engraving'       => (int)$post['engraving'],
            ':patch'           => (int)$post['patch'],
            ':uvdtf'           => (int)$post['uvdtf'],
            ':zoom'            => (float)$post['zoom'],
            ':supplierId'      => $supplierId,
            ':id'              => $productId
        ]);

        // 2. Gestion du dossier physique (Si le SKU a changé, on renomme le dossier)
        $basePath = dirname(__DIR__, 2); 
        $oldPath = $basePath . "/static-resources/products/" . $oldSku;
        $newPath = $basePath . "/static-resources/products/" . $newSku;

        if ($oldSku !== $newSku && is_dir($oldPath)) {
            if (!rename($oldPath, $newPath)) {
                throw new Exception("Impossible de renommer le dossier du produit.");
            }
        }

        if (!is_dir($newPath)) {
            mkdir($newPath, 0777, true);
        }

        // 3. SUPPRESSION DES IMAGES MARQUÉES ET NETTOYAGE DES FICHIERS ORPHELINS SUR LE DISQUE
        $deleteImages = json_decode($post['deleteImages'] ?? '[]', true);
        foreach ($deleteImages as $imageRelativePath) {
            $fileName = basename($imageRelativePath);
            $filePath = $newPath . "/" . $fileName;
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        // --- NETTOYAGE AUTOMATIQUE DES FICHIERS NON RÉPERTORIÉS ---
        if (is_dir($newPath)) {
            $existingFilesOnDisk = scandir($newPath);
            $allowedImages = is_array($imgNames) ? $imgNames : json_decode($imgNames, true);
            if (!is_array($allowedImages)) {
                $allowedImages = [];
            }

            $protectedFiles = ['.', '..', 'Fiche technique.pdf'];

            foreach ($existingFilesOnDisk as $file) {
                if (in_array($file, $protectedFiles)) {
                    continue;
                }

                if (!in_array($file, $allowedImages)) {
                    $filePathToDelete = $newPath . "/" . $file;
                    if (file_exists($filePathToDelete) && is_file($filePathToDelete)) {
                        unlink($filePathToDelete);
                    }
                }
            }
        }

        // 4. NETTOYAGE ET RÉ-INSERTION DES CATÉGORIES
        $pdo->prepare("DELETE FROM product_category WHERE product_id = ?")->execute([$productId]);
        
        foreach ($categories as $catName) {
            $catName = trim($catName);
            $stmtCat = $pdo->prepare("SELECT id FROM categories WHERE name = :name");
            $stmtCat->execute([':name' => $catName]);
            $catId = $stmtCat->fetchColumn();

            if (!$catId) {
                $stmtInsCat = $pdo->prepare("INSERT INTO categories (name) VALUES (:name)");
                $stmtInsCat->execute([':name' => $catName]);
                $catId = $pdo->lastInsertId();
            }
            
            $pdo->prepare("INSERT INTO product_category (product_id, category_id) VALUES (?, ?)")
                ->execute([$productId, $catId]);
        }

        // 5. NETTOYAGE ET RÉ-INSERTION DES VARIANTES
        $pdo->prepare("DELETE FROM product_size_color_price WHERE product_id = ?")->execute([$productId]);

        foreach ($variants as $v) {
            $sizeName = trim($v['size']);
            $stmtS = $pdo->prepare("SELECT id FROM sizes WHERE name = ?");
            $stmtS->execute([$sizeName]);
            $sizeId = $stmtS->fetchColumn() ?: ($pdo->prepare("INSERT INTO sizes (name) VALUES (?)")->execute([$sizeName]) ? $pdo->lastInsertId() : null);

            $colorName = trim($v['color']);
            $stmtC = $pdo->prepare("SELECT id FROM colors WHERE name = ?");
            $stmtC->execute([$colorName]);
            $colorId = $stmtC->fetchColumn() ?: ($pdo->prepare("INSERT INTO colors (name) VALUES (?)")->execute([$colorName]) ? $pdo->lastInsertId() : null);

            $sqlVar = "INSERT INTO product_size_color_price 
                    (product_id, size_id, color_id, price, stock) 
                    VALUES (?, ?, ?, ?, ?)";
            
            $stmtVar = $pdo->prepare($sqlVar);
            $stmtVar->execute([
                $productId, 
                $sizeId, 
                $colorId, 
                $v['price'], 
                $v['stock'],
            ]);
        }

        // 6. Gestion des nouvelles IMAGES téléversées
        if (isset($files['img']) && !empty($files['img']['name'][0])) {
            $fileEntries = $files['img'];
            $count = count($fileEntries['name']);

            for ($i = 0; $i < $count; $i++) {
                if ($fileEntries['error'][$i] === UPLOAD_ERR_OK) {
                    $originalName = basename($fileEntries['name'][$i]);
                    $destPath = $newPath . "/" . $originalName;

                    if (!move_uploaded_file($fileEntries['tmp_name'][$i], $destPath)) {
                        throw new Exception("Échec du transfert de l'image : " . $originalName);
                    }
                }
            }
        }

        // 7. Gestion de la FICHE TECHNIQUE
        if (isset($files['technicalFile']) && $files['technicalFile']['error'] === UPLOAD_ERR_OK) {
            $pdfDest = $newPath . "/Fiche technique.pdf";
            move_uploaded_file($files['technicalFile']['tmp_name'], $pdfDest);
        }

        $pdo->commit();

        return [
            'success' => true, 
            'message' => 'Produit mis à jour avec succès.'
        ];

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return ['success' => false, 'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()];
    }
}

public function addNewProducts($post, $files, $categories, $variants, $personalization, $supplierId)
{
    $profile = new Profile();
    $userId = $profile->getUserInfo_id();

    $dbConnection = new Connection;
    $pdo = $dbConnection->getPDO();

    // 0. Vérification du rôle
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = :id");
    $stmtRole->execute([':id' => $userId]);
    $user = $stmtRole->fetch(\PDO::FETCH_ASSOC);

    if (!$user || (int)$user['role'] !== 2) {
        return ['success' => false, 'message' => 'Accès refusé : privilèges insuffisants.'];
    }

    // 1. Vérification du SKU unique
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM products WHERE sku = :sku");
    $stmtCheck->execute([':sku' => $post['sku']]);
    if ($stmtCheck->fetchColumn() > 0) {
        return ['success' => false, 'message' => 'Ce SKU existe déjà dans la base de données.'];
    }

    try {
    $pdo->beginTransaction();

    
    // 2. Insertion du produit de base
    // AJOUT de supplierId dans les colonnes et les placeholders
    $sqlInsert = "INSERT INTO products (name, sku, description, personalization, active, supplierId, dtf, broderie, customPersonalization, tampographie, vividPrint, screenPrint, engraving,patch,  customPersonalizationDetails, embroideryDetails,tampographieDetails, vividPrintDetails, screenPrintDetails, engravingDetails,  patchDetails, uvdtf) 
                  VALUES (:name, :sku, :description, :personalization, :active, :supplierId, :dtf, :broderie, :customPersonalization, :tampographie, :vividPrint, :screenPrint, :engraving,:patch, :customPersonalizationDetails, :embroideryDetails,:tampographieDetails, :vividPrintDetails, :screenPrintDetails, :engravingDetails, :patchDetails, :uvdtf)";
    
    $stmt = $pdo->prepare($sqlInsert);
    $stmt->execute([
        ':name'            => $post['name'] ?? '',
        ':sku'             => $post['sku'],
        ':description'     => $post['description'] ?? '',
        ':personalization' => $personalization,
        ':active'          => (int)$post['active'],
        ':dtf'          => (int)$post['dtf'],
        ':broderie'          => (int)$post['broderie'],
        ':customPersonalization'          => (int)$post['customPersonalization'],
        ':tampographie'          => (int)$post['tampographie'],
        ':vividPrint'          => (int)$post['vividPrint'],
        ':screenPrint'          => (int)$post['screenPrint'],
        ':engraving'          => (int)$post['engraving'],
        ':patch'          => (int)$post['patch'],
        ':customPersonalizationDetails' => $post['customPersonalizationDetails'],
        ':embroideryDetails' => $post['embroideryDetails'] ?? '',
        ':tampographieDetails' => $post['tampographieDetails'] ?? '',
        ':vividPrintDetails'     => $post['vividPrintDetails'] ?? '',
        ':screenPrintDetails'     => $post['screenPrintDetails'] ?? '',
        ':engravingDetails'     => $post['engravingDetails'] ?? '',
        ':patchDetails'     => $post['patchDetails'] ?? '',
        ':uvdtf'          => (int)$post['uvdtf'],
        ':supplierId'      => $supplierId // <--- Liaison de la variable passée en argument
    ]);

    $productId = (int)$pdo->lastInsertId();

        // 3. Gestion des catégories (Insertion + Liaison)
        foreach ($categories as $catName) {
            $catName = trim($catName);
            $stmtCat = $pdo->prepare("SELECT id FROM categories WHERE name = :name");
            $stmtCat->execute([':name' => $catName]);
            $catId = $stmtCat->fetchColumn();

            if (!$catId) {
                $stmtInsCat = $pdo->prepare("INSERT INTO categories (name) VALUES (:name)");
                $stmtInsCat->execute([':name' => $catName]);
                $catId = $pdo->lastInsertId();
            }
            
            $pdo->prepare("INSERT INTO product_category (product_id, category_id) VALUES (?, ?)")
                ->execute([$productId, $catId]);
        }

        // 4. Gestion des variantes (Tailles, Couleurs et Paliers de prix)
        foreach ($variants as $v) {
            // Gestion Taille
            $sizeName = trim($v['size']);
            $stmtS = $pdo->prepare("SELECT id FROM sizes WHERE name = ?");
            $stmtS->execute([$sizeName]);
            $sizeId = $stmtS->fetchColumn() ?: ($pdo->prepare("INSERT INTO sizes (name) VALUES (?)")->execute([$sizeName]) ? $pdo->lastInsertId() : null);

            // Gestion Couleur
            $colorName = trim($v['color']);
            $stmtC = $pdo->prepare("SELECT id FROM colors WHERE name = ?");
            $stmtC->execute([$colorName]);
            $colorId = $stmtC->fetchColumn() ?: ($pdo->prepare("INSERT INTO colors (name) VALUES (?)")->execute([$colorName]) ? $pdo->lastInsertId() : null);

            // Préparation des paliers (NULL si vide dans le JS)

            $sqlVar = "INSERT INTO product_size_color_price 
                       (product_id, size_id, color_id, price, stock) 
                       VALUES (?, ?, ?, ?, ?)";
            
            $stmtVar = $pdo->prepare($sqlVar);
            $stmtVar->execute([
                $productId, $sizeId, $colorId, $v['price'], $v['stock']
            ]);
        }

        // 5. GESTION DES FICHIERS (Dossier SKU)
        $skuFolder = $post['sku'];
        $basePath = dirname(__DIR__, 2); 
        $absoluteDir = $basePath . "/static-resources/products/" . $skuFolder . "/";

        if (!is_dir($absoluteDir)) {
            mkdir($absoluteDir, 0777, true);
        }

        // Gestion des IMAGES
        if (isset($files['img']) && !empty($files['img']['name'][0])) {
            $fileEntries = $files['img'];
            $count = count($fileEntries['name']);

            for ($i = 0; $i < $count; $i++) {
                if ($fileEntries['error'][$i] === UPLOAD_ERR_OK) {
                    $originalName = basename($fileEntries['name'][$i]);
                    $destPath = $absoluteDir . $originalName;
                    move_uploaded_file($fileEntries['tmp_name'][$i], $destPath);
                }
            }
        }

        // Gestion de la FICHE TECHNIQUE
        if (isset($files['technicalFile']) && $files['technicalFile']['error'] === UPLOAD_ERR_OK) {
            $pdfDest = $absoluteDir . "Fiche technique.pdf";
            move_uploaded_file($files['technicalFile']['tmp_name'], $pdfDest);
        }

        $pdo->commit();

        return [
            'success' => true, 
            'message' => 'Produit ajouté avec succès.', 
            'product_id' => $productId
        ];

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return ['success' => false, 'message' => 'Erreur lors de l\'ajout : ' . $e->getMessage()];
    }
}

public function uploadColorImage($fileData)
{
    // Chemin vers le dossier des couleurs
    $basePath = dirname(__DIR__, 2); 
    $absoluteDir = $basePath . "/static-resources/products/colors/";

    if (!is_dir($absoluteDir)) {
        mkdir($absoluteDir, 0777, true);
    }

    $uploadedCount = 0;
    $errors = [];

    // On vérifie si on a reçu un seul fichier ou plusieurs
    // PHP structure les uploads multiples bizarrement, on normalise ici :
    $files = [];
    if (is_array($fileData['name'])) {
        // Cas multiple
        foreach ($fileData['name'] as $key => $value) {
            $files[] = [
                'name'     => $fileData['name'][$key],
                'tmp_name' => $fileData['tmp_name'][$key],
                'error'    => $fileData['error'][$key],
                'size'     => $fileData['size'][$key]
            ];
        }
    } else {
        // Cas fichier unique
        $files[] = $fileData;
    }

    // Boucle de traitement
    foreach ($files as $file) {
        if ($file['error'] === UPLOAD_ERR_OK) {
            $originalName = basename($file['name']);
            $destPath = $absoluteDir . $originalName;

            // Vérification extension
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            if (in_array($extension, ['webp', 'png', 'jpg', 'jpeg'])) {
                if (move_uploaded_file($file['tmp_name'], $destPath)) {
                    $uploadedCount++;
                } else {
                    $errors[] = "Erreur de transfert pour " . $originalName;
                }
            } else {
                $errors[] = $originalName . " : format non supporté.";
            }
        }
    }

    return [
        'success' => ($uploadedCount > 0),
        'message' => ($uploadedCount > 0) ? "$uploadedCount fichier(s) ajouté(s) avec succès." : "Aucun fichier n'a été ajouté.",
        'details' => $errors
    ];
}

public function getAllColorImages() {
    $basePath = dirname(__DIR__, 2); 
    $dir = $basePath . "/static-resources/products/colors/";
    $images = [];

    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if (!in_array($file, [".", ".."]) && is_file($dir . $file)) {
                $images[] = $file;
            }
        }
    }
    return ['success' => true, 'images' => $images];
}

/**
 * Supprime une image de couleur spécifique
 */
public function deleteColorImage($fileName) {
    // Sécurité : on nettoie le nom du fichier pour éviter de remonter dans les dossiers
    $fileName = basename($fileName);
    $basePath = dirname(__DIR__, 2); 
    $filePath = $basePath . "/static-resources/products/colors/" . $fileName;

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            return ['success' => true, 'message' => 'Image supprimée.'];
        }
    }
    return ['success' => false, 'message' => 'Erreur lors de la suppression ou fichier introuvable.'];
}

}







