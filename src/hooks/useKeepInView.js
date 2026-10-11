import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../motion';

/**
 * When `deps` change (a filter, sort or toggle), brings `ref` back to just under
 * the sticky header — but only if the user has scrolled past it. Without this,
 * changing a filter deep in a long list leaves the viewport near the footer once
 * the shorter new list arrives. Skips the first render.
 */
export function useKeepInView(ref, deps) {
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const header = document.querySelector('header');
    const offset = (header ? header.getBoundingClientRect().bottom : 0) + 12;
    const top = el.getBoundingClientRect().top;
    if (top >= offset) return; // already visible — don't move the page
    window.scrollTo({ top: window.scrollY + top - offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
