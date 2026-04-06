<?php
// backend/notifications.php
require_once 'security.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Centralized Notification Service
 */
class NotificationService
{
    public $config;

    public function __construct()
    {
        $this->config = require 'config.php';
    }

    public function queueNotification($type, $recipient, $message, $subject = null, $payload = [])
    {
        global $pdo;
        if (!isset($pdo)) {
            require_once 'db.php';
        }

        // If in development mode, we revert to synchronous sending for easier debugging.
        if (($this->config['APP_ENV'] ?? 'production') === 'development') {
            logger('info', 'NOTIF_SYNC', "Dev Mode: Sending $type immediately for $recipient");
            if ($type === 'email') {
                return $this->sendEmail($recipient, $subject, $message);
            } elseif ($type === 'sms') {
                return $this->sendSMS($recipient, $message);
            }
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO notification_queue (type, recipient, subject, message, payload) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $type, 
                $recipient, 
                $subject, 
                $message, 
                !empty($payload) ? json_encode($payload) : null
            ]);
            logger('info', 'NOTIF_QUEUE', "Queued $type for $recipient: " . substr($message, 0, 50) . "...");
            return true;
        } catch (Exception $e) {
            logger('error', 'NOTIF_QUEUE', "Failed to queue notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send Email via PHPMailer with SMTP support
     */
    public function sendEmail($to, $subject, $message, $altBody = '')
    {
        $mail = new PHPMailer(true);

        try {
            // Check if we should use SMTP
            if (isset($this->config['SMTP_HOST']) && !empty($this->config['SMTP_HOST'])) {
                $mail->isSMTP();
                $mail->Host       = $this->config['SMTP_HOST'];
                $mail->SMTPAuth   = true;
                $mail->Username   = $this->config['SMTP_USER'] ?? '';
                $mail->Password   = $this->config['SMTP_PASS'] ?? '';
                $mail->SMTPSecure = $this->config['SMTP_ENCRYPTION'] ?? PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = $this->config['SMTP_PORT'] ?? 587;
                logger('info', 'EMAIL_SERVICE', "SMTP configured, attempting to send to {$to}");
            } else {
                // Fallback to native mail() function via PHPMailer
                $mail->isMail();
                logger('info', 'EMAIL_SERVICE', "SMTP not configured, falling back to native mail() for {$to}");
            }

            // Recipients
            $from = $this->config['MAIL_FROM'] ?? 'no-reply@electrocom.com';
            $mail->setFrom($from, 'ElectroCom');
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $message;
            $mail->AltBody = $altBody ?: strip_tags($message);

            $mail->send();
            logger('info', 'EMAIL_SERVICE', "Successfully sent email to {$to}");
            return true;
        } catch (Exception $e) {
            logger('error', 'EMAIL_SERVICE', "Failed to send email to {$to}: " . $mail->ErrorInfo);
            
            // In development, we might want to log the simulated email even on failure
            if ($this->config['APP_ENV'] === 'development') {
                logger('info', 'EMAIL_SERVICE', "SIMULATED EMAIL (Fell back due to error) to {$to}: {$message}");
            }
            return false;
        }
    }

    /**
     * Send SMS via Hubtel API
     */
    public function sendSMS($to, $message)
    {
        $clientId = $this->config['SMS_CLIENT_ID'] ?? '';
        $clientSecret = $this->config['SMS_CLIENT_SECRET'] ?? '';
        $from = $this->config['SMS_FROM'] ?? 'ElectroCom';

        if (!$clientId || !$clientSecret) {
            logger('warning', 'SMS_SERVICE', "Hubtel credentials missing in .env.php. Falling back to log.");
            logger('info', 'SMS_SERVICE', "SIMULATED SMS to {$to}: {$message}");
            return false;
        }

        // Hubtel SMS API call (V1)
        $url = $this->config['SMS_API_URL'] ?? "https://smsc.hubtel.com/v1/messages/send";
        $auth = base64_encode("$clientId:$clientSecret");

        $postData = [
            'From' => $from,
            'To' => $to,
            'Content' => $message,
            'Type' => 0 // 0 for Quick Message
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Basic $auth",
            "Content-Type: application/json"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            logger('info', 'SMS_SERVICE', "Successfully sent SMS to {$to} via Hubtel");
            return true;
        } else {
            logger('error', 'SMS_SERVICE', "Hubtel API error (Code {$httpCode}): " . $response);
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
