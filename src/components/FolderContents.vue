<script setup lang="ts">
import type { FileItem, Folder, FolderContents } from "@windows-explorer/contracts";
import { computed, nextTick, ref, watch } from "vue";
import FolderIcon from "./icons/FolderIcon.vue";
import FileIcon from "./icons/FileIcon.vue";
import { formatSize } from "../lib/format.ts";

type RenameTarget = { type: "folder" | "file"; id: string } | null;
type SortKey = "name" | "date" | "type" | "size";
type SortDirection = "asc" | "desc";

const props = defineProps<{
  contents: FolderContents | null;
  loading: boolean;
  renameTarget?: RenameTarget;
  sortKey?: SortKey;
  sortDirection?: SortDirection;
}>();
const emit = defineEmits<{
  open: [id: string];
  "create-folder": [];
  "create-file": [];
  "begin-rename": [type: "folder" | "file", id: string];
  "rename-folder": [id: string, name: string];
  "rename-file": [id: string, name: string];
  "cancel-rename": [];
}>();
const isEmpty = computed(() => props.contents && props.contents.folders.data.length === 0 && props.contents.files.data.length === 0);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
const fileType = (file: FileItem) => `${(file.extension ?? "file").toUpperCase()} File`;
const sortKey = computed(() => props.sortKey ?? "name");
const sortDirection = computed(() => props.sortDirection ?? "asc");
const directionMultiplier = computed(() => sortDirection.value === "asc" ? 1 : -1);

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const compareValues = (a: string | number, b: string | number) => {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return compareText(String(a), String(b));
};
const folderSortValue = (folder: Folder) => {
  if (sortKey.value === "date") return Date.parse(folder.updatedAt);
  if (sortKey.value === "type") return "File folder";
  if (sortKey.value === "size") return 0;
  return folder.name;
};
const fileSortValue = (file: FileItem) => {
  if (sortKey.value === "date") return Date.parse(file.updatedAt);
  if (sortKey.value === "type") return fileType(file);
  if (sortKey.value === "size") return file.sizeBytes;
  return file.name;
};
const compareFolders = (a: Folder, b: Folder) =>
  (compareValues(folderSortValue(a), folderSortValue(b)) * directionMultiplier.value) || compareText(a.name, b.name);
const compareFiles = (a: FileItem, b: FileItem) =>
  (compareValues(fileSortValue(a), fileSortValue(b)) * directionMultiplier.value) || compareText(a.name, b.name);
const sortedFolders = computed(() => [...(props.contents?.folders.data ?? [])].sort(compareFolders));
const sortedFiles = computed(() => [...(props.contents?.files.data ?? [])].sort(compareFiles));

const menu = ref<
  | { kind: "background"; x: number; y: number }
  | { kind: "item"; type: "folder" | "file"; id: string; x: number; y: number }
  | null
>(null);
const MENU_MARGIN = 8;
const MENU_WIDTH = 178;
const MENU_HEIGHT = {
  background: 76,
  item: 42,
} as const;
const draftName = ref("");
const renameInput = ref<HTMLInputElement | HTMLInputElement[] | null>(null);
const renameTarget = computed(() => props.renameTarget ?? null);
const renameFinished = ref(false);

const currentRenameName = () => {
  if (!props.contents || !renameTarget.value) return "";
  return renameTarget.value.type === "folder"
    ? props.contents.folders.data.find((f) => f.id === renameTarget.value?.id)?.name ?? ""
    : props.contents.files.data.find((f) => f.id === renameTarget.value?.id)?.name ?? "";
};

watch(renameTarget, async (target) => {
  renameFinished.value = false;
  if (!target) return;
  draftName.value = currentRenameName();
  await nextTick();
  const input = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
  input?.focus();
  input?.select();
}, { immediate: true });

