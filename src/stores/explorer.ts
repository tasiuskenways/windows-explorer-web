import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Folder } from "@windows-explorer/contracts";
import { createApiClient, type ApiClient } from "../api/client.ts";

export interface VisibleRow { node: Folder; depth: number }

const defaultApi = createApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1");

export const useExplorerStore = (api: ApiClient = defaultApi) =>
  defineStore("explorer", () => {
    const nodes = ref(new Map<string, Folder>());
    const childrenByParent = ref(new Map<string, string[]>());
    const rootIds = ref<string[]>([]);
    const expanded = ref(new Set<string>());
    const loadingChildren = ref(new Set<string>());
    const selectedId = ref<string | null>(null);

    const merge = (list: Folder[]) => { for (const f of list) nodes.value.set(f.id, f); };
    const sortIds = (ids: string[]) =>
      ids.sort((a, b) => (nodes.value.get(a)?.name ?? "").localeCompare(nodes.value.get(b)?.name ?? ""));

    const loadRoots = async () => {
      const res = await api.getRoots();
      merge(res.data);
      rootIds.value = res.data.map((f) => f.id);
    };

    const loadChildren = async (id: string) => {
      if (childrenByParent.value.has(id)) return;
      loadingChildren.value.add(id);
      try {
        const res = await api.getChildren(id);
        merge(res.data);
        childrenByParent.value.set(id, res.data.map((f) => f.id));
      } finally {
        loadingChildren.value.delete(id);
      }
    };

    const expand = async (id: string) => {
      if (expanded.value.has(id)) { expanded.value.delete(id); return; }
      await loadChildren(id);
      expanded.value.add(id);
    };

    const select = (id: string) => { selectedId.value = id; };

    const addFolderToParent = (folder: Folder) => {
      nodes.value.set(folder.id, folder);
      const target = folder.parentId === null ? rootIds.value : childrenByParent.value.get(folder.parentId);
      if (!target || target.includes(folder.id)) return;
      target.push(folder.id);
      sortIds(target);
    };

    const renameFolderInCache = (folder: Folder) => {
      nodes.value.set(folder.id, folder);
      const target = folder.parentId === null ? rootIds.value : childrenByParent.value.get(folder.parentId);
      if (target) sortIds(target);
    };

    const revealPath = async (ancestorIds: string[], targetId: string) => {
      for (const id of ancestorIds) {
        await loadChildren(id);
        expanded.value.add(id);
      }
      select(targetId);
    };

    const visibleRows = computed<VisibleRow[]>(() => {
      const rows: VisibleRow[] = [];
      const walk = (id: string, depth: number) => {
        const node = nodes.value.get(id);
        if (!node) return;
        rows.push({ node, depth });
        if (expanded.value.has(id)) for (const childId of childrenByParent.value.get(id) ?? []) walk(childId, depth + 1);
      };
      for (const id of rootIds.value) walk(id, 0);
      return rows;
    });

    return { nodes, childrenByParent, rootIds, expanded, loadingChildren, selectedId,
      loadRoots, loadChildren, expand, select, addFolderToParent, renameFolderInCache, revealPath, visibleRows };
  })();
