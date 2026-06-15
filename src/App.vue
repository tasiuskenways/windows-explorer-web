<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Breadcrumb, FileItem, Folder, FolderContents, SearchHit } from "@windows-explorer/contracts";
import ExplorerLayout from "./components/ExplorerLayout.vue";
import { useExplorerStore } from "./stores/explorer.ts";
import { createApiClient } from "./api/client.ts";
import { useDebouncedSearch } from "./composables/useDebouncedSearch.ts";

const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1");
const store = useExplorerStore(api);
const contents = ref<FolderContents | null>(null);
const trail = ref<Breadcrumb[]>([]);
const renameTarget = ref<{ type: "folder" | "file"; id: string } | null>(null);

const { query, results } = useDebouncedSearch<SearchHit[]>((q, signal) =>
  api.search(q, signal).then((r) => r.data),
);

const open = async (id: string) => {
  query.value = "";
  renameTarget.value = null;
  store.select(id);
  [contents.value, trail.value] = await Promise.all([
    api.getContents(id),
    api.getBreadcrumbs(id).then((r) => r.data),
  ]);
};

const selectResult = async (hit: SearchHit) => {
  query.value = hit.name;
  renameTarget.value = null;
  const folderId = hit.type === "folder" ? hit.id : hit.ancestors.at(-1)?.id;
  if (folderId) await store.revealPath(hit.ancestors.map((a) => a.id), folderId);
};

const createFolder = async () => {
  if (!contents.value) return;
  const parentId = contents.value.folder.id;
  const folder = await api.createFolder(parentId);
  contents.value = {
    ...contents.value,
    folder: {
      ...contents.value.folder,
      subfolderCount: contents.value.folder.subfolderCount + 1,
      hasChildren: true,
    },
    folders: {
      ...contents.value.folders,
      data: [...contents.value.folders.data, folder],
    },
  };
  store.addFolderToParent(folder);
  store.select(folder.id);
  renameTarget.value = { type: "folder", id: folder.id };
};

const createFile = async () => {
  if (!contents.value) return;
  const folderId = contents.value.folder.id;
  const file = await api.createFile(folderId);
  contents.value = {
    ...contents.value,
    folder: {
      ...contents.value.folder,
      fileCount: contents.value.folder.fileCount + 1,
    },
    files: {
      ...contents.value.files,
      data: [...contents.value.files.data, file],
    },
  };
  renameTarget.value = { type: "file", id: file.id };
};

const beginRename = (type: "folder" | "file", id: string) => {
  renameTarget.value = { type, id };
};

const replaceFolderInContents = (folder: Folder) => {
  if (!contents.value) return;
  contents.value = {
    ...contents.value,
    folder: contents.value.folder.id === folder.id ? folder : contents.value.folder,
    folders: {
      ...contents.value.folders,
      data: contents.value.folders.data.map((f) => f.id === folder.id ? folder : f),
    },
  };
};

const replaceFileInContents = (file: FileItem) => {
  if (!contents.value) return;
  contents.value = {
    ...contents.value,
    files: {
      ...contents.value.files,
      data: contents.value.files.data.map((f) => f.id === file.id ? file : f),
    },
  };
};

const renameFolder = async (id: string, name: string) => {
  const folder = await api.renameFolder(id, name);
  store.renameFolderInCache(folder);
  replaceFolderInContents(folder);
  renameTarget.value = null;
};

const renameFile = async (id: string, name: string) => {
  if (!contents.value) return;
  const file = await api.renameFile(contents.value.folder.id, id, name);
  replaceFileInContents(file);
  renameTarget.value = null;
};

const cancelRename = () => { renameTarget.value = null; };

onMounted(() => store.loadRoots());
</script>

<template>
  <ExplorerLayout
    :query="query"
    :results="results ?? []"
    :contents="contents"
    :trail="trail"
    :rename-target="renameTarget"
    @update:query="query = $event"
    @open="open"
    @select-result="selectResult"
    @create-folder="createFolder"
    @create-file="createFile"
    @begin-rename="beginRename"
    @rename-folder="renameFolder"
    @rename-file="renameFile"
    @cancel-rename="cancelRename"
  />
</template>
