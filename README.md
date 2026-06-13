# windows-explorer-web

Vue 3 + Pinia frontend for the Windows Explorer-style file browser. Left panel: lazy-loaded, virtualized folder tree. Right panel: subfolders and files for the selected folder.

The backend API lives in a separate repo (`windows-explorer-api`). This app expects it at `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`).

---

## Stack

Vue 3 · Pinia · Vite · TypeScript (strict) · Vitest · Playwright

---

## Quick start

```bash
cp .env.example .env        # set VITE_API_BASE_URL if the API runs elsewhere
bun install
bun run dev                 # http://localhost:5173
```

The API must be running before the dev server is useful. With the default `.env`, it is expected at `http://localhost:3000`.

---

## Structure

```
src/
  api/client.ts             typed fetch wrapper; AbortController per request
  stores/explorer.ts        normalized folder cache, expansion set, visible-row flatten
  composables/
    useVirtualList.ts       windowed rendering — DOM size constant at any tree depth
    useDebouncedSearch.ts   watch + setTimeout + AbortController
  components/
    FolderTree.vue          virtualized left panel
    FolderTreeNode.vue      single row: chevron, icon, name, ARIA treeitem
    FolderContents.vue      right panel: subfolders + files
    ExplorerLayout.vue      two-pane shell, draggable splitter
    Breadcrumbs.vue         address bar
    SearchBar.vue           debounced, abortable search with results dropdown
  contracts.ts              plain TS interfaces matching the API response shapes
```

---

## How it works

**Lazy expansion**: the Pinia store holds a normalized map — `folders: Map<id, Folder>`, `childrenByParent: Map<id, id[]>`. Expanding an unloaded node calls `GET /folders/:id/children` and merges the result. Collapsing is free — no re-fetch.

**Virtualization**: `useVirtualList` computes a visible window from `scrollTop` and viewport height. Only the rows in the window are in the DOM; the total DOM size stays constant regardless of how many nodes are expanded.

**Search reveal**: search hits include an `ancestors` chain. `revealPath` expands each ancestor in order (fetching children as needed), then selects the target — no per-node parent walk required.

---

## Tests

```bash
bun run test          # Vitest unit + component tests (14 tests, no server needed)
bun run typecheck     # vue-tsc
bun run lint          # ESLint
```

E2E tests (`bun run test:e2e`) require a running API and a Playwright-supported OS. They are kept in `e2e/` for CI environments that have both.

---

## Environment

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | Base URL for the backend API |
