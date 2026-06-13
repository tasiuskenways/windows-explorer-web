<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Breadcrumb, FolderContents, SearchHit } from "@windows-explorer/contracts";
import ExplorerLayout from "./components/ExplorerLayout.vue";
import { useExplorerStore } from "./stores/explorer.ts";
import { createApiClient } from "./api/client.ts";

const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1");
const store = useExplorerStore(api);
const contents = ref<FolderContents | null>(null);
const trail = ref<Breadcrumb[]>([]);

const open = async (id: string) => {
  store.select(id);
  [contents.value, trail.value] = await Promise.all([
    api.getContents(id),
    api.getBreadcrumbs(id).then((r) => r.data),
  ]);
};

const reveal = async (hit: SearchHit) => {
  const target = hit.type === "folder" ? hit.id : hit.ancestors.at(-1)!.id;
  await store.revealPath(hit.ancestors.map((a) => a.id), target);
  await open(target);
};

onMounted(() => store.loadRoots());
</script>

<template>
  <ExplorerLayout :contents="contents" :trail="trail" @open="open" @reveal="reveal" />
</template>
