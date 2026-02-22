<?php
require_once 'api/db.php';
$branches = [
    ['name' => 'Accra Branch', 'code' => 'ACC-01', 'address' => 'Spintex Road, Accra'],
    ['name' => 'Kumasi Branch', 'code' => 'KMS-01', 'address' => 'Adum, Kumasi'],
    ['name' => 'Wa Branch', 'code' => 'WA-01', 'address' => 'Main Market, Wa']
];

foreach ($branches as $b) {
    $stmt = $pdo->prepare("SELECT id FROM store_branches WHERE branch_code = ? OR name = ?");
    $stmt->execute([$b['code'], $b['name']]);
    $existing = $stmt->fetch();

    if (!$existing) {
        $stmt = $pdo->prepare("INSERT INTO store_branches (name, branch_code, address) VALUES (?, ?, ?)");
        $stmt->execute([$b['name'], $b['code'], $b['address']]);
        echo "Created branch: {$b['name']} ({$b['code']})\n";
    } else {
        // Update existing to ensure they have the code
        $stmt = $pdo->prepare("UPDATE store_branches SET branch_code = ?, address = ? WHERE id = ?");
        $stmt->execute([$b['code'], $b['address'], $existing['id']]);
        echo "Updated existing branch: {$b['name']} to code {$b['code']}\n";
    }
}
echo "Branch seeding complete.\n";
// unlink(__FILE__); // Keep it for a second to verify
