import { test, expect } from "@playwright/test";

test("load, expand, view contents, search reveal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tree")).toBeVisible();
  const firstRoot = page.getByRole("treeitem").first();
  await expect(firstRoot).toBeVisible();

  await firstRoot.getByTestId("chevron").click();
  await firstRoot.click();
  await expect(page.getByRole("region", { name: "Folder contents" })).toBeVisible();

  await page.getByRole("searchbox").fill("Folder");
  await expect(page.locator(".search-results")).toBeVisible();
});
