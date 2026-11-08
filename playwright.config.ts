import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the production build (`npm run build` first) served by `vite preview`.
 * They use the Chrome already installed on this machine (channel: "chrome"), so no browser download.
 * Exercise GIFs are stubbed with a local fixture except in the test that checks the real CDN.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  // Two browsers at a time keeps the suite reliable on a laptop that's busy with other things.
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    serviceWorkers: "block",
    trace: "retain-on-failure"
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } }
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60_000
  }
});
