import { defineConfig, devices } from "@playwright/test";

/** When unset, the dev server is started without Supabase URL/key so the app uses auth bypass (smoke + game e2e). Set `E2E_CLOUD=1` when running `e2e/cloud.spec.ts` with real Supabase + `E2E_SUPABASE_*` credentials. */
const e2eCloud = process.env.E2E_CLOUD === "1";

const e2ePort = process.env.E2E_DEV_PORT ?? "3999";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ...(!e2eCloud
        ? {
            NEXT_PUBLIC_SUPABASE_URL: "",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          }
        : {}),
    },
  },
});
