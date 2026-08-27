import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    // Aponta para a nova porta 8085
    baseURL: 'http://127.0.0.1:8085',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Força o Live Server a subir sempre na porta 8085
  webServer: {
    command: 'npx live-server --port=8085 --no-browser',
    url: 'http://127.0.0.1:8085',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});