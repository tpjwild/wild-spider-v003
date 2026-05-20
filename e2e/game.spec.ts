import { expect, test } from "@playwright/test";

test.describe("game UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("wild-spider-game-v1");
      localStorage.removeItem("wild-spider-last-new-game-defaults-v1");
    });
    await page.reload();
  });

  test("new game with fixed seed shows tableau and score", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /WILD SPIDER/i })).toBeVisible();

    await page.getByTestId("actions-menu-trigger").click();
    await page.getByRole("button", { name: "New Game" }).click();
    await expect(page.getByTestId("new-game-dialog")).toBeVisible();
    await page.getByTestId("new-game-columns").fill("4");
    await page.getByTestId("new-game-deals").fill("5");
    await page.getByTestId("new-game-seed").fill("04-005-BAS-11111111111111");
    await page.getByTestId("new-game-start").click();
    await expect(page.getByTestId("tableau-root")).toBeVisible();
    // Seed stays "—" until the initial deal animation finishes (see GameBar deferSeedDisplay).
    await expect(page.getByTestId("game-seed")).toContainText("04-005-BAS-11111111111111", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("game-score")).toHaveText(/\d+\.\d/);
    await expect(page.getByTestId("stock-pile")).toBeVisible();
  });
});
