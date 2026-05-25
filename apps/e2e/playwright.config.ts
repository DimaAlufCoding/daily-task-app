import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(__dirname, '.env.test') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: '~/.bun/bin/bun run src/index.ts',
      cwd: path.resolve(__dirname, '../server'),
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      env: {
        DATABASE_URL: process.env.TEST_DATABASE_URL!,
        BETTER_AUTH_SECRET: process.env.TEST_BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: 'http://localhost:3001',
        TRUSTED_ORIGINS: 'http://localhost:5173',
        NODE_ENV: 'test',
      },
    },
    {
      command: '~/.bun/bin/bun run --bun vite',
      cwd: path.resolve(__dirname, '../client'),
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
})
