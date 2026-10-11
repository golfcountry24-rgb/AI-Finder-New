<?php
/**
 * AI Finder — same-origin favicon proxy.
 *
 * Why: DuckDuckGo's icon service answers 404 for sites without a favicon,
 * and every failed <img> request shows up as a red error in the browser
 * console. This proxy returns the icon when it exists and an empty
 * "204 No Content" when it doesn't — no error, the UI shows the monogram.
 *
 * Safety: GET only, fixed upstream, the domain must look like a hostname.
 */

const UPSTREAM = 'https://icons.duckduckgo.com/ip3/%s.ico';
const TIMEOUT = 8;
const TTL_FOUND = 604800;   // 7 days
const TTL_MISSING = 86400;  // 1 day

function noIcon(int $ttl): void {
    http_response_code(204);
    header('Cache-Control: public, max-age=' . $ttl);
    exit;
}

$domain = strtolower(trim((string) ($_GET['d'] ?? '')));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET'
    || strlen($domain) > 253
    || !preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $domain)) {
    noIcon(TTL_MISSING);
}

$url = sprintf(UPSTREAM, $domain);

/* tiny file cache (best effort) */
$cacheFile = null;
$dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ai-finder-icons';
if (is_dir($dir) || @mkdir($dir, 0700, true)) {
    // now and then, drop expired entries so the folder can't grow forever
    if (mt_rand(1, 200) === 1) {
        foreach (glob($dir . DIRECTORY_SEPARATOR . '*') ?: [] as $old) {
            if (time() - @filemtime($old) > TTL_FOUND) @unlink($old);
        }
    }
    $cacheFile = $dir . DIRECTORY_SEPARATOR . sha1($domain);
    if (is_file($cacheFile . '.miss') && time() - filemtime($cacheFile . '.miss') < TTL_MISSING) noIcon(TTL_MISSING);
    if (is_file($cacheFile . '.ico') && time() - filemtime($cacheFile . '.ico') < TTL_FOUND) {
        header('Content-Type: ' . (@file_get_contents($cacheFile . '.type') ?: 'image/x-icon'));
        header('Cache-Control: public, max-age=' . TTL_FOUND);
        readfile($cacheFile . '.ico');
        exit;
    }
}

$status = 0;
$body = false;
$type = 'image/x-icon';

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => TIMEOUT,
        CURLOPT_USERAGENT => 'AI-Finder/1.0 (+favicon)',
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: $type;
    curl_close($ch);
} elseif (ini_get('allow_url_fopen')) {
    $context = stream_context_create(['http' => ['timeout' => TIMEOUT, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $context);
    foreach ($http_response_header ?? [] as $line) {
        if (preg_match('/^HTTP\/\S+\s(\d{3})/', $line, $m)) $status = (int) $m[1];
        if (stripos($line, 'Content-Type:') === 0) $type = trim(substr($line, 13));
    }
}

if ($status !== 200 || $body === false || strlen($body) < 32 || stripos($type, 'image') === false) {
    if ($cacheFile) @touch($cacheFile . '.miss');
    noIcon(TTL_MISSING);
}

if ($cacheFile) {
    @file_put_contents($cacheFile . '.ico', $body, LOCK_EX);
    @file_put_contents($cacheFile . '.type', $type, LOCK_EX);
}
header('Content-Type: ' . $type);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=' . TTL_FOUND);
echo $body;
