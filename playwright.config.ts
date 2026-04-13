import { defineConfig, devices } from "@playwright/test"

// Use a dedicated test port to avoid collisions with local dev servers.
const E2E_PORT = Number(process.env.E2E_PORT) || 3100
const E2E_URL = process.env.E2E_BASE_URL || `http://localhost:${E2E_PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: E2E_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    // Call `next dev` directly — `bun run dev` pipes through `tee` which
    // breaks arg forwarding and also swallows the port flag.
    command: `bunx next dev -p ${E2E_PORT}`,
    url: E2E_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
