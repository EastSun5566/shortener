import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = process.env.WEB_PORT || '3001';
const SERVER_PORT = process.env.SERVER_PORT || '8080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_URL: process.env.VITE_API_URL || `http://localhost:${SERVER_PORT}`,
    },
  },
});
