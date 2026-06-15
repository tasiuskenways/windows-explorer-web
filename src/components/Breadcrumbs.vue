<script setup lang="ts">
import type { Breadcrumb } from "@windows-explorer/contracts";
defineProps<{ trail: Breadcrumb[] }>();
const emit = defineEmits<{ navigate: [id: string] }>();
</script>

<template>
  <nav
    class="crumbs"
    aria-label="Breadcrumb"
  >
    <span
      v-if="trail.length === 0"
      class="crumb"
    >This PC</span>
    <template
      v-for="(c, i) in trail"
      :key="c.id"
    >
      <span
        class="crumb"
        @click="emit('navigate', c.id)"
      >{{ c.name }}</span>
      <span
        v-if="i < trail.length - 1"
        class="crumb-sep"
      >›</span>
    </template>
  </nav>
</template>
