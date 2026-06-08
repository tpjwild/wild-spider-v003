import { expect, test, type Page } from "@playwright/test";
import {
  buildSetAlignByMoveFixture,
  buildSetPowerTriggerFixture,
  serializedSetPowersFixture,
  setPowersE2EJackCard,
  setPowersE2ETargetCard,
  storageKey,
  tableauCardKey,
} from "./fixtures/setPowersGame";

/** Pointer drag for @dnd-kit tableau cards (Playwright dragTo is unreliable here). */
async function dragTableauCardToColumn(
  page: Page,
  cardKey: string,
  targetColumnIndex: number,
): Promise<void> {
  const card = page.locator(`[data-tableau-card-key="${cardKey}"]`);
  const stack = page.locator(`[data-tableau-stack="${targetColumnIndex}"]`);
  await expect(card).toBeVisible();
  await expect(stack).toBeVisible();
  const from = await card.boundingBox();
  const to = await stack.boundingBox();
  if (!from || !to) throw new Error("missing drag bounding boxes");
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + Math.min(from.height / 2 + 8, to.height - 8);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 20 });
  await page.mouse.up();
}

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

test.describe("set powers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("wild-spider-game-v1");
      localStorage.removeItem("wild-spider-last-new-game-defaults-v1");
    });
  });

  test("align set by tableau move shows set card on shelf", async ({ page }) => {
    await clearAndInjectGame(page, serializedSetPowersFixture(buildSetAlignByMoveFixture()));

    const jack = setPowersE2EJackCard();
    await dragTableauCardToColumn(page, tableauCardKey(jack), 0);

    await expect(page.getByTestId("shelf-set-0")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("set-power-shelf-card")).toBeVisible();
    await expect(page.getByTestId("set-court-king")).toBeVisible();
  });

  test("trigger transparent from set shelf and undo restores charge", async ({ page }) => {
    await clearAndInjectGame(page, serializedSetPowersFixture(buildSetPowerTriggerFixture()));

    const setShelf = page.getByTestId("shelf-set-0");
    await expect(setShelf).toBeVisible();
    await expect(page.getByTestId("set-power-shelf-card")).toBeVisible();
    await expect(setShelf).toHaveAttribute("data-charges", "1");

    await setShelf.dblclick();
    await expect(setShelf).toHaveAttribute("data-power-targeting", "true");

    const target = setPowersE2ETargetCard();
    const targetEl = page.locator(`[data-tableau-card-key="${tableauCardKey(target)}"]`);
    await expect(targetEl).toHaveAttribute("data-power-target-valid", "true");
    await targetEl.click();

    await expect(page.getByTestId("game-powers")).toContainText("1");
    await expect(targetEl.locator('[data-effect-badge-scope="card"]')).toBeVisible();

    await page.getByTestId("actions-menu-trigger").click();
    await page.getByRole("button", { name: "Undo" }).click();

    await expect(page.getByTestId("game-powers")).toContainText("0");
    await expect(setShelf).toHaveAttribute("data-charges", "1");
    await expect(targetEl.locator('[data-effect-badge-scope="card"]')).toHaveCount(0);
  });
});
