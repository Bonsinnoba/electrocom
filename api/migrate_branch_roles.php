require 'db.php';
require 'security.php';
requireRole('super', $pdo);

try {
// 1. Update the role ENUM
// Note: In MySQL, we need to redefine the column
$pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'admin', 'super', 'branch_admin', 'accountant', 'marketing') DEFAULT 'customer'");
echo "Roles updated successfully.<br>";

// 2. Add branch_id column
// Check if column exists first
$columns = $pdo->query("SHOW COLUMNS FROM users LIKE 'branch_id'")->fetchAll();
if (empty($columns)) {
$pdo->exec("ALTER TABLE users ADD COLUMN branch_id INT DEFAULT NULL");
$pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES store_branches(id) ON DELETE SET NULL");
echo "branch_id column added successfully.<br>";
} else {
echo "branch_id column already exists.<br>";
}
} catch (PDOException $e) {
echo "Migration failed: " . $e->getMessage();
}