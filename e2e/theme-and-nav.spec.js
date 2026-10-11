import { expect, test } from '@playwright/test';
import { mockApi, startClean } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await startClean(page);
  await mockApi(page);
});

test('day / night: the system decides first, the switch overrides it and survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark'); // no choice yet: the system preference

  const toggle = page.getByRole('switch', { name: 'Night mode' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light'); // set before paint, no flash
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'light'); // the choice wins over the system

  await page.getByRole('switch', { name: 'Night mode' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('pages are reachable from the navigation and unknown paths show 404', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'New AI' }).click();
  await expect(page).toHaveURL(/\/new$/);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible(); // a launch date group

  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('isn’t in the index');
});

test('the mobile menu opens, closes with Esc and returns focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Open menu' });
  await button.click();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});
