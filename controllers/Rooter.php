<?php

require_once('classes/Config/Config.php');
require_once('classes/Rooter/Rooter.php');

try {
    $ROOTER = new Rooter();
    $ROOTER->setRootDirectory('laboutiquec.com/cc'); // Define the application's root directory.
    $startingLabel = $ROOTER->getRootDirectory();

    if (Config::getInstance()->getAppEnvironment() === 'DEV') {
        $ROOTER->setRootPath(rootPath: '/localhost/' . $ROOTER->getRootDirectory());
    } else {
        $ROOTER->setRootPath(rootPath: '/' . $ROOTER->getRootDirectory());
    }


    // Views
    $ROOTER->addViews('GET', '/', '/views/public/products.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/accueil', '/views/public/products.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/panier', '/views/public/cart.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/produits', '/views/public/products.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/produits?categories=Article promotionnel', '/views/public/products.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/produits/details', '/views/public/product-details.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/produits/studio', '/views/public/product-studio.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/commande', '/views/public/order-details.php', 'ALL', [], 'TRUE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/confirmation', '/views/public/confirmation.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/catalogues', '/views/public/catalogues.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/outils', '/views/public/outils.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');


    $ROOTER->addViews('GET', '/gestionnaire', '/views/admin/gestionnaire.php', 'ALL', [], 'TRUE', 'FALSE', 'FALSE','FALSE');

    $ROOTER->addViews('GET', '/api/GET/pre-orders', '/../controllers/api/GET/pre-orders.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/GET/orders', '/../controllers/api/GET/orders.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/GET/myOrders', '/../controllers/api/GET/myOrders.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/GET/admin/orders', '/../controllers/api/GET/admin/orders.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');

    
    $ROOTER->addViews('GET', '/api/GET/products', '/../controllers/api/GET/products.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/GET/product-details', '/../controllers/api/GET/product-details.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/GET/user-info-for-payment', '/../controllers/api/GET/user-info-for-payment.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/GET/user-infos', '/../controllers/api/GET/user-infos.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/VALIDATE/cart', '/../controllers/api/VALIDATE/cart.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    
    $ROOTER->addViews('POST', '/api/createTokenForPayment', '/../controllers/api/POST/createTokenForPayment.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');

    $ROOTER->addViews('POST', '/api/VALIDATE/user-infos-step-1', '/../controllers/api/VALIDATE/user-infos-step-1.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/VALIDATE/user-infos-step-2', '/../controllers/api/VALIDATE/user-infos-step-2.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/VALIDATE/user-infos-step-3', '/../controllers/api/VALIDATE/user-infos-step-3.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    
    $ROOTER->addViews('POST', '/api/UPDATE/user-infos', '/../controllers/api/UPDATE/user-infos.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/UPDATE/orderStatus', '/../controllers/api/UPDATE/orderStatus.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    
    $ROOTER->addViews('POST', '/api/POST/initOrder', '/../controllers/api/POST/initOrder.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/POST/addTemporaryDesign', '/../controllers/api/POST/addTemporaryDesign.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/POST/deleteTemporaryDesign', '/../controllers/api/POST/deleteTemporaryDesign.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/UPDATE/paymentStatus', '/../controllers/api/UPDATE/paymentStatus.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');

    //SUPER ADMIN
    $ROOTER->addViews('POST', '/api/superAdmin/POST/addProduct', '/../controllers/superAdmin/api/POST/addProduct.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/UPDATE/product', '/../controllers/superAdmin/api/UPDATE/product.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/DELETE/product', '/../controllers/superAdmin/api/DELETE/product.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/GET/users', '/../controllers/superAdmin/api/GET/users.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/POST/uploadColorImage', '/../controllers/superAdmin/api/POST/uploadColorImage.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/superAdmin/GET/getColorImages', '/../controllers/superAdmin/api/GET/getColorImages.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/api/superAdmin/GET/getSuppliers', '/../controllers/superAdmin/api/GET/getSuppliers.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/POST/deleteColorImage', '/../controllers/superAdmin/api/POST/deleteColorImage.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/POST/addSupplier', '/../controllers/superAdmin/api/POST/addSupplier.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/superAdmin/DUPLICATE/product', '/../controllers/superAdmin/api/DUPLICATE/product.php', 'ALL', [], 'TRUE', 'TRUE', 'FALSE','FALSE');


    // Par default
    $ROOTER->addViews('GET', '/profil', '/views/public/profile.php', 'ALL', [], 'TRUE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/creer-un-compte', '/views/public/signup.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/se-connecter', '/views/public/login.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','TRUE');
    $ROOTER->addViews('GET', '/se-deconnecter', '/views/public/logout.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('GET', '/nouveau-mot-de-passe', '/views/public/newPassword.php', 'ALL', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    
    //API
    $ROOTER->addViews('GET', '/google-merchant', '/../controllers/api/GET/googleMerchant.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');

    $ROOTER->addViews('POST', '/api/signup', '/../controllers/api/Signup.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/login', '/../controllers/api/Login.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/getUserInfo', '/../controllers/api/GetUserInfo.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/keepAlive', '/../controllers/api/KeepAlive.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/newPassword/sendTemporaryCode', '/../controllers/api/newPassword/sendTemporaryCode.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/newPassword/validateTemporaryCode', '/../controllers/api/newPassword/validateTemporaryCode.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');
    $ROOTER->addViews('POST', '/api/newPassword/updatePassword', '/../controllers/api/newPassword/updatePassword.php', 'NONE', [], 'FALSE', 'FALSE', 'FALSE','FALSE');

    // ErrorDocuments
    $ROOTER->addViews('GET', '/400', '/views/errorDocuments/400.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/401', '/views/errorDocuments/401.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/403', '/views/errorDocuments/403.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/404', '/views/errorDocuments/404.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/405', '/views/errorDocuments/405.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/500', '/views/errorDocuments/500.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');
    $ROOTER->addViews('GET', '/503', '/views/errorDocuments/503.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');



    ##$ROOTER->addViews('GET', '/test', '/../static-resources/emailTemplate/updateOrderStatusTo-4.php', 'ALL', '', 'FALSE', 'FALSE', 'FALSE', 'FALSE');




    $ROOTER->loadView();

} catch (InvalidArgumentException $e) {
    echo "<b>Argument invalide</b> : <br>" . $e->getMessage() . "\n";
    exit;
} catch (Exception $e) {
    echo "<b>Exception</b> : <br>" . $e->getMessage() . "\n";
    exit;
}



?>






