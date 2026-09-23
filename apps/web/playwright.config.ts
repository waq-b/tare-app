import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4174',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node e2e/mock-api.ts',
      port: 4175,
      reuseExistingServer: false,
    },
    {
      command:
        'npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4174 --strictPort',
      port: 4174,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
