export interface Folder {
  id: string;
  parentId: string | null;
  name: string;
  depth: number;
  subfolderCount: number;
  fileCount: number;
  hasChildren: boolean;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  folderId: string;
  name: string;
  extension: string | null;
  sizeBytes: number;
  updatedAt: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface TreeNode extends Folder {
  children: TreeNode[];
}

export interface SearchHit {
  type: "folder" | "file";
  id: string;
  name: string;
  ancestors: Breadcrumb[];
}

export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Paginated<T> {
  data: T[];
  pageInfo: PageInfo;
}

export interface FolderContents {
  folder: Folder;
  folders: Paginated<Folder>;
  files: Paginated<FileItem>;
}
