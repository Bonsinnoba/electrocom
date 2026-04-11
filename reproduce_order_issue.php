<?php
// reproduce_order_issue.php
// This script simulates a POST request to orders.php to see the raw output and capture any hidden warnings.

$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy_token_replace_me'; // I'll need a valid token for UID 4
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

// We need a dummy config and pdo if we want to run it isolated, 
// but it's better to just use curl against the local dev server.

$token = "REPLACE_WITH_ACTUAL_TOKEN"; 

$ch = curl_init("http://localhost:8000/orders.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $token,
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'items' => [['id' => 1, 'quantity' => 1, 'price' => 100]],
    'total_amount' => 110.00, // 100 + 10 VAT
    'shipping_address' => 'Test Address',
    'payment_method' => 'card'
]));

$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "HTTP Code: " . $info['http_code'] . "\n";
echo "Response Body:\n";
echo $response;
?>
