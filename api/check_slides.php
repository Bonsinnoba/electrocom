<?php
require 'db.php';
require 'security.php';
requireRole('super', $pdo);
header('Content-Type: application/json');
try {
    $slides = $pdo->query("SELECT id, title, image_url, is_active FROM slider_images")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($slides);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
