<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Breadcrumb, FolderContents, SearchHit } from "@windows-explorer/contracts";
import ExplorerLayout from "./components/ExplorerLayout.vue";
import { useExplorerStore } from "./stores/explorer.ts";
import { createApiClient } from "./api/client.ts";
import { useDebouncedSearch } from "./composables/useDebouncedSearch.ts";

const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1");
const store = useExplorerStore(api);
const contents = ref<FolderContents | null>(null);
const trail = ref<Breadcrumb[]>([]);

const { query, results } = useDebouncedSearch<SearchHit[]>((q, signal) =>
  api.search(q, signal).then((r) => r.data),
);

const open = async (id: string) => {
  store.select(id);
  [contents.value, trail.value] = await Promise.all([
    api.getContents(id),
    api.getBreadcrumbs(id).then((r) => r.data),
  ]);
};

const selectResult = async (hit: SearchHit) => {
  query.value = hit.name;
  const folderId = hit.type === "folder" ? hit.id : hit.ancestors.at(-1)?.id;
  if (folderId) await store.revealPath(hit.ancestors.map((a) => a.id), folderId);
};

onMounted(() => store.loadRoots());
</script>

<template>
  <ExplorerLayout
    :query="query"
    :results="results ?? []"
    :contents="contents"
    :trail="trail"
    @update:query="query = $event"
    @open="open"
    @select-result="selectResult"
  />
</template>
