import { test, expect } from "@playwright/test";

const root = {
  id: "00000000-0000-7000-8000-000000000001",
  parentId: null,
  name: "Root",
  depth: 0,
  subfolderCount: 1,
  fileCount: 1,
  hasChildren: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const child = {
  id: "00000000-0000-7000-8000-000000000002",
  parentId: root.id,
  name: "Child",
  depth: 1,
  subfolderCount: 0,
  fileCount: 0,
  hasChildren: false,
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const file = {
  id: "00000000-0000-7000-8000-000000000003",
  folderId: root.id,
  name: "readme.txt",
  extension: "txt",
  sizeBytes: 1024,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const pageInfo = { hasMore: false, nextCursor: null };
const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:3000/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname.replace("/api/v1", "");

    if (method === "GET" && path === "/folders/roots") {
      await route.fulfill(json({ data: [root], pageInfo }));
      return;
    }
    if (method === "GET" && path === `/folders/${root.id}/children`) {
      await route.fulfill(json({ data: [child], pageInfo }));
      return;
    }
    if (method === "GET" && path === `/folders/${root.id}/contents`) {
      await route.fulfill(json({
        folder: root,
        folders: { data: [child], pageInfo },
        files: { data: [file], pageInfo },
      }));
      return;
    }
    if (method === "GET" && path === `/folders/${root.id}/breadcrumbs`) {
      await route.fulfill(json({ data: [{ id: root.id, name: root.name }] }));
      return;
    }
    if (method === "GET" && path === "/search") {
      await route.fulfill(json({ data: [{ type: "folder", id: child.id, name: child.name, ancestors: [{ id: root.id, name: root.name }] }], pageInfo }));
      return;
    }
    if (method === "PATCH" && path === `/folders/${child.id}`) {
      await route.fulfill(json({ data: { ...child, name: "Renamed folder" } }));
      return;
    }
    if (method === "PATCH" && path === `/folders/${root.id}/files/${file.id}`) {
      await route.fulfill(json({ data: { ...file, name: "notes.md", extension: "md" } }));
      return;
    }

    await route.fulfill(json({ data: [], pageInfo }));
  });
});

test("load, expand, view contents, search reveal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tree")).toBeVisible();
  const firstRoot = page.getByRole("treeitem").first();
  await expect(firstRoot).toBeVisible();

  await firstRoot.getByTestId("chevron").click();
  await firstRoot.click();
  await expect(page.getByRole("region", { name: "Folder contents" })).toBeVisible();

  await page.getByRole("searchbox").fill("Folder");
  await expect(page.getByRole("region", { name: "Search results" })).toBeVisible();
  await expect(page.locator(".addressbar .crumb").filter({ hasText: "Search" })).toBeVisible();
});

test("renames folder and file rows from their context menus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("treeitem", { name: "Root" }).click();

  await page.getByText("Child").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByLabel("Rename folder").fill("Renamed folder");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Renamed folder")).toBeVisible();

  await page.getByText("readme.txt").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByLabel("Rename file").fill("notes.md");
  await page.keyboard.press("Enter");
  await expect(page.getByText("notes.md")).toBeVisible();
});
