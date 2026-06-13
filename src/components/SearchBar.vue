<script setup lang="ts">
import type { SearchHit } from "@windows-explorer/contracts";
import { createApiClient } from "../api/client.ts";
import { useDebouncedSearch } from "../composables/useDebouncedSearch.ts";

const emit = defineEmits<{ reveal: [hit: SearchHit] }>();

const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1");
const { query, results } = useDebouncedSearch(
  (q, signal) => api.search(q, signal).then((res) => res.data),
);
</script>

<template>
  <label class="search">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.6" />
      <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
    <input
      type="search"
      placeholder="Search"
      :value="query"
      @input="query = ($event.target as HTMLInputElement).value"
    />
    <div v-if="results && results.length" class="search-results">
      <div
        v-for="hit in results"
        :key="hit.id"
        class="search-result"
        @click="emit('reveal', hit)"
      >{{ hit.name }}</div>
    </div>
  </label>
</template>

<style scoped>
.search {
  position: relative;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--pane);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 260px;
  overflow-y: auto;
}
.search-result {
  padding: 6px 12px;
  font-size: 13px;
  cursor: default;
}
.search-result:hover {
  background: var(--hover);
}
</style>
