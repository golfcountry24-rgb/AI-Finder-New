import { fakeApi } from './fixtures.js';

/**
 * Answers every FreeSerp request from the fixtures (and icons with "no icon"),
 * so tests never touch the network. Returns the list of API URLs the page asked for.
 */
export async function mockApi(page) {
  const calls = [];
  await page.route('**/api/freeserp.php**', (route) => {
    const url = new URL(route.request().url());
    calls.push(url);
    return route.fulfill({ json: fakeApi(url.searchParams) });
  });
  await page.route('**/api/favicon.php**', (route) => route.fulfill({ status: 204 }));
  return calls;
}

/** English UI and the light theme, whatever the browser's defaults are. */
export async function startClean(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-ready')) {
      localStorage.clear();
      localStorage.setItem('ai-finder-lang', 'en');
      sessionStorage.setItem('e2e-ready', '1');
    }
  });
}

/** The catalogue grid on Explore (not the hero's recent launches or the sort listbox). */
export const catalogue = (page) => page.locator('section[aria-labelledby="catalog-title"] > ul');
