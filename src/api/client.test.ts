import { test, expect, vi } from "vitest";
import { createApiClient } from "./client.ts";

test("getRoots calls the roots endpoint and returns parsed data", async () => {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ data: [{ id: "a", name: "A" }], pageInfo: { hasMore: false, nextCursor: null } }), { status: 200 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  const res = await api.getRoots();
  expect(fetchMock).toHaveBeenCalledWith("http://api/folders/roots?limit=100", expect.any(Object));
  expect(res.data[0]!.id).toBe("a");
});

test("throws ApiError on non-2xx", async () => {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "x" } }), { status: 404 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  await expect(api.getContents("z")).rejects.toThrow("NOT_FOUND");
});
