/**
 * Build-time pre-rendering (used by vite.config.js, runs in Node).
 *
 * Search engines that don't run JavaScript used to see only the <head> of the
 * catalogue pages. At build time the current lists are fetched from FreeSerp once
 * and written into <div id="root"> of index.html and new.html as plain HTML
 * (names, summaries, categories, links to /site/<domain>). Visitors with JavaScript
 * never see it: an inline script marks <html class="js"> and the app replaces it.
 *
 * It's a snapshot of the build day. If the API can't be reached the build carries on
 * without it (the pages work exactly as before).
 */
import { getDisplayName } from '../utils/format.js';

export const PRERENDER_LISTS = {
  'index.html': { sort: 'dr', order: 'desc', size: 24 },
  'new.html': { sort: 'went_live', order: 'desc', ai_startups: 1, size: 30 },
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateFmt.format(date) : null;
};

/** One page of the AI sites index, reduced to what the static HTML needs. */
export async function fetchList(api, params, timeoutMs = 12_000) {
  const query = new URLSearchParams({ index: 'sites', category: 'ai', from: '0' });
  Object.entries(params).forEach(([k, v]) => query.set(k, String(v)));
  const response = await fetch(`${api}?${query}`, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: 'application/json', 'User-Agent': 'AI-Finder build (+prerender)' },
  });
  if (!response.ok) throw new Error(`FreeSerp answered ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json?.results)) throw new Error('unexpected FreeSerp response');
  return {
    total: Number(json.total) || 0,
    sites: json.results
      .filter((r) => typeof r.domain === 'string' && r.domain)
      .map((r) => ({
        domain: r.domain.toLowerCase(),
        title: typeof r.title === 'string' ? r.title.trim() : null,
        summary: typeof r.ai_summary === 'string' ? r.ai_summary.trim() : null,
        categories: Array.isArray(r.ai_categories) ? r.ai_categories.filter((c) => typeof c === 'string') : [],
        dr: typeof r.dr === 'number' ? r.dr : null,
        wentLive: r.went_live ?? null,
      })),
  };
}

/** Plain, valid HTML for <div id="root">: heading, intro, navigation and the list. */
export function renderList({ heading, intro, list, base }) {
  const href = (path) => esc(`${base}${path.replace(/^\//, '')}`);
  const items = list.sites
    .map((site) => {
      const meta = [
        site.categories.length ? site.categories.join(', ') : null,
        site.dr !== null ? `Domain Rating ${site.dr}` : null,
        formatDate(site.wentLive) ? `went live ${formatDate(site.wentLive)}` : null,
      ].filter(Boolean);
      return (
        `<li><article><h2><a href="${href(`/site/${site.domain}`)}">${esc(getDisplayName(site))}</a></h2>` +
        `<p>${esc(site.summary ?? 'No description available for this site.')}</p>` +
        (meta.length ? `<p>${esc(meta.join(' · '))}</p>` : '') +
        `</article></li>`
      );
    })
    .join('');
  return (
    `<div class="prerender"><header><h1>${esc(heading)}</h1><p>${esc(intro)}</p>` +
    `<nav><a href="${href('/')}">Explore</a> · <a href="${href('/new')}">New AI</a> · <a href="${href('/about')}">About</a></nav>` +
    `</header>` +
    (list.total ? `<p>${esc(list.total.toLocaleString('en-GB'))} AI websites in the index.</p>` : '') +
    `<ol>${items}</ol></div>`
  );
}
