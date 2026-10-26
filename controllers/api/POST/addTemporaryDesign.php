<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__, 3) . '/static-resources/temp-designs/';
$maxSourceSize = 7 * 1024 * 1024;

function respond($status, $message, $extra = [])
{
    http_response_code($status === 'success' ? 200 : 400);
    echo json_encode(array_merge(['status' => $status, 'message' => $message], $extra));
    exit;
}

function decodeImageDataUrl($value)
{
    if (!is_string($value) || !preg_match('/^data:image\/(png|jpeg);base64,([A-Za-z0-9+\/]+={0,2})$/', $value, $matches)) {
        return false;
    }

    $decoded = base64_decode($matches[2], true);
    if ($decoded === false) {
        return false;
    }

    $isValidImage = $matches[1] === 'png'
        ? substr($decoded, 0, 8) === "\x89PNG\r\n\x1a\n"
        : substr($decoded, 0, 3) === "\xff\xd8\xff";
    if (!$isValidImage) {
        return false;
    }

    return ['data' => $decoded, 'extension' => $matches[1] === 'jpeg' ? 'jpg' : 'png'];
}

function decodePngDataUrl($value)
{
    $decoded = decodeImageDataUrl($value);
    return $decoded !== false && $decoded['extension'] === 'png' ? $decoded['data'] : false;
}

function getDesignDirectory($baseDir, $signature)
{
    if (!is_string($signature) || !preg_match('/^studio_[0-9]+$/', $signature)) {
        respond('error', 'Signature de design invalide.');
    }

    $designDir = $baseDir . $signature . DIRECTORY_SEPARATOR;
    if (!is_dir($designDir) && !mkdir($designDir, 0775, true) && !is_dir($designDir)) {
        respond('error', 'Impossible de créer le dossier du design.');
    }

    return $designDir;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond('error', 'Méthode non autorisée.');
}

