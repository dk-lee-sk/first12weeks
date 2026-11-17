// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 180_000,
  reporter: [['list']],
  use: {
    viewport: { width: 390, height: 780 },
    // Set CHROME_PATH to use a system Chrome instead of Playwright's bundled Chromium.
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
});
