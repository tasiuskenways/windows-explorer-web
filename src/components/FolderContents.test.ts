import { test, expect } from "vitest";
import { render } from "@testing-library/vue";
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
