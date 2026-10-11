import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORY_FILTERS, SORT_OPTIONS } from '../utils/constants';

/**
 * Explore state lives in the URL (?q=&cat=&sort=&ai=1) so results are
 * shareable and survive reloads / back navigation.
 *
 * `update(patch, { replace })`: filter, sort and toggle changes add a history
 * entry (Back undoes them); search typing passes `replace: true` so every
 * debounced keystroke doesn't become its own entry.
 */
export function useExploreParams() {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const q = params.get('q') ?? '';
    const catParam = params.get('cat') ?? '';
    const category = CATEGORY_FILTERS.some((c) => c.id === catParam) ? catParam : '';
    const aiStartups = params.get('ai') === '1';

    let sortId = params.get('sort') ?? (q ? 'relevance' : 'dr');
    const sortOption = SORT_OPTIONS.find((s) => s.id === sortId);
    if (!sortOption || (sortOption.needsQuery && !q)) sortId = 'dr';

    return { q, category, aiStartups, sortId };
  }, [params]);

  const update = useCallback(
    (patch, { replace = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === '' || value === false || value === null) next.delete(key);
            else next.set(key, value === true ? '1' : value);
          });
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  return [state, update];
}
