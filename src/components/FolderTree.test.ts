import { test, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { render } from "@testing-library/vue";
import FolderTree from "./FolderTree.vue";
import { useExplorerStore } from "../stores/explorer.ts";

beforeEach(() => setActivePinia(createPinia()));

test("renders a treeitem per visible row", async () => {
  const store = useExplorerStore();
  store.nodes.set("r", { id: "r", parentId: null, name: "Root", depth: 0, subfolderCount: 0, fileCount: 0, hasChildren: false, updatedAt: "" });
  store.rootIds = ["r"];
  const { findAllByRole } = render(FolderTree);
  expect((await findAllByRole("treeitem")).length).toBe(1);
});
