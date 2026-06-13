import type { Folder, FileItem, Paginated, FolderContents, Breadcrumb, SearchHit, TreeNode } from "@windows-explorer/contracts";

export class ApiError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export const createApiClient = (baseUrl: string, fetchFn: typeof fetch = fetch) => {
  const get = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
    const res = await fetchFn(`${baseUrl}${path}`, { headers: { accept: "application/json" }, signal });
    const body = await res.json();
    if (!res.ok) { const code = body?.error?.code ?? "UNKNOWN"; throw new ApiError(code, `${code}: ${body?.error?.message ?? res.statusText}`); }
    return body as T;
  };
  const page = (limit = 100, cursor?: string) => `limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;

  return {
    getRoots: (cursor?: string) => get<Paginated<Folder>>(`/folders/roots?${page(100, cursor)}`),
    getChildren: (id: string, cursor?: string) => get<Paginated<Folder>>(`/folders/${id}/children?${page(100, cursor)}`),
    getFiles: (id: string, cursor?: string) => get<Paginated<FileItem>>(`/folders/${id}/files?${page(100, cursor)}`),
    getContents: (id: string) => get<FolderContents>(`/folders/${id}/contents`),
    getBreadcrumbs: (id: string) => get<{ data: Breadcrumb[] }>(`/folders/${id}/breadcrumbs`),
    getTree: (rootId?: string) => get<{ data: TreeNode[] }>(`/folders/tree${rootId ? `?rootId=${rootId}` : ""}`),
    search: (q: string, signal?: AbortSignal) => get<Paginated<SearchHit>>(`/search?q=${encodeURIComponent(q)}`, signal),
  };
};
export type ApiClient = ReturnType<typeof createApiClient>;
