const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'on',
    video: 'on-first-retry',
  },
  projects: [
    // channel 'chromium' = new headless mode, which supports hardware GPU
    // (default headless shell is software-rasterized and stalls the 3D scene)
    { name: 'chromium', use: { browserName: 'chromium', channel: 'chromium' } },
  ],
});
