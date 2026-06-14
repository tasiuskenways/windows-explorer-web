<script setup lang="ts">
defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
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
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<style scoped>
.search {
  width: 230px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: var(--pane);
  border: 1px solid var(--border);
  border-radius: 6px;
  flex-shrink: 0;
}
.search:focus-within {
  border-color: var(--accent);
}
.search svg {
  width: 14px;
  height: 14px;
  color: var(--text-dim);
  flex-shrink: 0;
}
.search input {
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--text);
  width: 100%;
}
.search input::placeholder {
  color: var(--text-dim);
}
</style>
