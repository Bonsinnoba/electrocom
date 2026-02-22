<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
require 'db.php';
echo "<h1>Welcome to my Shop</h1>";

$stmt = $pdo->query("SELECT * FROM products");
while ($row = $stmt->fetch()) {
    echo $row['name'] . " - $" . $row['price'] . "<br>";
}
