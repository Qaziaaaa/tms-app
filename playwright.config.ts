import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";
import { getTestDbUri } from "./tests/lib/test-uri";

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_DB_URI = getTestDbUri();

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/globalSetup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: "list",
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    port: Number(PORT),
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      ...process.env,
      MONGODB_URI: TEST_DB_URI,
      TMS_TEST_MODE: "1",
    },
  },
});
