<?php
// Root router for Herd - handles API requests and serves static files

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove query string for clean routing
$path = strtok($path, '?');

// Handle API requests
if (strpos($path, '/api/') === 0) {
    // Include the API router
    require_once __DIR__ . '/../api/index.php';
    exit;
}

// Handle service worker
if ($path === '/sw.js') {
    header('Content-Type: application/javascript');
    readfile(__DIR__ . '/../sw.js');
    exit;
}

// Handle manifest
if ($path === '/manifest.json') {
    header('Content-Type: application/json');
    readfile(__DIR__ . '/manifest.json');
    exit;
}

// Handle static files in public directory
if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$/', $path)) {
    $filePath = __DIR__ . $path;
    if (file_exists($filePath)) {
        $mimeType = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'webp' => 'image/webp'
        ];
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        if (isset($mimeType[$ext])) {
            header('Content-Type: ' . $mimeType[$ext]);
        }
        readfile($filePath);
        exit;
    }
}

// Serve main application (default route)
if ($path === '/' || $path === '/index.html') {
    readfile(__DIR__ . '/index.html');
    exit;
}

// Serve reports page
if ($path === '/reports' || $path === '/reports.html') {
    readfile(__DIR__ . '/reports.html');
    exit;
}

// 404 for everything else
http_response_code(404);
echo "404 - Side ikke fundet";