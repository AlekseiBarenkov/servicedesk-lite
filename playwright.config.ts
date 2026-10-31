import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'ru-RU',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'yekaterinburg',
      use: { ...devices['Desktop Chrome'], timezoneId: 'Asia/Yekaterinburg' },
    },
    {
      name: 'utc',
      use: { ...devices['Desktop Chrome'], timezoneId: 'UTC' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
