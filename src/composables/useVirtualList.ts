import { computed, type Ref } from "vue";

interface Options { rowHeight: number; viewportHeight: Ref<number>; scrollTop: Ref<number>; overscan?: number }
export interface VirtualItem<T> { item: T; index: number }

export const useVirtualList = <T>(items: Ref<T[]>, opts: Options) => {
  const overscan = opts.overscan ?? 4;
  const totalHeight = computed(() => items.value.length * opts.rowHeight);
  const startIndex = computed(() => Math.max(0, Math.floor(opts.scrollTop.value / opts.rowHeight) - overscan));
  const visibleCount = computed(() => Math.ceil(opts.viewportHeight.value / opts.rowHeight) + overscan * 2);
  const endIndex = computed(() => Math.min(items.value.length, startIndex.value + visibleCount.value));
  const offsetY = computed(() => startIndex.value * opts.rowHeight);
  const visibleItems = computed<VirtualItem<T>[]>(() =>
    items.value.slice(startIndex.value, endIndex.value).map((item, i) => ({ item, index: startIndex.value + i })));

  return { totalHeight, startIndex, endIndex, offsetY, visibleItems };
};
