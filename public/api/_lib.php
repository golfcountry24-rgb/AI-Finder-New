<?php
/**
 * AI Finder — shared server code for the FreeSerp proxy (api/freeserp.php) and the
 * server-rendered site profile (site.php): one fixed upstream, whitelisted
 * parameters, a small file cache. Nothing here runs when the file is requested directly.
 */

if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(404);
    exit;
}

/* The upstream can be overridden only from the server environment (tests), never from a request. */
define('FREESERP_UPSTREAM', getenv('FREESERP_UPSTREAM') ?: 'https://freeserp.ai/api.php');
const FREESERP_TIMEOUT = 15;   // seconds
const FREESERP_CACHE_TTL = 60; // seconds; 0 disables the small file cache

/** Length limit that works with or without the mbstring extension. */
function af_cut(string $value, int $length): string {
    return function_exists('mb_substr') ? mb_substr($value, 0, $length, 'UTF-8') : substr($value, 0, $length);
}

/**
 * Whitelisted query for the sites index. index/category are always sites/ai, so
 * the proxy can't be used to read anything else.
 */
function af_clean_params(array $in): array {
    $params = ['index' => 'sites', 'category' => 'ai'];

    $sorts = ['relevance', 'went_live', 'dr', 'domain', 'first_seen'];
    if (isset($in['sort']) && in_array($in['sort'], $sorts, true)) $params['sort'] = $in['sort'];
    if (isset($in['order']) && in_array($in['order'], ['asc', 'desc'], true)) $params['order'] = $in['order'];

    if (isset($in['q']) && is_string($in['q'])) {
        $q = trim(af_cut($in['q'], 200));
        if ($q !== '') $params['q'] = $q;
    }
    if (isset($in['ai_categories']) && is_string($in['ai_categories']) && $in['ai_categories'] !== '') {
        $params['ai_categories'] = af_cut($in['ai_categories'], 80);
    }
    if (isset($in['ai_startups']) && (string) $in['ai_startups'] === '1') $params['ai_startups'] = '1';

    $params['size'] = isset($in['size']) ? max(1, min(100, (int) $in['size'])) : 24;
    $params['from'] = isset($in['from']) ? max(0, (int) $in['from']) : 0;
    return $params;
}

/**
 * GET the upstream with a cleaned query. Returns [status, body, cacheHit];
 * status 0 means the API could not be reached at all.
 */
function af_fetch(array $params): array {
    $url = FREESERP_UPSTREAM . '?' . http_build_query($params);

    $cacheFile = null;
    if (FREESERP_CACHE_TTL > 0) {
        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ai-finder-cache';
        if (is_dir($dir) || @mkdir($dir, 0700, true)) {
            // now and then, drop entries older than an hour so the folder can't grow forever
            if (mt_rand(1, 50) === 1) {
                foreach (glob($dir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $old) {
                    if (time() - @filemtime($old) > 3600) @unlink($old);
                }
            }
            $cacheFile = $dir . DIRECTORY_SEPARATOR . sha1($url) . '.json';
            if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < FREESERP_CACHE_TTL) {
                $cached = @file_get_contents($cacheFile);
                if ($cached !== false) return [200, $cached, true];
            }
        }
    }

    $status = 0;
    $body = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => FREESERP_TIMEOUT,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_USERAGENT => 'AI-Finder/1.0 (+proxy)',
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } elseif (ini_get('allow_url_fopen')) {
        $context = stream_context_create(['http' => [
            'method' => 'GET',
            'timeout' => FREESERP_TIMEOUT,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\nUser-Agent: AI-Finder/1.0 (+proxy)\r\n",
        ]]);
        $body = @file_get_contents($url, false, $context);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
    } else {
        return [0, false, false];
    }

    if ($body === false) return [0, false, false];
    if ($status === 200 && $cacheFile) @file_put_contents($cacheFile, $body, LOCK_EX);
    return [$status, $body, false];
}

/** "HTTPS://www.Example.com/x" → "www.example.com"; null when it isn't a hostname. */
function af_clean_domain(string $raw): ?string {
    $host = strtolower(trim($raw));
    $host = preg_replace('#^[a-z]+://#', '', $host);
    $host = preg_split('#[/?\#]#', $host)[0];
    $host = rtrim($host, '.');
    return preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/', $host) ? $host : null;
}

/** Same rule as getDisplayName() in src/utils/format.js. */
function af_display_name(array $site): string {
    $domain = (string) ($site['domain'] ?? '');
    $title = trim((string) ($site['title'] ?? ''));
    if ($title === '') return $domain !== '' ? $domain : '—';
    $parts = array_values(array_filter(
        array_map('trim', preg_split('/\s+[|–—·:-]\s+/u', $title)),
        fn ($p) => mb_strlen($p) >= 2 && mb_strlen($p) <= 48
    ));
    if (!$parts) return $domain !== '' ? $domain : $title;
    $stem = preg_replace('/[^a-z0-9]/', '', explode('.', preg_replace('/^www\./', '', strtolower($domain)))[0]);
    if (strlen($stem) >= 3) {
        $matches = array_filter($parts, fn ($p) => str_contains(preg_replace('/[^a-z0-9]/', '', strtolower($p)), $stem));
        if ($matches) {
            usort($matches, fn ($a, $b) => mb_strlen($a) <=> mb_strlen($b));
            return $matches[0];
        }
    }
    return $parts[0];
}
