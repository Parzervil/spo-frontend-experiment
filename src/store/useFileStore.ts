import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  url: string;
  download_url: string | null;
}

interface FileStoreState {
  // 原始全量数据
  fileTree: FileNode[];
  
  // === 自动分类的四大核心板块 ===
  whitepaperFiles: FileNode[];
  wikiFiles: FileNode[];
  canonFiles: FileNode[];
  sandboxFiles: FileNode[];
  uncategorizedFiles: FileNode[];

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
  
  whitepaperFiles: [],
  wikiFiles: [],
  canonFiles: [],
  sandboxFiles: [],
  uncategorizedFiles: [],

  currentFilePath: null,
  loading: false,
  error: null,

  setFileTree: (tree) => {
    // 仅提取文件进行列表展示（过滤掉纯目录或隐藏文件）
    const validFiles = tree.filter(f => (f.type === 'file' || f.type === 'blob') && !f.path.startsWith('.'));

    set({
      fileTree: tree,
      // 00区 - 核心法则区：只读的底层设定
      whitepaperFiles: validFiles.filter(f => f.path.startsWith('00_白皮书/')),
      // 01区 - 设定百科区：世界观词条库
      wikiFiles: validFiles.filter(f => f.path.startsWith('01_星途百科/')),
      // 02区 - 官方正史区：通过审核的共创小说
      canonFiles: validFiles.filter(f => f.path.startsWith('02_星途志异/')),
      // 03区 - 自由沙盒区：作者草稿与测试区
      sandboxFiles: validFiles.filter(f => f.path.startsWith('03_沙盒区/')),
      // 游离于四大体系外的其他文件
      uncategorizedFiles: validFiles.filter(f => 
        !f.path.startsWith('00_白皮书/') &&
        !f.path.startsWith('01_星途百科/') &&
        !f.path.startsWith('02_星途志异/') &&
        !f.path.startsWith('03_沙盒区/') &&
        f.path !== 'README.md' &&
        f.path !== 'LICENSE'
      )
    });
  },
  
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
