<?php
require 'api/db.php';
$stmt = $pdo->query('SELECT user_id, COUNT(*) as cnt, MIN(created_at) as oldest, MAX(expires_at) as latest, SUM(is_revoked) as revoked FROM refresh_tokens GROUP BY user_id');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
