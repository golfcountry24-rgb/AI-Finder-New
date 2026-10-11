<?php
/**
 * AI Finder — /site/<domain>, rendered on the server.
 *
 * .htaccess / nginx send /site/<domain> here. The page is the built site.html
 * (the normal app) with two things filled in before it leaves the server:
 *  - the <head> tags between <!--seo:start--> and <!--seo:end-->: the site's own
 *    title, description, canonical URL, Open Graph and JSON-LD;
 *  - a plain HTML profile inside <div id="root">, so search engines and link
 *    previews see the content without running JavaScript. The app replaces it on load.
 * Unknown domains get a real 404 with noindex. If FreeSerp can't be reached the
 * shell is served unchanged and the app loads the data itself.
 */

require __DIR__ . '/api/_lib.php';

const SITE_NAME = 'AI Finder';

function h(?string $s): string {
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function clip(?string $text, int $max = 160): string {
    $text = trim(preg_replace('/\s+/u', ' ', (string) $text));
    if (mb_strlen($text) <= $max) return $text;
    $cut = mb_substr($text, 0, $max - 1);
    $space = mb_strrpos($cut, ' ');
    return ($space !== false && $space > 80 ? mb_substr($cut, 0, $space) : $cut) . '…';
}

function format_date(?string $value): ?string {
    if (!$value || !preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) return null;
    return gmdate('j M Y', strtotime(substr($value, 0, 10) . ' 00:00:00 UTC'));
}

$template = @file_get_contents(__DIR__ . '/site.html');
if ($template === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    exit('site.html is missing: upload the whole dist/ folder.');
}

$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$origin = ($https ? 'https' : 'http') . '://' . preg_replace('/[^a-z0-9.:\-\[\]]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$home = $origin . $base;

$domain = af_clean_domain((string) ($_GET['d'] ?? ''));
$site = null;
$reached = false;

if ($domain !== null) {
    $bare = preg_replace('/^www\./', '', $domain);
    [$status, $body] = af_fetch(af_clean_params(['q' => $bare, 'sort' => 'relevance', 'size' => 10]));
    $json = $status === 200 ? json_decode((string) $body, true) : null;
    if (is_array($json) && isset($json['results']) && is_array($json['results'])) {
        $reached = true;
        foreach ($json['results'] as $row) {
            $d = strtolower((string) ($row['domain'] ?? ''));
            if ($d === $domain || preg_replace('/^www\./', '', $d) === $bare) {
                $site = $row;
                break;
            }
        }
    }
}

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// FreeSerp unreachable: the plain shell, the app will try again in the browser
if ($domain !== null && !$reached) {
    header('Cache-Control: no-store');
    echo $template;
    exit;
}

$notFound = $site === null;
$name = $notFound ? ($domain ?? 'Unknown site') : af_display_name($site);
$url = $notFound ? null : $home . 'site/' . $site['domain'];
$categories = $notFound ? [] : array_values(array_filter((array) ($site['ai_categories'] ?? []), 'is_string'));
$summary = $notFound ? '' : trim((string) ($site['ai_summary'] ?? ''));

if ($notFound) {
    $title = 'Site not found · ' . SITE_NAME;
    $description = 'This domain is not in the AI Finder index.';
} else {
    $title = $name . ' (' . $site['domain'] . ') · ' . SITE_NAME;
    $description = clip($summary) ?: $name . ': summary, AI categories, Domain Rating and launch date in the AI Finder catalogue.';
}

/* ---- <head> ---- */
$image = $home . 'og-image.png';
$graph = [[
    '@type' => 'WebSite',
    '@id' => $home . '#website',
    'url' => $home,
    'name' => SITE_NAME,
]];
if (!$notFound) {
    $graph[] = [
        '@type' => 'WebPage',
        '@id' => $url . '#webpage',
        'url' => $url,
        'name' => $title,
        'description' => $description,
        'isPartOf' => ['@id' => $home . '#website'],
        'inLanguage' => 'en',
        'about' => ['@type' => 'WebSite', 'name' => $name, 'url' => (string) ($site['url'] ?? 'https://' . $site['domain'])],
    ];
}
$ld = json_encode(['@context' => 'https://schema.org', '@graph' => $graph], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG);

$head = [
    '<title>' . h($title) . '</title>',
    '<meta name="description" content="' . h($description) . '" />',
    '<meta name="robots" content="' . ($notFound ? 'noindex, follow' : 'index, follow, max-image-preview:large') . '" />',
    $url ? '<link rel="canonical" href="' . h($url) . '" />' : null,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="' . SITE_NAME . '" />',
    '<meta property="og:title" content="' . h($title) . '" />',
    '<meta property="og:description" content="' . h($description) . '" />',
    $url ? '<meta property="og:url" content="' . h($url) . '" />' : null,
    '<meta property="og:locale" content="en_GB" />',
    '<meta property="og:image" content="' . h($image) . '" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="' . h($title) . '" />',
    '<meta name="twitter:description" content="' . h($description) . '" />',
    '<meta name="twitter:image" content="' . h($image) . '" />',
    '<script type="application/ld+json" id="ld-json">' . $ld . '</script>',
];
$headHtml = implode("\n    ", array_filter($head));

/* ---- plain profile for crawlers (hidden for visitors with JavaScript, replaced by the app) ---- */
if ($notFound) {
    $body = '<div class="prerender"><h1>' . h($name) . ' is not in the AI index</h1>'
        . '<p>FreeSerp has not indexed this domain as an AI website.</p>'
        . '<p><a href="' . h($base) . '">Search the catalogue</a></p></div>';
} else {
    $facts = [];
    if (isset($site['dr']) && is_numeric($site['dr'])) $facts[] = ['Domain Rating', (string) $site['dr']];
    if ($d = format_date($site['went_live'] ?? null)) $facts[] = ['Went live', $d];
    if ($d = format_date($site['first_seen'] ?? null)) $facts[] = ['First seen', $d];
    if (!empty($site['webserver'])) $facts[] = ['Web server', (string) $site['webserver']];
    $dl = '';
    foreach ($facts as [$k, $v]) $dl .= '<dt>' . h($k) . '</dt><dd>' . h($v) . '</dd>';
    $cats = '';
    foreach ($categories as $c) $cats .= '<li>' . h($c) . '</li>';
    $visit = !empty($site['url']) && preg_match('#^https?://#i', (string) $site['url']) ? (string) $site['url'] : 'https://' . $site['domain'];

    $body = '<article class="prerender">'
        . '<nav><a href="' . h($base) . '">' . SITE_NAME . '</a> / ' . h($site['domain']) . '</nav>'
        . '<h1>' . h($name) . '</h1>'
        . '<p>' . h($summary !== '' ? $summary : 'No description available for this site.') . '</p>'
        . ($cats !== '' ? '<h2>AI categories</h2><ul>' . $cats . '</ul>' : '')
        . ($dl !== '' ? '<dl>' . $dl . '</dl>' : '')
        . '<p><a href="' . h($visit) . '" rel="noopener">Visit ' . h($site['domain']) . '</a></p>'
        . '</article>';
}

$html = preg_replace('/<!--seo:start-->.*?<!--seo:end-->/s', '<!--seo:start-->' . "\n    " . str_replace(['\\', '$'], ['\\\\', '\\$'], $headHtml) . "\n    " . '<!--seo:end-->', $template, 1);
$html = str_replace('<div id="root"></div>', '<div id="root">' . $body . '</div>', $html);

http_response_code($notFound ? 404 : 200);
header('Cache-Control: public, max-age=' . ($notFound ? 300 : 3600));
echo $html;
