<script setup lang="ts">
import { ref, computed } from "vue";
import type { Breadcrumb, FolderContents as FolderContentsData, SearchHit } from "@windows-explorer/contracts";
import FolderTree from "./FolderTree.vue";
import FolderContents from "./FolderContents.vue";
import SearchResults from "./SearchResults.vue";
import Breadcrumbs from "./Breadcrumbs.vue";
import SearchBar from "./SearchBar.vue";

type RenameTarget = { type: "folder" | "file"; id: string } | null;
type SortKey = "name" | "date" | "type" | "size";
type SortDirection = "asc" | "desc";

const props = defineProps<{
  query: string;
  results: SearchHit[];
  contents: FolderContentsData | null;
  trail: Breadcrumb[];
  renameTarget: RenameTarget;
}>();
const emit = defineEmits<{
  open: [id: string];
  "update:query": [value: string];
  selectResult: [hit: SearchHit];
  "create-folder": [];
  "create-file": [];
  "begin-rename": [type: "folder" | "file", id: string];
  "rename-folder": [id: string, name: string];
  "rename-file": [id: string, name: string];
  "delete-folder": [id: string];
  "delete-file": [id: string];
  "cancel-rename": [];
}>();

const searching = computed(() => props.query.trim().length > 0);
const navWidth = ref(290);
const toolbarMenu = ref<"new" | "sort" | null>(null);
const sortKey = ref<SortKey>("name");
const sortDirection = ref<SortDirection>("asc");
const sortOptions: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "date", label: "Date modified" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
];

const onSplitterMousedown = (e: MouseEvent) => {
  const startX = e.clientX;
  const startW = navWidth.value;
  const onMove = (ev: MouseEvent) => { navWidth.value = Math.max(160, Math.min(500, startW + ev.clientX - startX)); };
  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

const toggleTheme = () => document.documentElement.classList.toggle("dark");
const toggleToolbarMenu = (menu: "new" | "sort") => {
  toolbarMenu.value = toolbarMenu.value === menu ? null : menu;
};
const createFromToolbar = (type: "folder" | "file") => {
  toolbarMenu.value = null;
  if (type === "folder") emit("create-folder");
  else emit("create-file");
};
const chooseSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
  toolbarMenu.value = null;
};
</script>

<template>
  <div
    class="window"
    @click="toolbarMenu = null"
  >
    <div class="titlebar">
      <svg class="app-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2c.4 0 .78.16 1.06.44L11 7.5h8.5A1.5 1.5 0 0 1 21 9v8.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" fill="#ffca28" />
        <path d="M3 9h18v8.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V9Z" fill="#ffd95a" />
      </svg>
      <span class="title">File Explorer</span>
      <button class="theme-toggle" @click="toggleTheme">◐ Toggle theme</button>
      <div class="winbtns">
        <div class="winbtn"><svg viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor" /></svg></div>
        <div class="winbtn"><svg viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" /></svg></div>
        <div class="winbtn close"><svg viewBox="0 0 12 12"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.1" /></svg></div>
      </div>
    </div>

    <div
      class="toolbar"
      @click.stop
    >
      <div class="toolbar-item">
        <button
          class="tbtn"
          type="button"
          aria-label="New"
          aria-haspopup="menu"
          :aria-expanded="toolbarMenu === 'new'"
          @click="toggleToolbarMenu('new')"
        >
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
          New
          <svg class="caret" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" /></svg>
        </button>
        <div
          v-if="toolbarMenu === 'new'"
          class="toolbar-menu"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            @click="createFromToolbar('folder')"
          >
            New folder
          </button>
          <button
            type="button"
            role="menuitem"
            @click="createFromToolbar('file')"
          >
            New file
          </button>
        </div>
      </div>
      <div class="tsep"></div>
      <div class="toolbar-item">
        <button
          class="tbtn"
          type="button"
          aria-label="Sort"
          aria-haspopup="menu"
          :aria-expanded="toolbarMenu === 'sort'"
          @click="toggleToolbarMenu('sort')"
        >
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          Sort
          <svg class="caret" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" /></svg>
        </button>
        <div
          v-if="toolbarMenu === 'sort'"
          class="toolbar-menu"
          role="menu"
        >
          <button
            v-for="option in sortOptions"
            :key="option.key"
            type="button"
            role="menuitem"
            :class="{ active: sortKey === option.key }"
            @click="chooseSort(option.key)"
          >
            <span>{{ option.label }}</span>
            <span
              v-if="sortKey === option.key"
              aria-hidden="true"
            >
              {{ sortDirection === "asc" ? "↑" : "↓" }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="addressbar">
      <div v-if="searching" class="crumbs"><span class="crumb">Search</span></div>
      <Breadcrumbs v-else :trail="trail" @navigate="emit('open', $event)" />
      <SearchBar :model-value="query" @update:model-value="emit('update:query', $event)" />
    </div>

    <div class="body">
      <div class="nav-pane" :style="{ width: navWidth + 'px' }">
        <FolderTree @open="emit('open', $event)" />
      </div>
      <div class="splitter" @mousedown="onSplitterMousedown"></div>
      <SearchResults
        v-if="searching"
        :results="results"
        :query="query"
        @select="emit('selectResult', $event)"
      />
      <FolderContents
        v-else
        :contents="contents"
        :loading="false"
        :rename-target="renameTarget"
        :sort-key="sortKey"
        :sort-direction="sortDirection"
        @open="emit('open', $event)"
        @create-folder="emit('create-folder')"
        @create-file="emit('create-file')"
        @begin-rename="(type, id) => emit('begin-rename', type, id)"
        @rename-folder="(id, name) => emit('rename-folder', id, name)"
        @rename-file="(id, name) => emit('rename-file', id, name)"
        @delete-folder="emit('delete-folder', $event)"
        @delete-file="emit('delete-file', $event)"
        @cancel-rename="emit('cancel-rename')"
      />
    </div>

    <div class="statusbar">
      <span v-if="searching">{{ results.length }} result{{ results.length === 1 ? "" : "s" }}</span>
      <span v-else-if="contents">{{ contents.folder.subfolderCount + contents.folder.fileCount }} items</span>
      <span v-else>0 items</span>
    </div>
  </div>
</template>

<style scoped>
.nav-pane {
  display: flex;
  min-height: 0;
  flex-shrink: 0;
}

.toolbar-item {
  position: relative;
  display: inline-flex;
}

.toolbar-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 40;
  min-width: 178px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--pane);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.toolbar-menu button {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.toolbar-menu button:hover,
.toolbar-menu button.active {
  background: var(--hover);
}
</style>
