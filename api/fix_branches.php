<?php
require_once 'db.php';
$branches = [
    ['Accra Branch', 'Spintex Road, Accra'],
    ['Kumasi Branch', 'Adum, Kumasi'],
    ['Wa Branch', 'Main Market, Wa']
];

foreach ($branches as $b) {
    $stmt = $pdo->prepare("SELECT id FROM store_branches WHERE name = ?");
    $stmt->execute([$b[0]]);
    if (!$stmt->fetchColumn()) {
        $stmt = $pdo->prepare("INSERT INTO store_branches (name, address) VALUES (?, ?)");
        $stmt->execute($b);
        echo "Created branch: {$b[0]}\n";
    } else {
        echo "Branch already exists: {$b[0]}\n";
    }
}
unlink(__FILE__);
