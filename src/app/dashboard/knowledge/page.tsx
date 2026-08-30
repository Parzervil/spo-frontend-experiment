'use client';
import { fetchFileTree } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore, FileNode } from '@/store/useFileStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

export default function KnowledgeBase() {
  const { token } = useAuthStore();
  const router = useRouter();
  const { 
    fileTree, 
    whitepaperFiles, 
    wikiFiles, 
    canonFiles, 
    sandboxFiles, 
    uncategorizedFiles,
    loading, 
    error, 
    setFileTree, 
    setLoading, 
    setError 
  } = useFileStore();

  const [activeTab, setActiveTab] = useState<'whitepaper' | 'wiki' | 'canon' | 'sandbox' | 'all'>('whitepaper');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTree = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const tree = await fetchFileTree(token);
      const nodes: FileNode[] = (Array.isArray(tree) ? tree : []).map((item: any) => ({
        name: item.path.split('/').pop() || '',
        path: item.path,
        sha: item.sha,
        size: item.size || 0,
        type: item.type,
        url: item.url || '',
        download_url: item.download_url || null,
      }));
      setFileTree(nodes);
      setError(null);
    } catch (err: any) {
      setError(err.message || '获取知识库列表失败');
      toast.error('获取知识库列表失败，请检查网络或 Token 权限');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && fileTree.length === 0) {
      loadTree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = () => {
    if (!fileName.trim()) {
      toast.warning('请输入文件名');
      return;
    }
    const safeFile = fileName.trim().replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
    // 默认进入 03_沙盒区 进行草拟推演
    const path = `03_沙盒区/${safeFile}.md`;
    setShowCreateModal(false);
    router.push(`/dashboard/edit?path=${encodeURIComponent(path)}`);
  };

  // 过滤当前 Tab 下的文件（支持实时搜索）
  const currentFiles = useMemo(() => {
    let files: FileNode[] = [];
    switch (activeTab) {
      case 'whitepaper':
        files = whitepaperFiles;
        break;
      case 'wiki':
        files = wikiFiles;
        break;
      case 'canon':
        files = canonFiles;
        break;
      case 'sandbox':
        files = sandboxFiles;
        break;
      case 'all':
        files = [...whitepaperFiles, ...wikiFiles, ...canonFiles, ...sandboxFiles, ...uncategorizedFiles];
        break;
    }
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [activeTab, whitepaperFiles, wikiFiles, canonFiles, sandboxFiles, uncategorizedFiles, searchQuery]);

  const renderFileList = (files: FileNode[], emptyMsg: string) => {
    if (files.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <p className="text-gray-400 text-sm italic">{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {files.map((file) => {
          const displayTitle = file.path.split('/').pop()?.replace('.md', '') || file.name;
          const isWhitepaper = file.path.startsWith('00_白皮书/');
          return (
            <Link
              key={file.path}
              href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
              className="p-5 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2b2b2b] shadow-sm hover:shadow-lg hover:border-accent transition-all duration-200 flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent transition-colors truncate text-base">
                    {displayTitle}
                  </h3>
                  {isWhitepaper && (
                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      只读法则
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{file.path}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>Markdown</span>
                {file.size > 0 && <span>{(file.size / 1024).toFixed(1)} KB</span>}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <h2 className="text-2xl font-bold mb-4">星途宇宙档案</h2>

        <button
          onClick={() => setActiveTab('whitepaper')}
          className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
            activeTab === 'whitepaper'
              ? 'bg-accent text-white shadow-md shadow-accent/20'
              : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>📘 00_共创白皮书</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'whitepaper' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            {whitepaperFiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wiki')}
          className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
            activeTab === 'wiki'
              ? 'bg-accent text-white shadow-md shadow-accent/20'
              : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>📚 01_设定百科</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'wiki' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            {wikiFiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('canon')}
          className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
            activeTab === 'canon'
              ? 'bg-accent text-white shadow-md shadow-accent/20'
              : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>📜 02_星途志异</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'canon' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            {canonFiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
            activeTab === 'sandbox'
              ? 'bg-accent text-white shadow-md shadow-accent/20'
              : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>🛠️ 03_边缘沙盒</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'sandbox' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            {sandboxFiles.length}
          </span>
        </button>

        {uncategorizedFiles.length > 0 && (
          <button
            onClick={() => setActiveTab('all')}
            className={`text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
              activeTab === 'all'
                ? 'bg-accent text-white shadow-md shadow-accent/20'
                : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>📁 全部档案</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              {whitepaperFiles.length + wikiFiles.length + canonFiles.length + sandboxFiles.length + uncategorizedFiles.length}
            </span>
          </button>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-accent text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            草拟新设定
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">新文件将默认进入「沙盒区」推演</p>
        </div>

        <button
          onClick={loadTree}
          disabled={loading}
          className="mt-2 text-xs text-gray-400 hover:text-accent flex items-center justify-center gap-1 py-1.5 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          刷新远端数据
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜索当前档案库中的词条与文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">正在同步远端归档...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div>
            {activeTab === 'whitepaper' && (
              <div>
                <div className="border-b dark:border-gray-800 pb-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">共创白皮书 (底层法则)</h2>
                  <p className="text-sm text-gray-500 mt-1">全宇宙最高纲领，由核心议会维护。任何创作不可违背此区设定的物理规则与科技天花板。</p>
                </div>
                {renderFileList(currentFiles, '暂无白皮书内容')}
              </div>
            )}

            {activeTab === 'wiki' && (
              <div>
                <div className="border-b dark:border-gray-800 pb-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">设定百科</h2>
                  <p className="text-sm text-gray-500 mt-1">各类武器、星球、组织、种族的官方百科词条与设定集。</p>
                </div>
                {renderFileList(currentFiles, '暂无百科词条')}
              </div>
            )}

            {activeTab === 'canon' && (
              <div>
                <div className="border-b dark:border-gray-800 pb-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">星途志异 (正史)</h2>
                  <p className="text-sm text-gray-500 mt-1">经过社群与管理审核收录的正传小说、战役实录与人物列传。</p>
                </div>
                {renderFileList(currentFiles, '暂无正史内容')}
              </div>
            )}

            {activeTab === 'sandbox' && (
              <div>
                <div className="border-b dark:border-gray-800 pb-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">边缘观测站 (沙盒)</h2>
                  <p className="text-sm text-gray-500 mt-1">所有共创作者的自由草稿与二设集散地。保存时将自动发起讨论帖申请审核“转正”。</p>
                </div>
                {renderFileList(currentFiles, '暂无沙盒内容，点击左侧「草拟新设定」开启您的推演。')}
              </div>
            )}

            {activeTab === 'all' && (
              <div>
                <div className="border-b dark:border-gray-800 pb-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">全部世界观档案</h2>
                  <p className="text-sm text-gray-500 mt-1">包含所有已收录及未分类文档。</p>
                </div>
                {renderFileList(currentFiles, '暂无任何文档')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新建模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-2">开启新的推演 (新建沙盒文件)</h3>
            <p className="text-xs text-gray-500 mb-4">
              新设定将自动放入 <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-accent">03_沙盒区</code>。首次保存后将为您在 GitHub Discussions 发起同行评审。
            </p>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">文件名称 (支持中文/英文)</label>
              <div className="flex items-center gap-2">
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 p-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  placeholder="例如: 跃迁引擎共振过载实验"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <span className="text-gray-400 text-sm font-mono">.md</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white"
              >
                取消
              </button>
              <button 
                onClick={handleCreate}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                前往编辑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
