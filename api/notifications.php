<?php
// backend/notifications.php
require_once 'security.php';

/**
 * Centralized Notification Service
 */
class NotificationService
{
    public $config;

    public function __construct()
    {
        $this->config = require '.env.php';
    }

    /**
     * Send Email via native mail() or SMTP if configured
     */
    public function sendEmail($to, $subject, $message)
    {
        $from = $this->config['MAIL_FROM'] ?? 'no-reply@electrocom.com';
        $headers = "From: {$from}\r\n" .
            "Reply-To: {$from}\r\n" .
            "X-Mailer: PHP/" . phpversion();

        // Check if we should use a real service or just log
        if (isset($this->config['SMTP_HOST']) && !empty($this->config['SMTP_HOST'])) {
            // Placeholder for PHPMailer or similar SMTP library logic
            logger('info', 'EMAIL_SERVICE', "SMTP configured, attempting to send to {$to}");
            return true;
        }

        // Fallback to native mail()
        $success = @mail($to, $subject, $message, $headers);

        if ($success) {
            logger('info', 'EMAIL_SERVICE', "Successfully sent email to {$to} via native mail()");
        } else {
            logger('warning', 'EMAIL_SERVICE', "Failed to send email to {$to} via native mail(). Check server configuration.");
            // Always log for debugging in dev
            logger('info', 'EMAIL_SERVICE', "SIMULATED EMAIL to {$to}: {$message}");
        }

        return $success;
    }

    /**
     * Send SMS via provider API
     */
    public function sendSMS($to, $message)
    {
        $sid = $this->config['SMS_SID'] ?? '';
        $token = $this->config['SMS_TOKEN'] ?? '';
        $from = $this->config['SMS_FROM'] ?? '';

        if (!$sid || !$token || !$from) {
            logger('warning', 'SMS_SERVICE', "SMS credentials missing in .env.php. Falling back to log.");
            logger('info', 'SMS_SERVICE', "SIMULATED SMS to {$to}: {$message}");
            return false;
        }

        // Real Twilio SMS API call
        $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
        $auth = base64_encode("$sid:$token");

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'From' => $from,
            'To' => $to,
            'Body' => $message
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Basic $auth"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            logger('info', 'SMS_SERVICE', "Successfully sent SMS to {$to} via Twilio");
            return true;
        } else {
            logger('error', 'SMS_SERVICE', "Twilio API error (Code {$httpCode}): " . $response);
            return false;
        }
    }

    /**
     * Log a notification for all administrators
     */
    public function logAdminNotification($title, $message, $type = 'info')
    {
        global $pdo;
        if (!isset($pdo)) {
            require_once 'db.php';
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) 
                                   SELECT id, ?, ?, ? FROM users WHERE role IN ('admin', 'super')");
            return $stmt->execute([$title, $message, $type]);
        } catch (Exception $e) {
            logger('error', 'SYSTEM', "Failed to log admin notification: " . $e->getMessage());
            return false;
        }
    }
}
