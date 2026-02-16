<?php
// Cargar configuración de MercadoPago
require_once 'mp_config.php';

// Habilitar CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Obtener el cuerpo de la petición POST
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos o carrito vacío']);
    exit;
}

// Access Token de MercadoPago desde configuración
$accessToken = MP_ACCESS_TOKEN;

// Construir la preferencia de pago
$preferenceData = [
    "items" => [],
    "payer" => [
        "name" => $data['payer']['name'] ?? 'Test',
        "surname" => $data['payer']['surname'] ?? 'User',
        "email" => $data['payer']['email'] ?? 'test_user_123456@testuser.com',
        // Agregar otros campos si es necesario
    ],
    "back_urls" => [
        "success" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html", // Ajustar url
        "failure" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html",
        "pending" => "http://" . $_SERVER['HTTP_HOST'] . "/index.html"
    ],
    "auto_return" => "approved",
];

foreach ($data['items'] as $item) {
    $preferenceData['items'][] = [
        "title" => $item['title'],
        "quantity" => intval($item['quantity']),
        "currency_id" => "ARS", // Moneda Argentina
        "unit_price" => floatval($item['unit_price'])
    ];
}

// Llamada a la API de MercadoPago usando cURL
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.mercadopago.com/checkout/preferences",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => json_encode($preferenceData),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . $accessToken,
        "Content-Type: application/json"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    http_response_code(500);
    echo json_encode(['error' => "cURL Error: " . $err]);
} else {
    // Retornamos la respuesta de MercadoPago (contiene el ID de preferencia)
    echo $response;
}
?>