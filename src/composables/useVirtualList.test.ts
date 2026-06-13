import { test, expect } from "vitest";
import { ref } from "vue";
import { useVirtualList } from "./useVirtualList.ts";

test("windows the visible slice from scrollTop and viewport height", () => {
  const items = ref(Array.from({ length: 1000 }, (_, i) => i));
  const scrollTop = ref(0);
  const v = useVirtualList(items, { rowHeight: 30, viewportHeight: ref(300), scrollTop, overscan: 2 });

  expect(v.totalHeight.value).toBe(30000);
  expect(v.startIndex.value).toBe(0);
  expect(v.visibleItems.value[0]!.index).toBe(0);

  scrollTop.value = 3000; // 100 rows down
  expect(v.startIndex.value).toBe(98); // 100 - overscan
  expect(v.offsetY.value).toBe(98 * 30);
});