const isRenaming = (type: "folder" | "file", id: string) => renameTarget.value?.type === type && renameTarget.value.id === id;
const closeMenu = () => { menu.value = null; };
const clampMenuPosition = (event: MouseEvent, kind: "background" | "item") => {
  const maxX = Math.max(MENU_MARGIN, window.innerWidth - MENU_WIDTH - MENU_MARGIN);
  const maxY = Math.max(MENU_MARGIN, window.innerHeight - MENU_HEIGHT[kind] - MENU_MARGIN);
  return {
    x: Math.max(MENU_MARGIN, Math.min(event.clientX, maxX)),
    y: Math.max(MENU_MARGIN, Math.min(event.clientY, maxY)),
  };
};
const openMenu = (event: MouseEvent) => {
  if (!props.contents) return;
  const { x, y } = clampMenuPosition(event, "background");
  menu.value = { kind: "background", x, y };
};
const openItemMenu = (event: MouseEvent, type: "folder" | "file", id: string) => {
  const { x, y } = clampMenuPosition(event, "item");
  menu.value = { kind: "item", type, id, x, y };
};
const emitCreate = (type: "folder" | "file") => {
  closeMenu();
  if (type === "folder") emit("create-folder");
  else emit("create-file");
};
const beginRename = () => {
  if (!menu.value || menu.value.kind !== "item") return;
  const { type, id } = menu.value;
  closeMenu();
  emit("begin-rename", type, id);
};
const cancelRename = () => {
  if (renameFinished.value) return;
  renameFinished.value = true;
  emit("cancel-rename");
};
const commitRename = () => {
  const target = renameTarget.value;
  if (!target || renameFinished.value) return;
  const name = draftName.value.trim();
  renameFinished.value = true;
  if (!name) { emit("cancel-rename"); return; }
  if (target.type === "folder") emit("rename-folder", target.id, name);
  else emit("rename-file", target.id, name);
};
const onRenameKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") { event.preventDefault(); commitRename(); }
  if (event.key === "Escape") { event.preventDefault(); cancelRename(); }
};
</script>

<template>
  <div
    class="content"
    role="region"
    aria-label="Folder contents"
    @contextmenu.prevent="openMenu"
    @click="closeMenu"
  >
    <div
      v-if="!contents"
      class="empty-state"
    >
      Pick a folder on the left. Its subfolders and files appear here.
    </div>
    <div
      v-else-if="isEmpty"
      class="empty-state"
    >
      This folder is empty.
    </div>
    <template v-else>
      <div class="col-head">
        <div>Name</div><div>Date modified</div><div>Type</div><div>Size</div>
      </div>
      <div
        v-for="f in sortedFolders"
        :key="f.id"
        class="drow"
        :class="{ selected: isRenaming('folder', f.id) }"
        @contextmenu.stop.prevent="openItemMenu($event, 'folder', f.id)"
        @dblclick="emit('open', f.id)"
      >
        <div class="cell name">
          <FolderIcon class="ficon" />
          <input
            v-if="isRenaming('folder', f.id)"
            ref="renameInput"
            v-model="draftName"
            class="rename-input"
            aria-label="Rename folder"
            @click.stop
            @blur="commitRename"
            @keydown="onRenameKeydown"
          >
          <template v-else>
            <span class="item-name">{{ f.name }}</span>
          </template>
        </div>
        <div class="cell dim">
          {{ fmtDate(f.updatedAt) }}
        </div>
        <div class="cell dim">
          File folder
        </div>
        <div class="cell dim" />
      </div>
      <div
        v-for="file in sortedFiles"
        :key="file.id"
        class="drow"
        :class="{ selected: isRenaming('file', file.id) }"
        @contextmenu.stop.prevent="openItemMenu($event, 'file', file.id)"
      >
        <div class="cell name">
          <FileIcon
            :extension="file.extension"
            class="ficon"
          />
          <input
            v-if="isRenaming('file', file.id)"
            ref="renameInput"
            v-model="draftName"
            class="rename-input"
            aria-label="Rename file"
            @click.stop
            @blur="commitRename"
            @keydown="onRenameKeydown"
          >
          <template v-else>
            <span class="item-name">{{ file.name }}</span>
          </template>
        </div>
        <div class="cell dim">
          {{ fmtDate(file.updatedAt) }}
        </div>
        <div class="cell dim">
          {{ fileType(file) }}
        </div>
        <div class="cell dim">
          {{ formatSize(file.sizeBytes) }}
        </div>
      </div>
    </template>
    <div
      v-if="menu"
      class="context-menu"
      role="menu"
      :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
      @click.stop
    >
      <template v-if="menu.kind === 'background'">
        <button
          type="button"
          role="menuitem"
          @click="emitCreate('folder')"
        >
          <FolderIcon class="menu-icon" />
          New folder
        </button>
        <button
          type="button"
          role="menuitem"
          @click="emitCreate('file')"
        >
          <FileIcon
            extension="txt"
            class="menu-icon"
          />
          New file
        </button>
      </template>
      <button
        v-else
        type="button"
        role="menuitem"
        @click="beginRename"
      >
        Rename
      </button>
    </div>
  </div>
</template>

<style scoped>
.rename-input {
  width: min(320px, 100%);
  min-width: 0;
  height: 24px;
  border: 1px solid var(--accent);
  border-radius: 3px;
  background: var(--pane);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  padding: 1px 5px;
}

.context-menu {
  position: fixed;
  z-index: 50;
  min-width: 178px;
  max-width: calc(100vw - 16px);
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--pane);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.context-menu button {
  width: 100%;
  min-width: 0;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: default;
}

.context-menu button:hover {
  background: var(--hover);
}

.menu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
