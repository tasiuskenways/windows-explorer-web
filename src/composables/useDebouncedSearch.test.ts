import { test, expect, vi } from "vitest";
import { useDebouncedSearch } from "./useDebouncedSearch.ts";

test("debounces and only runs the latest query", async () => {
  vi.useFakeTimers();
  const run = vi.fn(async (q: string) => [q]);
  const { query } = useDebouncedSearch(run, 200);
  query.value = "a";
  query.value = "ab";
  query.value = "abc";
  await vi.advanceTimersByTimeAsync(250);
  expect(run).toHaveBeenCalledTimes(1);
  expect(run).toHaveBeenCalledWith("abc", expect.any(AbortSignal));
  vi.useRealTimers();
});
