import { ref, watch } from "vue";

export const useDebouncedSearch = <T>(run: (q: string, signal: AbortSignal) => Promise<T>, delayMs = 250) => {
  const query = ref("");
  const results = ref<T | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  watch(query, (q) => {
    clearTimeout(timer);
    controller?.abort();
    if (!q.trim()) { results.value = null; return; }
    timer = setTimeout(async () => {
      controller = new AbortController();
      try { results.value = await run(q, controller.signal); } catch (e) { if ((e as Error).name !== "AbortError") throw e; }
    }, delayMs);
  });

  return { query, results };
};
