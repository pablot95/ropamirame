<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No URL provided']);
    exit;
}

$url = $data['url'];
// Extraer nombre de archivo de la URL
$fileName = basename($url);

// Prevenir borrado de archivos fuera de uploads (Directory Traversal)
if (!preg_match('/^[a-zA-Z0-9._-]+$/', $fileName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid filename']);
    exit;
}

$filePath = '../../uploads/' . $fileName;

if (file_exists($filePath)) {
    if (unlink($filePath)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete file']);
    }
} else {
    // Si no existe, consideramos que ya fue borrado.
    echo json_encode(['success' => true, 'message' => 'File not found, assumed deleted']);
}
?>