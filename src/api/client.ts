import type { Folder, FileItem, Paginated, FolderContents, Breadcrumb, SearchHit, TreeNode } from "@windows-explorer/contracts";

export class ApiError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export const createApiClient = (baseUrl: string, fetchFn: typeof fetch = fetch) => {
  const request = async <T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> => {
    const res = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
      signal,
    });
    const body = await res.json();
    if (!res.ok) { const code = body?.error?.code ?? "UNKNOWN"; throw new ApiError(code, `${code}: ${body?.error?.message ?? res.statusText}`); }
    return body as T;
  };
  const get = <T>(path: string, signal?: AbortSignal): Promise<T> => request<T>(path, {}, signal);
  const write = async <T>(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) =>
    (await request<{ data: T }>(path, { method, body: JSON.stringify(body) })).data;
  const page = (limit = 100, cursor?: string) => `limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;

  return {
    getRoots: (cursor?: string) => get<Paginated<Folder>>(`/folders/roots?${page(100, cursor)}`),
    getChildren: (id: string, cursor?: string) => get<Paginated<Folder>>(`/folders/${id}/children?${page(100, cursor)}`),
    getFiles: (id: string, cursor?: string) => get<Paginated<FileItem>>(`/folders/${id}/files?${page(100, cursor)}`),
    getContents: (id: string) => get<FolderContents>(`/folders/${id}/contents`),
    getBreadcrumbs: (id: string) => get<{ data: Breadcrumb[] }>(`/folders/${id}/breadcrumbs`),
    getTree: (rootId?: string) => get<{ data: TreeNode[] }>(`/folders/tree${rootId ? `?rootId=${rootId}` : ""}`),
    search: (q: string, signal?: AbortSignal) => get<Paginated<SearchHit>>(`/search?q=${encodeURIComponent(q)}`, signal),
    createFolder: (parentId: string, name?: string) => write<Folder>(`/folders/${parentId}/folders`, "POST", name ? { name } : {}),
    createFile: (folderId: string, name?: string) => write<FileItem>(`/folders/${folderId}/files`, "POST", name ? { name } : {}),
    renameFolder: (id: string, name: string) => write<Folder>(`/folders/${id}`, "PATCH", { name }),
    renameFile: (folderId: string, id: string, name: string) => write<FileItem>(`/folders/${folderId}/files/${id}`, "PATCH", { name }),
  };
};
export type ApiClient = ReturnType<typeof createApiClient>;
