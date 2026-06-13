import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import FolderTreeNode from "./FolderTreeNode.vue";

const node = { id: "a", parentId: null, name: "Docs", depth: 1, subfolderCount: 2, fileCount: 0, hasChildren: true, updatedAt: "" };

test("renders name, indents by depth, sets aria attributes", () => {
  const { getByRole } = render(FolderTreeNode, { props: { node, depth: 1, expanded: false, selected: false, loading: false } });
  const row = getByRole("treeitem");
  expect(row.getAttribute("aria-level")).toBe("2");
  expect(row.getAttribute("aria-expanded")).toBe("false");
  expect(row.textContent).toContain("Docs");
});

test("clicking the chevron emits toggle, clicking the row emits select", async () => {
  const { getByRole, getByTestId, emitted } = render(FolderTreeNode, { props: { node, depth: 0, expanded: false, selected: false, loading: false } });
  await fireEvent.click(getByTestId("chevron"));
  expect(emitted().toggle).toBeTruthy();
  await fireEvent.click(getByRole("treeitem"));
  expect(emitted().select).toBeTruthy();
});
