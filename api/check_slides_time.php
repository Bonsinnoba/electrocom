<?php
require 'db.php';
try {
    $slides = $pdo->query("SELECT id, title, created_at FROM slider_images")->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('debug_slides_time.txt', print_r($slides, true));
} catch (Exception $e) {
    file_put_contents('debug_slides_time.txt', $e->getMessage());
}
