import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a production build served on port 3002 with
 * the scripted narrator: the Anthropic API is never called. A build is used
 * because Next allows a single dev server per project, and the real one may
 * be running on 3001.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1600, height: 900 },
  },
  webServer: {
    command: 'pnpm exec next build && pnpm exec next start -p 3002',
    url: 'http://localhost:3002/',
    timeout: 300_000,
    reuseExistingServer: false,
    env: { MOCK_NARRATOR: '1' },
  },
});
