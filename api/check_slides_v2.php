<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
try {
    $slides = $pdo->query("SELECT id, title, image_url, is_active FROM slider_images")->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents('debug_slides.txt', print_r($slides, true));
} catch (Exception $e) {
    file_put_contents('debug_slides.txt', $e->getMessage());
}
