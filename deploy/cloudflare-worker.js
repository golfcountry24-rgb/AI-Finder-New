/**
 * AI Finder — FreeSerp proxy as a Cloudflare Worker (alternative to api/freeserp.php).
 *
 * Use it when the hosting has no PHP (GitHub Pages, Netlify, Vercel, pure static FTP).
 *
 * 1. Cloudflare dashboard → Workers & Pages → Create → Worker → paste this file → Deploy.
 * 2. Copy the worker URL, e.g. https://ai-finder-proxy.<you>.workers.dev
 * 3. Build the site with:   VITE_API_BASE=https://ai-finder-proxy.<you>.workers.dev npm run build
 *    (or put VITE_API_BASE=... into a .env.production file before `npm run build`).
 *
 * Same whitelist as the PHP proxy; answers with a single, valid CORS header.
 * Also serves site icons: `?favicon=<domain>` (204 when a site has none).
 */
const UPSTREAM = 'https://freeserp.ai/api.php';
const SORTS = new Set(['relevance', 'went_live', 'dr', 'domain', 'first_seen']);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept',
};

const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });

const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

async function favicon(raw) {
  const domain = (raw || '').toLowerCase();
  const noIcon = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'public, max-age=86400', ...cors } });
  if (!HOSTNAME.test(domain)) return noIcon();
  try {
    const upstream = await fetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`, {
      cf: { cacheTtl: 604800, cacheEverything: true },
    });
    const type = upstream.headers.get('content-type') || '';
    if (!upstream.ok || !type.includes('image')) return noIcon();
    return new Response(upstream.body, {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=604800', ...cors },
    });
  } catch {
    return noIcon();
  }
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

    const input = new URL(request.url).searchParams;

    // ?favicon=<domain>: site icon, or an empty 204 when the site has none
    // (keeps the browser console free of 404 errors)
    if (input.has('favicon')) return favicon(input.get('favicon'));
    const out = new URLSearchParams({ index: 'sites', category: 'ai' });

    if (SORTS.has(input.get('sort'))) out.set('sort', input.get('sort'));
    if (['asc', 'desc'].includes(input.get('order'))) out.set('order', input.get('order'));
    const q = (input.get('q') || '').trim().slice(0, 200);
    if (q) out.set('q', q);
    const cat = (input.get('ai_categories') || '').slice(0, 80);
    if (cat) out.set('ai_categories', cat);
    if (input.get('ai_startups') === '1') out.set('ai_startups', '1');

    const size = Math.min(100, Math.max(1, parseInt(input.get('size') || '24', 10) || 24));
    const from = Math.max(0, parseInt(input.get('from') || '0', 10) || 0);
    if (from + size > 10000) return json(400, { ok: false, error: 'from + size must be <= 10000' });
    out.set('from', String(from));
    out.set('size', String(size));

    try {
      const upstream = await fetch(`${UPSTREAM}?${out}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 60, cacheEverything: true },
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
          ...cors,
        },
      });
    } catch {
      return json(502, { ok: false, error: 'FreeSerp API is unreachable' });
    }
  },
};
