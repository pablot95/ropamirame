<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$uploadDir = '../../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = '';

if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $fileName = uniqid() . '_' . time() . '_' . basename($file['name']);
    $fileName = preg_replace('/[^a-zA-Z0-9._-]/', '', $fileName);
    $targetPath = $uploadDir . $fileName;

    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
         http_response_code(400);
         echo json_encode(['error' => 'Invalid file type']);
         exit;
    }

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file']);
        exit;
    }
} 
elseif (isset($_POST['imageUrl'])) {
    $url = $_POST['imageUrl'];
    
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid URL']);
        exit;
    }

    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36\r\n"
        ]
    ];
    $context = stream_context_create($options);
    
    $content = file_get_contents($url, false, $context);
    
    if ($content === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to download from URL']);
        exit;
    }

    $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH));
    $ext = isset($pathInfo['extension']) ? $pathInfo['extension'] : 'jpg';
    $ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    if(empty($ext)) $ext = 'jpg';

    $fileName = uniqid() . '_migrated.' . $ext;
    $targetPath = $uploadDir . $fileName;
    
    if (file_put_contents($targetPath, $content) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save downloaded file']);
        exit;
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'No image or imageUrl provided']);
    exit;
}

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];

$scriptDir = str_replace('\\', '/', dirname($_SERVER['PHP_SELF']));
$baseDir = dirname(dirname($scriptDir));

$path = $baseDir . '/uploads/' . $fileName;
$path = str_replace('//', '/', $path);

$fullUrl = $protocol . "://" . $host . $path;

echo json_encode(['url' => $fullUrl]);
?>
