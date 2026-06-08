import { expect, test } from "@playwright/test";
import {
  buildImmediateJokerFixture,
  buildTargetedJokerFixture,
  jokerPowersE2EKingCard,
  jokerPowersE2ETargetCard,
  serializedJokerPowersFixture,
  storageKey,
  tableauCardKey,
} from "./fixtures/jokerPowersGame";

async function clearAndInjectGame(
  page: import("@playwright/test").Page,
  stateJson: string,
): Promise<void> {
  await page.evaluate(
    ({ key, json }) => {
      localStorage.removeItem("wild-spider-last-new-game-defaults-v1");
      localStorage.setItem(key, json);
    },
    { key: storageKey(), json: stateJson },
  );
  await page.reload();
  await expect(page.getByTestId("tableau-root")).toBeVisible({ timeout: 30_000 });
}

async function undoLastMove(page: import("@playwright/test").Page): Promise<void> {
  await page.getByTestId("actions-menu-trigger").click();
  await page.getByRole("button", { name: "Undo" }).click();
}

test.describe("joker powers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("wild-spider-game-v1");
      localStorage.removeItem("wild-spider-last-new-game-defaults-v1");
    });
  });

  test("immediate joker applies transparent to kings and undo restores charge", async ({ page }) => {
    await clearAndInjectGame(page, serializedJokerPowersFixture(buildImmediateJokerFixture()));

    const jokerShelf = page.getByTestId("shelf-joker-0");
    await expect(jokerShelf).toBeVisible();
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");

    const king = jokerPowersE2EKingCard();
    const kingEl = page.locator(`[data-tableau-card-key="${tableauCardKey(king)}"]`);
    await expect(kingEl).toBeVisible();
    await expect(kingEl.locator('[data-effect-badge-scope="card"]')).toHaveCount(0);

    await jokerShelf.dblclick();
    await expect(jokerShelf).toHaveAttribute("data-power-targeting", "false");
    await expect(page.getByTestId("game-powers")).toContainText("1");
    await expect(jokerShelf).toHaveAttribute("data-charges", "2");
    await expect(kingEl.locator('[data-effect-badge-scope="card"]')).toBeVisible();

    await undoLastMove(page);

    await expect(page.getByTestId("game-powers")).toContainText("0");
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");
    await expect(kingEl.locator('[data-effect-badge-scope="card"]')).toHaveCount(0);
  });

  test("targeted joker cancel via Escape does not spend a charge", async ({ page }) => {
    await clearAndInjectGame(page, serializedJokerPowersFixture(buildTargetedJokerFixture()));

    const jokerShelf = page.getByTestId("shelf-joker-0");
    await expect(jokerShelf).toBeVisible();
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");

    await jokerShelf.dblclick();
    await expect(jokerShelf).toHaveAttribute("data-power-targeting", "true");

    await page.keyboard.press("Escape");

    await expect(jokerShelf).toHaveAttribute("data-power-targeting", "false");
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");
    await expect(page.getByTestId("game-powers")).toContainText("0");
  });

  test("targeted joker commit and undo restores charge", async ({ page }) => {
    await clearAndInjectGame(page, serializedJokerPowersFixture(buildTargetedJokerFixture()));

    const jokerShelf = page.getByTestId("shelf-joker-0");
    await expect(jokerShelf).toBeVisible();
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");

    await jokerShelf.dblclick();
    await expect(jokerShelf).toHaveAttribute("data-power-targeting", "true");

    const target = jokerPowersE2ETargetCard();
    const targetEl = page.locator(`[data-tableau-card-key="${tableauCardKey(target)}"]`);
    await expect(targetEl).toHaveAttribute("data-power-target-valid", "true");
    await targetEl.click();

    await expect(page.getByTestId("game-powers")).toContainText("1");
    await expect(jokerShelf).toHaveAttribute("data-charges", "2");
    await expect(jokerShelf).toHaveAttribute("data-power-targeting", "false");
    await expect(targetEl.locator('[data-effect-badge-scope="card"]')).toBeVisible();

    await undoLastMove(page);

    await expect(page.getByTestId("game-powers")).toContainText("0");
    await expect(jokerShelf).toHaveAttribute("data-charges", "3");
    await expect(targetEl.locator('[data-effect-badge-scope="card"]')).toHaveCount(0);
  });
});
