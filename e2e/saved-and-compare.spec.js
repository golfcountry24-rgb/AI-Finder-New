import { expect, test } from '@playwright/test';
import { catalogue, mockApi, startClean } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await startClean(page);
  await mockApi(page);
});

test('saved sites stay in the browser and appear on the Saved page', async ({ page, isMobile }) => {
  await page.goto('/');
  await catalogue(page).getByRole('button', { name: 'Save hcaptcha.com' }).click();
  await expect(catalogue(page).getByRole('button', { name: 'Remove hcaptcha.com from saved' })).toHaveAttribute('aria-pressed', 'true');

  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: /Saved/ }).click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByRole('heading', { name: 'hCaptcha' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'hCaptcha' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove hcaptcha.com from saved' }).click();
  await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
});

test('picked sites are compared side by side, and the link reproduces the table', async ({ page }) => {
  await page.goto('/');
  await catalogue(page).getByRole('button', { name: 'Add plausible.io to comparison' }).click();
  await catalogue(page).getByRole('button', { name: 'Add pagelyte.xyz to comparison' }).click();
  const tray = page.getByRole('complementary', { name: 'Sites to compare' });
  await expect(tray).toBeVisible();
  await tray.getByRole('link', { name: 'Compare', exact: true }).click();

  await expect(page).toHaveURL(/\/compare\?d=plausible\.io(%2C|,)pagelyte\.xyz$/);
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader')).toHaveCount(3);
  // Plausible has the higher rating, Pagelyte launched later
  await expect(table.getByRole('row', { name: /Domain Rating/ })).toContainText('Highest');
  await expect(table.getByRole('row', { name: /Went live/ })).toContainText('Newest');

  // the address alone rebuilds the comparison (e.g. a shared link in a fresh browser)
  const url = page.url();
  await page.evaluate(() => localStorage.removeItem('ai-finder-compare'));
  await page.goto(url);
  await expect(page.getByRole('table').getByRole('columnheader')).toHaveCount(3);

  await page.getByRole('button', { name: 'Remove pagelyte.xyz' }).click();
  await expect(page).toHaveURL(/\/compare\?d=plausible\.io$/);
  await expect(page.getByText('Pick at least one more site to compare.')).toBeVisible();
});

test('the comparison holds at most four sites', async ({ page }) => {
  await page.goto('/');
  for (const domain of ['sharethis.com', 'wiley.com', 'bing.com', 'hcaptcha.com']) {
    await catalogue(page).getByRole('button', { name: `Add ${domain} to comparison` }).click();
  }
  const fifth = catalogue(page).locator('article', { hasText: 'plausible.io' }).getByRole('button', { name: /comparison/i });
  await expect(fifth).toHaveAttribute('title', 'Comparison is full: up to 4 sites');
  await fifth.click();
  await expect(page.getByRole('complementary', { name: 'Sites to compare' }).getByRole('listitem')).toHaveCount(4);
});
