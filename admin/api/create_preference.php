<?php
require_once 'mp_config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['items'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Datos inválidos o carrito vacío']);
    exit;
}

$accessToken = MP_ACCESS_TOKEN;

$preferenceData = [
    "items" => [],
    "payer" => [
        "name" => $data['payer']['name'] ?? 'Test',
        "surname" => $data['payer']['surname'] ?? 'User',
        "email" => $data['payer']['email'] ?? 'test_user_123456@testuser.com',
    ],
    "back_urls" => [
        "success" => "https://mirameindumentaria.com/index.html",
        "failure" => "https://mirameindumentaria.com/index.html",
        "pending" => "https://mirameindumentaria.com/index.html"
    ],
    "auto_return" => "approved",
];

foreach ($data['items'] as $item) {
    $preferenceData['items'][] = [
        "title" => $item['title'],
        "quantity" => intval($item['quantity']),
        "currency_id" => "ARS",
        "unit_price" => floatval($item['unit_price'])
    ];
}

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
    echo $response;
}
?>
