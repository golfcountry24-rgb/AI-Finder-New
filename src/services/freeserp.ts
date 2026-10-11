/**
 * FreeSerp API service.
 * Docs: https://freeserp.ai/docs.php
 *
 * All requests go to the "FreeSerp Main" index (index=sites) — homepage
 * profiles of live websites — restricted to the AI niche (category=ai).
 *
 * Why a proxy: the docs describe the API as CORS-open, but in practice it answers
 * with a duplicated header `Access-Control-Allow-Origin: *, *`, which browsers
 * reject. So the app never calls freeserp.ai directly from the browser:
 *
 *  - default: the same-origin PHP proxy `api/freeserp.php` (shipped in /public,
 *    so it lands in dist/ and works on any ordinary PHP/FTP hosting);
 *  - `npm run dev` / `npm run preview`: Vite proxies the same path (vite.config.js);
 *  - hosting without PHP: deploy deploy/cloudflare-worker.js and build with
 *    VITE_API_BASE=<worker url>.
 *
 * The default path starts at the site base (BASE_URL), so it works on every page
 * (/new, /about) and from a sub-folder build (VITE_BASE).
 */
import type { ApiErrorCode, ApiResponse, ApiSite, MaybeSite, SearchOptions, SearchResult, Site } from '../types/api';

export const API_BASE: string = import.meta.env.VITE_API_BASE || `${import.meta.env.BASE_URL}api/freeserp.php`;

/** Hard limit of the sites index: from + size must be <= 10 000. */
export const MAX_OFFSET = 10000;

/** Small in-memory cache so navigating back and forth doesn't refetch. */
const cache = new Map<string, { time: number; data: SearchResult }>();
const CACHE_TTL = 60_000;
const CACHE_MAX = 60; // entries; the oldest is dropped first

/** A request that takes longer than this fails with a "timeout" error instead of loading forever. */
export const REQUEST_TIMEOUT = 15_000;

/** `code` lets the UI show a translated message (+ `status` for HTTP errors). */
export class ApiError extends Error {
  code?: ApiErrorCode;
  status?: number;

  constructor(message: string, { code, status }: { code?: ApiErrorCode; status?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type QueryValue = string | number | boolean | undefined | null;

/** Builds the request URL, skipping empty values (`true` becomes "1"). */
export function buildUrl(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    search.set(key, value === true ? '1' : String(value));
  });
  return `${API_BASE}?${search.toString()}`;
}

/** Raw request to the sites index. */
export async function searchSites(options: SearchOptions = {}, signal?: AbortSignal): Promise<SearchResult> {
  const {
    q = '',
    aiCategory = '',
    aiStartups = false,
    sort = 'went_live',
    order = 'desc',
    from = 0,
    size = 24,
  } = options;

  const url = buildUrl({
    index: 'sites',
    category: 'ai',
    q: q.trim(),
    ai_categories: aiCategory,
    ai_startups: aiStartups,
    sort,
    order,
    from,
    size,
  });

  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  const request = withTimeout(signal, REQUEST_TIMEOUT);
  let json: ApiResponse | null;
  try {
    const response = await fetch(url, { signal: request.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new ApiError(`FreeSerp API responded with status ${response.status}.`, {
        code: 'status',
        status: response.status,
      });
    }
    json = await response.json().catch(() => null);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const name = (error as Error | undefined)?.name;
    if (name === 'TimeoutError') throw new ApiError('FreeSerp API did not answer in time.', { code: 'timeout' });
    if (name === 'AbortError') throw error; // cancelled by the caller (new params, unmount)
    throw new ApiError('Could not reach the FreeSerp API.', { code: 'network' });
  } finally {
    request.done();
  }

  if (!json || json.ok === false || !Array.isArray(json.results)) {
    throw new ApiError(json?.error || 'FreeSerp API returned an unexpected response.', { code: 'format' });
  }

  const data: SearchResult = {
    total: Number(json.total) || 0,
    from: Number(json.from) || 0,
    count: json.results.length, // raw page length, used to compute the next `from`
    // a record without a domain can't be shown or linked, so it is skipped
    results: json.results.map(normalizeSite).filter((site): site is Site => site.domain !== null),
  };

  cache.set(url, { time: Date.now(), data });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return data;
}

const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/**
 * Turns user input or a URL path segment into a bare hostname, or null:
 * "HTTPS://www.Example.com/path" → "www.example.com".
 */
export function cleanDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const host = String(raw)
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0]
    .replace(/\.$/, '');
  return HOSTNAME.test(host) ? host : null;
}

/**
 * One site by its exact domain, or null when the AI index doesn't have it.
 * FreeSerp has no `domain=` filter (unknown params are ignored), so this is the
 * documented lookup: the domain as the full-text query (exact domains are boosted),
 * then an exact match on `domain` in the first results.
 */
export async function getSiteByDomain(raw: string, signal?: AbortSignal): Promise<Site | null> {
  const domain = cleanDomain(raw);
  if (!domain) return null;
  const bare = domain.replace(/^www\./, '');
  const data = await searchSites({ q: bare, sort: 'relevance', size: 10 }, signal);
  return (
    data.results.find((site) => site.domain === domain) ??
    data.results.find((site) => site.domain.replace(/^www\./, '') === bare) ??
    null
  );
}

/**
 * Combines the caller's AbortSignal with a timeout. Aborting from outside rejects
 * fetch with AbortError, the timeout with TimeoutError, so the two can be told apart.
 */
function withTimeout(outer: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), ms);
  const onAbort = () => controller.abort(outer?.reason ?? new DOMException('Aborted', 'AbortError'));
  if (outer?.aborted) onAbort();
  else outer?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      outer?.removeEventListener('abort', onAbort);
    },
  };
}

/** Only http(s) links from the API are used as hrefs (no javascript:, data: …). */
export function safeUrl(raw: string | null | undefined, domain?: string | null): string | null {
  const candidate = raw || (domain ? `https://${domain}` : null);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

/**
 * Keeps only fields the UI uses and normalises missing values to null.
 * Nothing is invented: absent fields stay null and the UI hides them.
 */
export function normalizeSite(raw: ApiSite): MaybeSite {
  const domain = text(raw.domain)?.toLowerCase() ?? null;
  return {
    domain,
    url: safeUrl(raw.url, raw.domain),
    title: text(raw.title),
    summary: text(raw.ai_summary),
    categories: Array.isArray(raw.ai_categories)
      ? raw.ai_categories.filter((c): c is string => typeof c === 'string' && c !== '')
      : [],
    dr: typeof raw.dr === 'number' ? raw.dr : null,
    wentLive: raw.went_live ?? null,
    firstSeen: raw.first_seen ?? null,
    fetchedAt: raw.fetched_at ?? null,
    aiSource: raw.ai_source ?? null,
    tld: raw.tld ?? null,
    webserver: raw.webserver ?? null,
    httpStatus: raw.http_status ?? null,
  };
}
