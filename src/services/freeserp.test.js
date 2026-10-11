import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  REQUEST_TIMEOUT,
  buildUrl,
  cleanDomain,
  getSiteByDomain,
  normalizeSite,
  safeUrl,
  searchSites,
} from './freeserp';

const site = (domain, extra = {}) => ({ domain, title: `${domain} title`, ai_summary: 'Summary', dr: 50, ...extra });
const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

let call = 0;
// every test uses a unique query so the module-level cache never leaks between tests
const uniqueQuery = () => `test-${++call}-${Math.random()}`;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('buildUrl', () => {
  it('skips empty values and turns true into 1', () => {
    const url = buildUrl({ q: '', ai_startups: true, ai_categories: undefined, from: 0, size: 24, flag: false });
    expect(url).toMatch(/api\/freeserp\.php\?ai_startups=1&from=0&size=24$/);
  });
});

describe('safeUrl', () => {
  it('keeps http(s) links', () => {
    expect(safeUrl('https://example.com', 'example.com')).toBe('https://example.com/');
    expect(safeUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
  });
  it('builds a link from the domain when the API has none', () => {
    expect(safeUrl(null, 'example.com')).toBe('https://example.com/');
  });
  it('rejects other protocols and garbage', () => {
    expect(safeUrl('javascript:alert(1)', 'x.com')).toBeNull();
    expect(safeUrl('data:text/html,hi')).toBeNull();
    expect(safeUrl('not a url')).toBeNull();
    expect(safeUrl(null, null)).toBeNull();
  });
});

describe('normalizeSite', () => {
  it('maps API fields and keeps missing ones as null (nothing invented)', () => {
    const s = normalizeSite({ domain: 'Example.com ', ai_categories: ['Image Generation', '', 3] });
    expect(s).toMatchObject({
      domain: 'example.com',
      url: 'https://example.com/',
      title: null,
      summary: null,
      dr: null,
      wentLive: null,
      categories: ['Image Generation'],
    });
  });
  it('does not accept a non-numeric DR', () => {
    expect(normalizeSite({ domain: 'a.com', dr: '50' }).dr).toBeNull();
  });
});

describe('searchSites', () => {
  it('returns normalised results, the raw page length and skips records without a domain', async () => {
    fetch.mockResolvedValue(okResponse({ ok: true, total: 3, from: 0, results: [site('a.com'), { title: 'no domain' }, site('b.com')] }));
    const data = await searchSites({ q: uniqueQuery() });
    expect(data.total).toBe(3);
    expect(data.count).toBe(3);
    expect(data.results.map((r) => r.domain)).toEqual(['a.com', 'b.com']);
    const url = new URL(fetch.mock.calls[0][0], 'http://x');
    expect(url.searchParams.get('index')).toBe('sites');
    expect(url.searchParams.get('category')).toBe('ai');
  });

  it('caches identical requests', async () => {
    fetch.mockResolvedValue(okResponse({ ok: true, total: 1, results: [site('a.com')] }));
    const q = uniqueQuery();
    await searchSites({ q });
    await searchSites({ q });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('turns an HTTP error into ApiError(status)', async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    await expect(searchSites({ q: uniqueQuery() })).rejects.toMatchObject({ code: 'status', status: 503 });
  });

  it('rejects an unexpected body with ApiError(format)', async () => {
    fetch.mockResolvedValue(okResponse({ ok: false, error: 'bad param' }));
    await expect(searchSites({ q: uniqueQuery() })).rejects.toMatchObject({ code: 'format', message: 'bad param' });
  });

  it('turns a network failure into ApiError(network)', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await searchSites({ q: uniqueQuery() }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('network');
  });

  it('gives up after REQUEST_TIMEOUT with ApiError(timeout)', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(
      (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    );
    const pending = searchSites({ q: uniqueQuery() }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT + 10);
    expect(await pending).toMatchObject({ code: 'timeout' });
  });

  it('passes a caller abort through as AbortError (not shown as an error)', async () => {
    fetch.mockImplementation(
      (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    );
    const controller = new AbortController();
    const pending = searchSites({ q: uniqueQuery() }, controller.signal).catch((e) => e);
    controller.abort();
    expect((await pending).name).toBe('AbortError');
  });
});

describe('cleanDomain', () => {
  it('turns input or a URL into a bare lowercase hostname', () => {
    expect(cleanDomain('HTTPS://www.Example.com/path?x=1')).toBe('www.example.com');
    expect(cleanDomain('  wiley.com ')).toBe('wiley.com');
  });

  it('rejects anything that is not a hostname', () => {
    expect(cleanDomain('')).toBeNull();
    expect(cleanDomain('not a domain')).toBeNull();
    expect(cleanDomain('javascript:alert(1)')).toBeNull();
    expect(cleanDomain('localhost')).toBeNull();
  });
});

describe('getSiteByDomain', () => {
  it('queries the domain and returns the exact match, not the first result', async () => {
    fetch.mockResolvedValue(okResponse({ ok: true, total: 2, results: [site('datafa.st'), site('plausible.io')] }));
    const found = await getSiteByDomain('https://Plausible.io/');
    expect(found.domain).toBe('plausible.io');
    const url = new URL(fetch.mock.calls[0][0], 'http://x');
    expect(url.searchParams.get('q')).toBe('plausible.io');
  });

  it('returns null when the index has no such domain or the input is invalid', async () => {
    fetch.mockResolvedValue(okResponse({ ok: true, total: 1, results: [site('other.com')] }));
    expect(await getSiteByDomain('missing-site.com')).toBeNull();
    expect(await getSiteByDomain('not a domain')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
