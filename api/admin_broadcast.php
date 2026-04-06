<?php
require 'cors_middleware.php';
require 'db.php';
require 'security.php';

header('Content-Type: application/json');

// Authenticate and check for admin roles
try {
    $userId = authenticate();
    $role = getUserRole($userId, $pdo);
    $userName = getUserName($userId, $pdo);
    
    // Require super or marketing/admin role
    requireRole(['super', 'admin', 'marketing'], $pdo);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $content = trim(file_get_contents("php://input"));
    $decoded = json_decode($content, true);
    
    $type = $decoded['type'] ?? 'email'; // 'email', 'sms', or 'both'
    $target = $decoded['target'] ?? 'all'; // 'all', 'verified', 'standard'
    $title = sanitizeInput($decoded['title'] ?? '');
    $message = sanitizeInput($decoded['message'] ?? '');
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Message content is required']);
        exit;
    }

    try {
        // Fetch targets based on selection
        $query = "SELECT email, phone, name, email_notif, sms_tracking FROM users WHERE role = 'customer'";
        if ($target === 'verified') {
            $query .= " AND is_verified = 1";
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        require_once 'notifications.php';
        $notifier = new NotificationService();
        
        $emailCount = 0;
        $smsCount = 0;
        
        foreach ($users as $user) {
            // Send Email if applicable
            if (($type === 'email' || $type === 'both') && !empty($user['email'])) {
                // We honor the general email preference for marketing broadcasts
                if ($user['email_notif']) {
                    $notifier->queueNotification('email', $user['email'], $message, $title);
                    $emailCount++;
                }
            }
            
            // Send SMS if applicable
            if (($type === 'sms' || $type === 'both') && !empty($user['phone'])) {
                // For SMS, we check either sms_tracking or a general push preference 
                // Since this is a promo, we check if they have any notifications on
                if ($user['sms_tracking']) {
                    $notifier->queueNotification('sms', $user['phone'], $message);
                    $smsCount++;
                }
            }
        }
        
        logger('info', 'BROADCAST', "Mass broadcast sent by {$userName}. Type: {$type}, Target: {$target}. Emails: {$emailCount}, SMS: {$smsCount}");
        
        echo json_encode([
            'success' => true, 
            'message' => 'Broadcast sent successfully',
            'stats' => [
                'emails' => $emailCount,
                'sms' => $smsCount,
                'total_reached' => count($users)
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
