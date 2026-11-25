import { defineConfig, devices } from "@playwright/test";

// Run against the local Node server by default, or any deployed URL: BASE_URL=https://… npx playwright test
const remote = process.env.BASE_URL;
const local = "http://localhost:4195";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: "list",
  use: { baseURL: remote ?? local },
  webServer: remote ? undefined : { command: "node server.mjs", env: { PORT: "4195" }, url: `${local}/healthz`, reuseExistingServer: true },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 14"], defaultBrowserType: "chromium" } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
