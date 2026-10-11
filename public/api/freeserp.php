<?php
/**
 * AI Finder — same-origin proxy for the FreeSerp API.
 *
 * Why: FreeSerp answers with a duplicated `Access-Control-Allow-Origin: *, *`
 * header, so browsers block direct requests from other origins. This file runs
 * on any ordinary PHP hosting next to the static site and forwards requests
 * server-side (no CORS involved, because the browser calls its own domain).
 *
 * Safety: GET only, fixed upstream URL, whitelisted parameters only,
 * index/category are forced to sites/ai (see _lib.php). It cannot be used as an
 * open proxy. No API key or secret is needed or stored.
 */

require __DIR__ . '/_lib.php';

/* Same contract as deploy/cloudflare-worker.js: `?favicon=<domain>` serves a
   site icon, so a static copy hosted elsewhere (e.g. GitHub Pages) can point
   VITE_API_BASE at this single file. */
if (isset($_GET['favicon'])) {
    $_GET['d'] = (string) $_GET['favicon'];
    require __DIR__ . '/favicon.php';
    exit;
}

/* Public, read-only data with whitelisted parameters: any origin may read it.
   This lets the static GitHub Pages build use this proxy cross-origin. */
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    fail(405, 'Method not allowed');
}
if (!function_exists('curl_init') && !ini_get('allow_url_fopen')) {
    fail(500, 'The server has neither cURL nor allow_url_fopen enabled');
}

$params = af_clean_params($_GET);
if ($params['from'] + $params['size'] > 10000) fail(400, 'from + size must be <= 10000');

[$status, $body, $hit] = af_fetch($params);
if ($status === 0) fail(502, 'FreeSerp API is unreachable');

if ($hit) header('X-Proxy-Cache: HIT');
http_response_code($status);
if ($status === 200) header('Cache-Control: public, max-age=' . FREESERP_CACHE_TTL);
echo $body;
