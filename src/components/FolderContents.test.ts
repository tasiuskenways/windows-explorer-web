import { test, expect } from "vitest";
import { fireEvent, render } from "@testing-library/vue";
import FolderContents from "./FolderContents.vue";

const contents = {
  folder: { id: "r", parentId: null, name: "Root", depth: 0, subfolderCount: 1, fileCount: 1, hasChildren: true, updatedAt: "2026-01-01T00:00:00.000Z" },
  folders: { data: [{ id: "c", parentId: "r", name: "Child", depth: 1, subfolderCount: 0, fileCount: 0, hasChildren: false, updatedAt: "2026-01-01T00:00:00.000Z" }], pageInfo: { hasMore: false, nextCursor: null } },
  files: { data: [{ id: "f", folderId: "r", name: "a.txt", extension: "txt", sizeBytes: 2048, updatedAt: "2026-01-01T00:00:00.000Z" }], pageInfo: { hasMore: false, nextCursor: null } },
};

test("lists folders then files with a human-readable size", () => {
  const { getByText } = render(FolderContents, { props: { contents, loading: false } });
  expect(getByText("Child")).toBeTruthy();
  expect(getByText("a.txt")).toBeTruthy();
  expect(getByText("2 KB")).toBeTruthy();
});

test("shows the empty state with no contents", () => {
  const empty = { ...contents, folders: { data: [], pageInfo: { hasMore: false, nextCursor: null } }, files: { data: [], pageInfo: { hasMore: false, nextCursor: null } } };
  const { getByText } = render(FolderContents, { props: { contents: empty, loading: false } });
  expect(getByText(/empty/i)).toBeTruthy();
});

test("opens a creation context menu from right click", async () => {
  const { getByLabelText, getByRole, emitted } = render(FolderContents, { props: { contents, loading: false } });
  await fireEvent.contextMenu(getByLabelText("Folder contents"), { clientX: 40, clientY: 60 });
  expect(getByRole("menu")).toBeTruthy();
  await fireEvent.click(getByRole("menuitem", { name: "New folder" }));
  expect(emitted()["create-folder"]).toBeTruthy();
});

test("right clicking a folder row opens a rename-only context menu", async () => {
  const { getByText, getByRole, queryByRole, emitted } = render(FolderContents, { props: { contents, loading: false } });
  await fireEvent.contextMenu(getByText("Child"));
  expect(getByRole("menuitem", { name: "Rename" })).toBeTruthy();
  expect(queryByRole("menuitem", { name: "New folder" })).toBeNull();
  await fireEvent.click(getByRole("menuitem", { name: "Rename" }));
  expect(emitted()["begin-rename"][0]).toEqual(["folder", "c"]);
});

test("right clicking a file row opens a rename-only context menu", async () => {
  const { getByText, getByRole, queryByRole, emitted } = render(FolderContents, { props: { contents, loading: false } });
  await fireEvent.contextMenu(getByText("a.txt"));
  expect(getByRole("menuitem", { name: "Rename" })).toBeTruthy();
  expect(queryByRole("menuitem", { name: "New file" })).toBeNull();
  await fireEvent.click(getByRole("menuitem", { name: "Rename" }));
  expect(emitted()["begin-rename"][0]).toEqual(["file", "f"]);
});

test("commits inline folder rename on Enter", async () => {
  const { getByDisplayValue, emitted } = render(FolderContents, {
    props: { contents, loading: false, renameTarget: { type: "folder", id: "c" } },
  });
  const input = getByDisplayValue("Child");
  await fireEvent.update(input, "Reports");
  await fireEvent.keyDown(input, { key: "Enter" });
  expect(emitted()["rename-folder"][0]).toEqual(["c", "Reports"]);
});

test("cancels inline rename on Escape", async () => {
  const { getByDisplayValue, emitted } = render(FolderContents, {
    props: { contents, loading: false, renameTarget: { type: "file", id: "f" } },
  });
  await fireEvent.keyDown(getByDisplayValue("a.txt"), { key: "Escape" });
  expect(emitted()["cancel-rename"]).toBeTruthy();
  expect(emitted()["rename-file"]).toBeUndefined();
});