if (isset($_FILES['sourceFile'])) {
    $signature = $_POST['signature'] ?? '';
    $key = $_POST['key'] ?? '';
    $upload = $_FILES['sourceFile'];

    if (!preg_match('/^(source|attachment)_[1-9][0-9]*$/', $key)) {
        respond('error', 'Identifiant de fichier invalide.');
    }

    if ($upload['error'] !== UPLOAD_ERR_OK) {
        $message = in_array($upload['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'Le fichier dépasse la limite autorisée de 7 Mo.'
            : 'Le téléversement du fichier a échoué.';
        respond('error', $message);
    }

    if ($upload['size'] <= 0 || $upload['size'] > $maxSourceSize || !is_uploaded_file($upload['tmp_name'])) {
        respond('error', 'Fichier invalide ou trop volumineux (maximum 7 Mo).');
    }

    $extension = strtolower(pathinfo($upload['name'], PATHINFO_EXTENSION));
    $mimeRules = [
        'png' => ['image/png'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'webp' => ['image/webp'],
        'gif' => ['image/gif'],
        'bmp' => ['image/bmp', 'image/x-ms-bmp'],
        'svg' => ['image/svg+xml', 'text/xml', 'application/xml', 'text/plain'],
        'ai' => ['application/postscript', 'application/pdf', 'application/illustrator', 'application/octet-stream'],
        'eps' => ['application/postscript', 'application/eps', 'text/plain', 'application/octet-stream'],
        'pdf' => ['application/pdf']
    ];

    if (!isset($mimeRules[$extension])) {
        respond('error', 'Format de fichier non pris en charge.');
    }

    $fileInfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $fileInfo->file($upload['tmp_name']);
    if ($mimeType === false || !in_array($mimeType, $mimeRules[$extension], true)) {
        respond('error', 'Le contenu du fichier ne correspond pas à son format.');
    }

    $designDir = getDesignDirectory($baseDir, $signature);
    $filename = $key . '.' . $extension;
    $destination = $designDir . $filename;
    if (!move_uploaded_file($upload['tmp_name'], $destination)) {
        respond('error', 'Impossible d’enregistrer le fichier source.');
    }

    $relativePath = 'static-resources/temp-designs/' . $signature . '/' . $filename;
    respond('success', 'Fichier source enregistré.', [
        'sourceFile' => [
            'key' => $key,
            'name' => basename($upload['name']),
            'filename' => $filename,
            'url' => $relativePath
        ]
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['signature']) || !isset($data['views']) || !is_array($data['views'])) {
    respond('error', 'Données de design invalides.');
}

$designDir = getDesignDirectory($baseDir, $data['signature']);
$responseViews = [];

foreach ($data['views'] as $viewIndex => $view) {
    if (!is_array($view) || !isset($view['logos']) || !is_array($view['logos'])) {
        respond('error', 'Données de vue invalides.');
    }

    $previewImage = decodeImageDataUrl($view['previewWithLogos'] ?? null);
    if ($previewImage !== false) {
        $previewName = 'preview_v' . ($viewIndex + 1) . '.' . $previewImage['extension'];
        if (file_put_contents($designDir . $previewName, $previewImage['data']) === false) {
            respond('error', 'Impossible d’enregistrer l’aperçu du design.');
        }
        $previewUrl = 'static-resources/temp-designs/' . $data['signature'] . '/' . $previewName;
    } else {
        $previewUrl = isset($view['viewImage']) && is_string($view['viewImage']) ? $view['viewImage'] : '';
    }

    $savedLogos = [];
    foreach ($view['logos'] as $logoIndex => $logo) {
        if (!is_array($logo)) {
            respond('error', 'Données de logo invalides.');
        }

        $logoData = decodePngDataUrl($logo['src'] ?? null);
        if ($logoData === false) {
            respond('error', 'Le logo converti en PNG est invalide.');
        }

        $logoName = 'logo_v' . ($viewIndex + 1) . '_n' . ($logoIndex + 1) . '.png';
        if (file_put_contents($designDir . $logoName, $logoData) === false) {
            respond('error', 'Impossible d’enregistrer le logo PNG.');
        }

        $savedLogo = [
            'width' => $logo['width'] ?? null,
            'height' => $logo['height'] ?? null,
            'url' => 'static-resources/temp-designs/' . $data['signature'] . '/' . $logoName
        ];
        if (isset($logo['name']) && is_string($logo['name']) && $logo['name'] !== '' && strpbrk($logo['name'], '/\\') === false) {
            $savedLogo['name'] = $logo['name'];
        }
        if (isset($logo['letter'])) {
            if (!is_string($logo['letter']) || !preg_match('/^[A-Z]+$/', $logo['letter'])) {
                respond('error', 'Lettre de logo invalide.');
            }
            $savedLogo['letter'] = $logo['letter'];
        }
        if (isset($logo['letterMarker'])) {
            if (!is_array($logo['letterMarker'])) {
                respond('error', 'Position du repère de logo invalide.');
            }
            $letterMarker = [];
            foreach (['left', 'top', 'width', 'height'] as $field) {
                if (!isset($logo['letterMarker'][$field])
                    || !is_numeric($logo['letterMarker'][$field])
                    || !is_finite((float) $logo['letterMarker'][$field])) {
                    respond('error', 'Position du repère de logo invalide.');
                }
                $letterMarker[$field] = (float) $logo['letterMarker'][$field];
            }
            if (abs($letterMarker['left']) > 2
                || abs($letterMarker['top']) > 2
                || $letterMarker['width'] <= 0
                || $letterMarker['width'] > 2
                || $letterMarker['height'] <= 0
                || $letterMarker['height'] > 2) {
                respond('error', 'Position du repère de logo invalide.');
            }
            $savedLogo['letterMarker'] = $letterMarker;
        }
        if (isset($logo['sourceKey']) && preg_match('/^source_[1-9][0-9]*$/', $logo['sourceKey'])) {
            $savedLogo['sourceKey'] = $logo['sourceKey'];
        }
        $savedLogos[] = $savedLogo;
    }

    $savedMarkers = [];
    $markers = $view['markers'] ?? [];
    if (!is_array($markers)) {
        respond('error', 'Données de repère invalides.');
    }
    foreach ($markers as $marker) {
        if (!is_array($marker)
            || !isset($marker['sourceKey'], $marker['name'], $marker['letter'], $marker['left'], $marker['top'], $marker['width'], $marker['height'])
            || !is_string($marker['sourceKey'])
            || !preg_match('/^attachment_[1-9][0-9]*$/', $marker['sourceKey'])
            || !is_string($marker['name'])
            || $marker['name'] === ''
            || strpbrk($marker['name'], '/\\') !== false
            || !is_string($marker['letter'])
            || !preg_match('/^[A-Z]+$/', $marker['letter'])) {
            respond('error', 'Données de repère invalides.');
        }

        $markerPosition = [];
        foreach (['left', 'top', 'width', 'height'] as $field) {
            if (!is_numeric($marker[$field]) || !is_finite((float) $marker[$field])) {
                respond('error', 'Position ou dimension de repère invalide.');
            }
            $markerPosition[$field] = (float) $marker[$field];
        }
        if (abs($markerPosition['left']) > 2
            || abs($markerPosition['top']) > 2
            || $markerPosition['width'] <= 0
            || $markerPosition['width'] > 2
            || $markerPosition['height'] <= 0
            || $markerPosition['height'] > 2) {
            respond('error', 'Position ou dimension de repère invalide.');
        }

        $sourceExists = false;
        foreach (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'ai', 'eps', 'pdf'] as $extension) {
            if (is_file($designDir . $marker['sourceKey'] . '.' . $extension)) {
                $sourceExists = true;
                break;
            }
        }
        if (!$sourceExists) {
            respond('error', 'Le fichier source associé au repère est introuvable.');
        }

        $savedMarkers[] = array_merge(
            ['sourceKey' => $marker['sourceKey'], 'name' => $marker['name'], 'letter' => $marker['letter']],
            $markerPosition
        );
    }

    $responseViews[] = [
        'viewImage' => isset($view['viewImage']) && is_string($view['viewImage']) ? $view['viewImage'] : '',
        'previewUrl' => $previewUrl,
        'logos' => $savedLogos,
        'markers' => $savedMarkers
    ];
}

respond('success', 'Design enregistré.', ['views' => $responseViews]);
