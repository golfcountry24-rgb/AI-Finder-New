import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (e2e/*.spec.js) against the production build served by
 * `vite preview`. The FreeSerp API is faked in the browser (e2e/helpers.js), so the
 * suite is fast, deterministic and needs no network. Run: npm run test:e2e
 *
 * PW_CHROMIUM_PATH points Playwright at an already installed Chromium instead of
 * its own download (useful in sandboxes); CI uses `npx playwright install`.
 */
const PORT = 4173;
const chromium = process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {};

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    ...chromium,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...chromium } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...chromium } },
  ],
  webServer: {
    // PRERENDER=0: the build must not call the real API
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    env: { PRERENDER: '0' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
