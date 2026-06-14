<script setup lang="ts">
import { ref, computed } from "vue";
import type { Breadcrumb, FolderContents as FolderContentsData, SearchHit } from "@windows-explorer/contracts";
import FolderTree from "./FolderTree.vue";
import FolderContents from "./FolderContents.vue";
import SearchResults from "./SearchResults.vue";
import Breadcrumbs from "./Breadcrumbs.vue";
import SearchBar from "./SearchBar.vue";

const props = defineProps<{
  query: string;
  results: SearchHit[];
  contents: FolderContentsData | null;
  trail: Breadcrumb[];
}>();
const emit = defineEmits<{
  open: [id: string];
  "update:query": [value: string];
  selectResult: [hit: SearchHit];
}>();

const searching = computed(() => props.query.trim().length > 0);
const navWidth = ref(290);

const onSplitterMousedown = (e: MouseEvent) => {
  const startX = e.clientX;
  const startW = navWidth.value;
  const onMove = (ev: MouseEvent) => { navWidth.value = Math.max(160, Math.min(500, startW + ev.clientX - startX)); };
  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

const toggleTheme = () => document.documentElement.classList.toggle("dark");
</script>

<template>
  <div class="window">
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

    <div class="toolbar">
      <div class="tbtn">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        New
        <svg class="caret" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" /></svg>
      </div>
      <div class="tsep"></div>
      <div class="tbtn">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        Sort
        <svg class="caret" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" /></svg>
      </div>
    </div>

    <div class="addressbar">
      <Breadcrumbs :trail="trail" @navigate="emit('open', $event)" />
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
        @open="emit('open', $event)"
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
</style>
