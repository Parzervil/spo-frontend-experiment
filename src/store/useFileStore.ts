import { create } from 'zustand';

interface FileNode {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  url: string;
  download_url: string | null;
}

interface FileStoreState {
  fileTree: FileNode[];
  currentFilePath: string | null;
  loading: boolean;
  error: string | null;
  setFileTree: (tree: FileNode[]) => void;
  setCurrentFilePath: (path: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFileStore = create<FileStoreState>((set) => ({
  fileTree: [],
  currentFilePath: null,
  loading: false,
  error: null,
  setFileTree: (tree) => set({ fileTree: tree }),
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
