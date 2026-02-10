<?php
defined('BASEPATH') OR exit('No direct script access allowed');
 
function send_fcm_notification($fcm_token, $title, $body, $data = []) {
    
    // Path to your service account JSON file
    $serviceAccountPath = APPPATH . 'config/firebase-service-account.json';
    
    // Read service account file
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    
    // Get access token
    $accessToken = get_firebase_access_token($serviceAccount);
    
    if (!$accessToken) {
        return ['success' => false, 'error' => 'Failed to get access token'];
    }
    
    // Prepare the message
    $message = [
        'message' => [
            'token' => $fcm_token,
            'notification' => [
                'title' => $title,
                'body' => $body
            ],
            'data' => $data,
            'android' => [
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                    'channel_id' => 'order-updates'
                ]
            ],
            'apns' => [
                'payload' => [
                    'aps' => [
                        'sound' => 'default'
                    ]
                ]
            ]
        ]
    ];
    
    // Send to FCM
    $projectId = $serviceAccount['project_id'];
    $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $httpCode == 200,
        'http_code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

/**
 * Get Firebase Access Token using Service Account
 */
function get_firebase_access_token($serviceAccount) {
    
    // Create JWT Header
    $header = [
        'alg' => 'RS256',
        'typ' => 'JWT'
    ];
    
    // Create JWT Payload
    $now = time();
    $payload = [
        'iss' => $serviceAccount['client_email'],
        'sub' => $serviceAccount['client_email'],
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging'
    ];
    
    // Encode Header and Payload
    $base64Header = base64url_encode(json_encode($header));
    $base64Payload = base64url_encode(json_encode($payload));
    
    // Create Signature
    $signatureInput = $base64Header . '.' . $base64Payload;
    $privateKey = $serviceAccount['private_key'];
    
    openssl_sign($signatureInput, $signature, $privateKey, 'SHA256');
    $base64Signature = base64url_encode($signature);
    
    // Create JWT
    $jwt = $signatureInput . '.' . $base64Signature;
    
    // Exchange JWT for Access Token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);
    
    return isset($response['access_token']) ? $response['access_token'] : null;
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}


 
  
  
  
 
