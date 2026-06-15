import { test, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useExplorerStore } from "./explorer.ts";
import type { ApiClient } from "../api/client.ts";

const folder = (id: string, parentId: string | null, name: string, hasChildren = false) => ({
  id, parentId, name, depth: 0, subfolderCount: hasChildren ? 1 : 0, fileCount: 0, hasChildren,
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const api = {
  getRoots: vi.fn(async () => ({ data: [folder("r", null, "Root", true)], pageInfo: { hasMore: false, nextCursor: null } })),
  getChildren: vi.fn(async () => ({ data: [folder("c", "r", "Child")], pageInfo: { hasMore: false, nextCursor: null } })),
} as unknown as ApiClient;

beforeEach(() => setActivePinia(createPinia()));

test("loadRoots populates the node map and root order", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  expect(store.rootIds).toEqual(["r"]);
  expect(store.nodes.get("r")!.name).toBe("Root");
});

test("expand fetches children once and toggles expanded state", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.expand("r");
  expect(store.expanded.has("r")).toBe(true);
  expect(store.childrenByParent.get("r")).toEqual(["c"]);
  await store.expand("r"); // collapse — no second fetch
  expect(api.getChildren).toHaveBeenCalledTimes(1);
});

test("visibleRows flattens expanded nodes with depth", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.expand("r");
  expect(store.visibleRows.map((r) => [r.node.id, r.depth])).toEqual([["r", 0], ["c", 1]]);
});

test("addFolderToParent inserts a created child into an already loaded branch", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.expand("r");
  store.addFolderToParent(folder("n", "r", "New folder"));
  expect(store.childrenByParent.get("r")).toEqual(["c", "n"]);
  expect(store.nodes.get("n")!.name).toBe("New folder");
});

test("renameFolderInCache updates visible folder names", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.expand("r");
  store.renameFolderInCache(folder("c", "r", "Reports"));
  expect(store.nodes.get("c")!.name).toBe("Reports");
});

test("removeFolderFromCache removes a cached subtree and updates parent metadata", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.expand("r");
  store.addFolderToParent(folder("g", "c", "Grandchild"));
  store.childrenByParent.set("c", ["g"]);
  store.expanded.add("c");
  store.select("g");

  store.removeFolderFromCache("c");

  expect(store.childrenByParent.get("r")).toEqual([]);
  expect(store.nodes.has("c")).toBe(false);
  expect(store.nodes.has("g")).toBe(false);
  expect(store.expanded.has("c")).toBe(false);
  expect(store.selectedId).toBe("r");
  expect(store.nodes.get("r")!.hasChildren).toBe(false);
});
