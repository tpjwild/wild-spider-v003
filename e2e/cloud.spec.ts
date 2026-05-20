import { expect, test } from "@playwright/test";

/**
 * Run with real Supabase (same project as `.env.local`):
 * `E2E_CLOUD=1 E2E_SUPABASE_EMAIL=... E2E_SUPABASE_PASSWORD=... pnpm test:e2e e2e/cloud.spec.ts`
 */

const email = process.env.E2E_SUPABASE_EMAIL;
const password = process.env.E2E_SUPABASE_PASSWORD;

test.describe("cloud save resume", () => {
  test.skip(!email || !password, "Set E2E_SUPABASE_EMAIL and E2E_SUPABASE_PASSWORD for this flow");

  test("login, play, save, logout, login, resume", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /WILD SPIDER/i })).toBeVisible({ timeout: 60_000 });

    const dialog = page.getByTestId("new-game-dialog");
    if (await dialog.isVisible()) {
      await page.getByTestId("new-game-columns").fill("4");
      await page.getByTestId("new-game-deals").fill("5");
      await page.getByTestId("new-game-seed").fill("04-005-BAS-11111111111111");
      await page.getByTestId("new-game-start").click();
    }

    await expect(page.getByTestId("tableau-root")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("actions-menu-trigger").click();
    await page.getByRole("button", { name: "Save Game" }).click();

    await page.getByTestId("actions-menu-trigger").click();
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page.getByLabel("Email")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.goto("/");
    await expect(page.getByTestId("tableau-root")).toBeVisible({ timeout: 60_000 });
  });
});
