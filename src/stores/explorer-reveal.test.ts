import { test, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useExplorerStore } from "./explorer.ts";
import type { ApiClient } from "../api/client.ts";

const folder = (id: string, parentId: string | null, name: string, hasChildren = true) => ({
  id, parentId, name, depth: 0, subfolderCount: hasChildren ? 1 : 0, fileCount: 0, hasChildren, updatedAt: "",
});
const api = {
  getRoots: vi.fn(async () => ({ data: [folder("r", null, "Root")], pageInfo: { hasMore: false, nextCursor: null } })),
  getChildren: vi.fn(async (id: string) => ({
    data: id === "r" ? [folder("a", "r", "A")] : [folder("leaf", "a", "Leaf", false)],
    pageInfo: { hasMore: false, nextCursor: null },
  })),
} as unknown as ApiClient;

beforeEach(() => setActivePinia(createPinia()));

test("revealPath expands every ancestor and selects the target", async () => {
  const store = useExplorerStore(api);
  await store.loadRoots();
  await store.revealPath(["r", "a"], "leaf");
  expect(store.expanded.has("r")).toBe(true);
  expect(store.expanded.has("a")).toBe(true);
  expect(store.selectedId).toBe("leaf");
});
