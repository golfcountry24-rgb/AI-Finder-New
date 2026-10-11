// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSites } from './useSites';
import { searchSites } from '../services/freeserp';

vi.mock('../services/freeserp', () => ({ MAX_OFFSET: 10000, searchSites: vi.fn() }));

const page = (from, n, total = 100) => ({
  total,
  from,
  count: n,
  results: Array.from({ length: n }, (_, i) => ({ domain: `site-${from + i}.com` })),
});

afterEach(() => vi.clearAllMocks());

describe('useSites', () => {
  it('loads the first page', async () => {
    searchSites.mockResolvedValue(page(0, 24));
    const { result } = renderHook(() => useSites({ q: 'a', size: 24 }));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.items).toHaveLength(24);
    expect(result.current.hasMore).toBe(true);
  });

  it('ignores a second "Load more" while the first one runs (no skipped page)', async () => {
    searchSites.mockResolvedValueOnce(page(0, 24));
    const { result } = renderHook(() => useSites({ q: 'b', size: 24 }));
    await waitFor(() => expect(result.current.status).toBe('success'));

    let resolve;
    searchSites.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(searchSites).toHaveBeenCalledTimes(2); // first page + ONE load more
    expect(searchSites.mock.calls[1][0]).toMatchObject({ from: 24 });

    await act(async () => resolve(page(24, 24)));
    expect(result.current.items).toHaveLength(48);
    expect(result.current.offset).toBe(48);
  });

  it('keeps the previous results visible while new params load', async () => {
    searchSites.mockResolvedValueOnce(page(0, 24));
    const { result, rerender } = renderHook(({ q }) => useSites({ q, size: 24 }), { initialProps: { q: 'c' } });
    await waitFor(() => expect(result.current.status).toBe('success'));

    let resolve;
    searchSites.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    rerender({ q: 'd' });
    expect(result.current.refreshing).toBe(true);
    expect(result.current.items).toHaveLength(24);
    expect(result.current.hasMore).toBe(false); // no "Load more" for stale results

    await act(async () => resolve(page(0, 5, 5)));
    expect(result.current.refreshing).toBe(false);
    expect(result.current.items).toHaveLength(5);
  });

  it('never asks past the 10 000 limit of the index', async () => {
    // pretend 9 990 records were already paged through
    searchSites.mockResolvedValueOnce({ total: 50000, from: 0, count: 9990, results: [{ domain: 'x.com' }] });
    const { result } = renderHook(() => useSites({ q: 'e', size: 24 }));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.hasMore).toBe(true);

    searchSites.mockResolvedValueOnce({ total: 50000, from: 9990, count: 10, results: [{ domain: 'y.com' }] });
    await act(async () => result.current.loadMore());
    expect(searchSites.mock.calls.at(-1)[0]).toMatchObject({ from: 9990, size: 10 }); // not 24
    expect(result.current.offset).toBe(10000);
    expect(result.current.hasMore).toBe(false);
  });

  it('shows an error and retries', async () => {
    searchSites.mockRejectedValueOnce(Object.assign(new Error('down'), { code: 'network' }));
    const { result } = renderHook(() => useSites({ q: 'f', size: 24 }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    searchSites.mockResolvedValueOnce(page(0, 3, 3));
    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
