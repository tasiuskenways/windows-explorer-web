<script setup lang="ts">
import type { SearchHit } from "@windows-explorer/contracts";
import FolderIcon from "./icons/FolderIcon.vue";
import FileIcon from "./icons/FileIcon.vue";

defineProps<{ results: SearchHit[]; query: string }>();

const extOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1) : null;
};
const locationOf = (hit: SearchHit) => hit.ancestors.map((a) => a.name).join(" › ") || "This PC";
const typeOf = (hit: SearchHit) =>
  hit.type === "folder" ? "File folder" : `${(extOf(hit.name) ?? "file").toUpperCase()} File`;
</script>

<template>
  <div class="content" role="region" aria-label="Search results">
    <div v-if="!results.length" class="empty-state">No results for “{{ query }}”.</div>
    <template v-else>
      <div class="sr-head">
        <div>Name</div>
        <div>Location</div>
        <div>Type</div>
      </div>
      <div v-for="hit in results" :key="hit.id" class="srow">
        <div class="cell name">
          <FolderIcon v-if="hit.type === 'folder'" class="ficon" />
          <FileIcon v-else :extension="extOf(hit.name)" class="ficon" />
          {{ hit.name }}
        </div>
        <div class="cell dim">{{ locationOf(hit) }}</div>
        <div class="cell dim">{{ typeOf(hit) }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sr-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr 130px;
  background: var(--pane);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-dim);
}
.sr-head > div {
  padding: 8px 12px;
}
.srow {
  display: grid;
  grid-template-columns: 1fr 1fr 130px;
  align-items: center;
  height: 34px;
  margin: 1px 6px;
  border-radius: 5px;
  cursor: default;
  font-size: 13px;
}
.srow:hover {
  background: var(--hover);
}
.srow .cell {
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srow .name {
  display: flex;
  align-items: center;
  gap: 9px;
}
.srow .name .ficon {
  margin: 0;
}
</style>
