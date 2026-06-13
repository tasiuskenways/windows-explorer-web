<script setup lang="ts">
import { ref, computed } from "vue";
import { useExplorerStore } from "../stores/explorer.ts";
import { useVirtualList } from "../composables/useVirtualList.ts";
import FolderTreeNode from "./FolderTreeNode.vue";

const store = useExplorerStore();
const emit = defineEmits<{ open: [id: string] }>();
const ROW = 30;
const viewport = ref<HTMLElement | null>(null);
const viewportHeight = ref(600);
const scrollTop = ref(0);

const rows = computed(() => store.visibleRows);
const { totalHeight, offsetY, visibleItems } = useVirtualList(rows, { rowHeight: ROW, viewportHeight, scrollTop, overscan: 4 });

const onScroll = () => { if (viewport.value) scrollTop.value = viewport.value.scrollTop; };
const onSelect = (id: string) => { store.select(id); emit("open", id); };
</script>

<template>
  <div ref="viewport" class="nav" role="tree" aria-label="Folder tree" @scroll="onScroll">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <FolderTreeNode
          v-for="{ item } in visibleItems"
          :key="item.node.id"
          :node="item.node"
          :depth="item.depth"
          :expanded="store.expanded.has(item.node.id)"
          :selected="store.selectedId === item.node.id"
          :loading="store.loadingChildren.has(item.node.id)"
          @toggle="store.expand"
          @select="onSelect"
        />
      </div>
    </div>
  </div>
</template>
