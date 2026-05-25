<?php
/**
 * PHP-прокси к FastAPI (Uvicorn) на shared-хостинге REG.RU.
 * Nginx не пускает /api на Python, но .php-файлы обрабатывает Apache.
 *
 * Положите в корень сайта (рядом с index.html).
 * Фронт: VITE_API_BASE=/api.php  →  запрос /api/health идёт на /api.php/api/health
 */
declare(strict_types=1);

$backend = 'http://127.0.0.1:8000';

$uri = $_SERVER['REQUEST_URI'] ?? '/';
$prefix = '/api.php';

if (str_starts_with($uri, $prefix)) {
    $path = substr($uri, strlen($prefix));
    if ($path === '' || $path === false) {
        $path = '/';
    }
} else {
    $path = $uri;
}

$target = $backend . $path;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = file_get_contents('php://input');

$forward = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $lower = strtolower((string) $name);
        if (in_array($lower, ['host', 'connection', 'content-length', 'accept-encoding'], true)) {
            continue;
        }
        $forward[] = $name . ': ' . $value;
    }
}

$ch = curl_init($target);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $forward,
    CURLOPT_POSTFIELDS => in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) ? $body : null,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CONNECTTIMEOUT => 10,
]);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'detail' => 'Python API на :8000 недоступен. Запустите Uvicorn на сервере (Shell-клиент).',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

http_response_code($code);

foreach (explode("\r\n", $rawHeaders) as $line) {
    if ($line === '' || str_starts_with($line, 'HTTP/')) {
        continue;
    }
    $colon = strpos($line, ':');
    if ($colon === false) {
        continue;
    }
    $name = strtolower(trim(substr($line, 0, $colon)));
    if (in_array($name, ['transfer-encoding', 'content-length'], true)) {
        continue;
    }
    header(trim($line), $name !== 'set-cookie');
}

echo $responseBody;
