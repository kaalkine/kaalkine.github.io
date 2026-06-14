const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3456",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx serve -l 3456 .",
    url: "http://127.0.0.1:3456",
    reuseExistingServer: !process.env.CI,
  },
});
