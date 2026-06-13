<script setup lang="ts">
const props = defineProps<{ extension: string | null }>();
const fileColors: Record<string, string> = {
  docx: '#2b579a', xlsx: '#217346', pdf: '#d1352b', md: '#6b7280',
  json: '#cc9a06', ts: '#2f74c0', txt: '#7a7a7a', png: '#8a63d2', yml: '#be5b1d',
};
const color = () => fileColors[props.extension ?? ''] ?? '#8a8a8a';
const label = () => (props.extension ?? '').slice(0, 4).toUpperCase();
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" fill="#fff" stroke="#c8c8c8" stroke-width="1"/>
    <path d="M14 3l4 4h-4V3Z" fill="#dcdcdc"/>
    <rect x="4.5" y="13" width="13" height="7.5" rx="1.4" :fill="color()"/>
    <text x="11" y="18.4" font-size="5.2" font-family="Segoe UI, sans-serif" font-weight="700" fill="#fff" text-anchor="middle">{{ label() }}</text>
  </svg>
</template>
