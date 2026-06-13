<script setup lang="ts">
import type { Folder } from "@windows-explorer/contracts";
import ChevronIcon from "./icons/ChevronIcon.vue";
import FolderIcon from "./icons/FolderIcon.vue";

defineProps<{ node: Folder; depth: number; expanded: boolean; selected: boolean; loading: boolean }>();
const emit = defineEmits<{ toggle: [id: string]; select: [id: string] }>();
</script>

<template>
  <div
    class="trow"
    role="treeitem"
    :aria-level="depth + 1"
    :aria-expanded="node.hasChildren ? expanded : undefined"
    :aria-selected="selected"
    :class="{ selected, open: expanded }"
    :style="{ paddingLeft: 6 + depth * 18 + 'px' }"
    @click="emit('select', node.id)"
  >
    <span
      v-if="node.hasChildren"
      class="chev"
      data-testid="chevron"
      @click.stop="emit('toggle', node.id)"
    ><ChevronIcon /></span>
    <span v-else class="chev empty" />
    <FolderIcon class="ficon" />
    <span class="tname">{{ node.name }}</span>
  </div>
</template>
