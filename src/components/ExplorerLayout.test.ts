import { beforeEach, expect, test } from "vitest";
import { fireEvent, render } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import ExplorerLayout from "./ExplorerLayout.vue";

const baseContents = {
  folder: {
    id: "r",
    parentId: null,
    name: "Root",
    depth: 0,
    subfolderCount: 1,
    fileCount: 2,
    hasChildren: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  folders: {
    data: [
      {
        id: "c",
        parentId: "r",
        name: "Child",
        depth: 1,
        subfolderCount: 0,
        fileCount: 0,
        hasChildren: false,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    pageInfo: { hasMore: false, nextCursor: null },
  },
  files: {
    data: [
      {
        id: "large",
        folderId: "r",
        name: "large.txt",
        extension: "txt",
        sizeBytes: 4096,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "small",
        folderId: "r",
        name: "small.txt",
        extension: "txt",
        sizeBytes: 256,
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ],
    pageInfo: { hasMore: false, nextCursor: null },
  },
};

const renderLayout = () => render(ExplorerLayout, {
  props: {
    query: "",
    results: [],
    contents: baseContents,
    trail: [{ id: "r", name: "Root" }],
    renameTarget: null,
  },
});

beforeEach(() => {
  setActivePinia(createPinia());
});

test("toolbar New menu emits create folder and create file actions", async () => {
  const { emitted, getByRole } = renderLayout();

  await fireEvent.click(getByRole("button", { name: "New" }));
  await fireEvent.click(getByRole("menuitem", { name: "New folder" }));
  expect(emitted()["create-folder"]).toBeTruthy();

  await fireEvent.click(getByRole("button", { name: "New" }));
  await fireEvent.click(getByRole("menuitem", { name: "New file" }));
  expect(emitted()["create-file"]).toBeTruthy();
});

test("toolbar Sort menu changes the visible file order", async () => {
  const { container, getByRole } = renderLayout();

  await fireEvent.click(getByRole("button", { name: "Sort" }));
  await fireEvent.click(getByRole("menuitem", { name: "Size" }));

  const itemNames = Array.from(container.querySelectorAll(".drow .item-name")).map((item) => item.textContent);
  expect(itemNames).toEqual(["Child", "small.txt", "large.txt"]);
});
