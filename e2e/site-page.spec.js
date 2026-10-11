import { expect, test } from '@playwright/test';
import { mockApi, startClean } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await startClean(page);
  await mockApi(page);
});

test('/site/<domain> shows the profile with its own title and canonical URL', async ({ page }) => {
  await page.goto('/site/plausible.io');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Plausible Analytics');
  await expect(page).toHaveTitle('Plausible Analytics (plausible.io) · AI Finder');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/site\/plausible\.io$/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /privacy-friendly/);
  // categories link back to the filtered catalogue
  await page.getByRole('link', { name: 'Data & Analytics' }).click();
  await expect(page).toHaveURL(/\?cat=Data\+%26\+Analytics|\?cat=Data%20%26%20Analytics/);
});

test('an unknown domain is a not-found page that is not indexed', async ({ page }) => {
  await page.goto('/site/missing-site.com');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('missing-site.com is not in the AI index');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
