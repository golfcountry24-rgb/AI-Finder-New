import { useCallback, useEffect, useState } from 'react';
import { cleanDomain, getSiteByDomain } from '../services/freeserp';

/**
 * One site by domain: { status: 'loading' | 'success' | 'notfound' | 'error', site, error, retry }.
 * 'notfound' means the request worked but the AI index has no such domain.
 */
export function useSite(rawDomain) {
  const domain = cleanDomain(rawDomain);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, status: 'loading', site: null, error: null });
  const key = `${domain}#${attempt}`;

  useEffect(() => {
    if (!domain) return undefined;
    const controller = new AbortController();
    getSiteByDomain(domain, controller.signal)
      .then((site) => setState({ key, status: site ? 'success' : 'notfound', site, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ key, status: 'error', site: null, error });
      });
    return () => controller.abort();
  }, [domain, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  if (!domain) return { domain, status: 'notfound', site: null, error: null, retry };
  // a new domain shows "loading" at once instead of the previous site
  if (state.key !== key) return { domain, status: 'loading', site: null, error: null, retry };
  return { domain, ...state, retry };
}

/**
 * Several sites at once (the comparison). Each entry has its own status, so one
 * missing domain doesn't hide the others. `fallback` (stored snapshots) is shown
 * while fresh data loads.
 */
export function useSitesByDomain(domains, fallback = []) {
  const list = domains.join(',');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, entries: {} });
  const key = `${list}#${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const wanted = list ? list.split(',') : [];
    Promise.allSettled(wanted.map((d) => getSiteByDomain(d, controller.signal))).then((results) => {
      if (controller.signal.aborted) return;
      const entries = {};
      results.forEach((result, i) => {
        entries[wanted[i]] =
          result.status === 'fulfilled'
            ? { status: result.value ? 'success' : 'notfound', site: result.value }
            : { status: 'error', site: null, error: result.reason };
      });
      setState({ key, entries });
    });
    return () => controller.abort();
  }, [list, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const ready = state.key === key;
  const items = domains.map((domain) => {
    if (ready && state.entries[domain]) return { domain, ...state.entries[domain] };
    const stored = fallback.find((s) => s.domain === domain);
    return { domain, status: 'loading', site: stored ?? null };
  });
  return { items, loading: !ready, retry };
}
