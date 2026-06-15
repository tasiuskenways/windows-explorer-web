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
const newFolder = {
  id: "00000000-0000-7000-8000-000000000004",
  parentId: root.id,
  name: "New folder",
  depth: 1,
  subfolderCount: 0,
  fileCount: 0,
  hasChildren: false,
  updatedAt: "2026-01-04T00:00:00.000Z",
};
const newFile = {
  id: "00000000-0000-7000-8000-000000000005",
  folderId: root.id,
  name: "New Text Document.txt",
  extension: "txt",
  sizeBytes: 0,
  updatedAt: "2026-01-05T00:00:00.000Z",
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
    if (method === "POST" && path === `/folders/${root.id}/folders`) {
      await route.fulfill(json({ data: newFolder }));
      return;
    }
    if (method === "POST" && path === `/folders/${root.id}/files`) {
      await route.fulfill(json({ data: newFile }));
      return;
    }
    if (method === "DELETE" && path === `/folders/${child.id}`) {
      await route.fulfill({ status: 204 });
      return;
    }
    if (method === "DELETE" && path === `/folders/${root.id}/files/${file.id}`) {
      await route.fulfill({ status: 204 });
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

test("creates items and sorts from the toolbar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("treeitem", { name: "Root" }).click();

  await page.getByRole("button", { name: "New" }).click();
  await page.getByRole("menuitem", { name: "New folder" }).click();
  await expect(page.getByLabel("Rename folder")).toHaveValue("New folder");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "New" }).click();
  await page.getByRole("menuitem", { name: "New file" }).click();
  await expect(page.getByLabel("Rename file")).toHaveValue("New Text Document.txt");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Sort" }).click();
  await page.getByRole("menuitem", { name: "Size" }).click();

  await expect.poll(() => page.locator(".drow .item-name").allTextContents()).toEqual([
    "Child",
    "New folder",
    "New Text Document.txt",
    "readme.txt",
  ]);
});

test("deletes folder and file rows from their context menus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("treeitem", { name: "Root" }).click();

  const contents = page.getByRole("region", { name: "Folder contents" });
  await contents.getByText("Child").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete folder" })).toBeVisible();
  await expect(page.getByText('Delete "Child"?')).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(contents.getByText("Child")).toBeHidden();

  await contents.getByText("readme.txt").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete file" })).toBeVisible();
  await expect(page.getByText('Delete "readme.txt"?')).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(contents.getByText("readme.txt")).toBeHidden();
});

test("keeps the explorer usable without horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("treeitem", { name: "Root" }).click();

  await expect(page.getByRole("tree")).toBeVisible();
  await expect(page.getByRole("region", { name: "Folder contents" })).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.getByText("readme.txt")).toBeVisible();

  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth),
  ).toBe(true);

  await page.getByText("readme.txt").dispatchEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 388,
    clientY: 842,
  });
  await expect(page.getByRole("menu")).toBeVisible();

  const menuBox = await page.getByRole("menu").boundingBox();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.x).toBeGreaterThanOrEqual(0);
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(390);
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(844);
});
