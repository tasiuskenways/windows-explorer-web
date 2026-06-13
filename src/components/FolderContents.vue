<script setup lang="ts">
import type { FolderContents } from "@windows-explorer/contracts";
import { computed } from "vue";
import FolderIcon from "./icons/FolderIcon.vue";
import FileIcon from "./icons/FileIcon.vue";
import { formatSize } from "../lib/format.ts";

const props = defineProps<{ contents: FolderContents | null; loading: boolean }>();
const emit = defineEmits<{ open: [id: string] }>();
const isEmpty = computed(() => props.contents && props.contents.folders.data.length === 0 && props.contents.files.data.length === 0);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
</script>

<template>
  <div class="content" role="region" aria-label="Folder contents">
    <div v-if="!contents" class="empty-state">Pick a folder on the left. Its subfolders and files appear here.</div>
    <div v-else-if="isEmpty" class="empty-state">This folder is empty.</div>
    <template v-else>
      <div class="col-head"><div>Name</div><div>Date modified</div><div>Type</div><div>Size</div></div>
      <div v-for="f in contents.folders.data" :key="f.id" class="drow" @dblclick="emit('open', f.id)">
        <div class="cell name"><FolderIcon class="ficon" />{{ f.name }}</div>
        <div class="cell dim">{{ fmtDate(f.updatedAt) }}</div>
        <div class="cell dim">File folder</div>
        <div class="cell dim"></div>
      </div>
      <div v-for="file in contents.files.data" :key="file.id" class="drow">
        <div class="cell name"><FileIcon :extension="file.extension" class="ficon" />{{ file.name }}</div>
        <div class="cell dim">{{ fmtDate(file.updatedAt) }}</div>
        <div class="cell dim">{{ (file.extension ?? "file").toUpperCase() }} File</div>
        <div class="cell dim">{{ formatSize(file.sizeBytes) }}</div>
      </div>
    </template>
  </div>
</template>
