import { expect, test } from "@playwright/test";

test("home shows Wild Spider title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /WILD SPIDER/i }),
  ).toBeVisible();
});
