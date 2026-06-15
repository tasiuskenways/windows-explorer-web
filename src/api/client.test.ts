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

test("createFolder posts an optional name and returns the created folder", async () => {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ data: { id: "new", parentId: "r", name: "New folder" } }), { status: 200 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  const folder = await api.createFolder("r");
  expect(fetchMock).toHaveBeenCalledWith("http://api/folders/r/folders", expect.objectContaining({
    method: "POST",
    body: "{}",
  }));
  expect(folder.name).toBe("New folder");
});

test("renameFile patches the nested file route", async () => {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ data: { id: "f", folderId: "r", name: "Notes.md", extension: "md" } }), { status: 200 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  const file = await api.renameFile("r", "f", "Notes.md");
  expect(fetchMock).toHaveBeenCalledWith("http://api/folders/r/files/f", expect.objectContaining({
    method: "PATCH",
    body: JSON.stringify({ name: "Notes.md" }),
  }));
  expect(file.extension).toBe("md");
});

test("deleteFolder calls the folder delete endpoint without parsing a 204 body", async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  await api.deleteFolder("c");
  expect(fetchMock).toHaveBeenCalledWith("http://api/folders/c", expect.objectContaining({
    method: "DELETE",
  }));
});

test("deleteFile calls the nested file delete endpoint", async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  const api = createApiClient("http://api", fetchMock as unknown as typeof fetch);
  await api.deleteFile("r", "f");
  expect(fetchMock).toHaveBeenCalledWith("http://api/folders/r/files/f", expect.objectContaining({
    method: "DELETE",
  }));
});
