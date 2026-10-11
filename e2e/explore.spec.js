import { expect, test } from '@playwright/test';
import { catalogue, mockApi, startClean } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await startClean(page);
  await mockApi(page);
});

test('the catalogue loads from the API, sorted by Domain Rating', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find AI tools');
  const names = catalogue(page).locator('h3');
  await expect(names.first()).toHaveText('ShareThis');
  await expect(names).toHaveCount(8);
  await expect(page.getByText('8 sites')).toBeVisible();
});

test('search narrows the list, keeps the query in the URL and shows an empty state', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search AI sites' });
  await search.fill('analytics');
  await expect(page).toHaveURL(/q=analytics/);
  await expect(catalogue(page).locator('h3')).toHaveText(['Plausible Analytics', 'Typeform']);

  await search.fill('zzz-nothing');
  await search.press('Enter'); // "Search" applies at once, without waiting for the debounce
  await expect(page.getByRole('heading', { name: /Nothing found for “zzz-nothing”/ })).toBeVisible();
  await page.getByRole('button', { name: 'Reset search & filters' }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(catalogue(page).locator('h3')).toHaveCount(8);
});

test('category chips and hero shortcuts filter by the real API value', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: 'Filter by category' }).getByRole('button', { name: 'Data', exact: true }).click();
  await expect(page).toHaveURL(/cat=Data\+%26\+Analytics/);
  await expect(catalogue(page).locator('h3')).toHaveText(['Plausible Analytics', 'Typeform']);

  await page.getByRole('navigation', { name: 'Browse by task' }).getByRole('button', { name: 'Agents', exact: true }).click();
  await expect(page).toHaveURL(/cat=AI\+Agents/);
  await expect(catalogue(page).locator('h3')).toHaveText(['Pagelyte', 'Unstoppable Academy']);
});

test('a card opens the detail dialog, Esc closes it, and it links to the site page', async ({ page }) => {
  await page.goto('/');
  await catalogue(page).getByRole('button', { name: 'Wiley', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Wiley' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Visit website/ })).toHaveAttribute('href', 'https://www.wiley.com/');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await catalogue(page).getByRole('button', { name: 'Wiley', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: /Open full page/ }).click();
  await expect(page).toHaveURL(/\/site\/wiley\.com$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wiley');
});

test('the language switch translates the interface', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'UA', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Знаходьте');
});
