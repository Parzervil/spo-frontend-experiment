'use client';
import { fetchFileTree } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function KnowledgeBase() {
  const { token } = useAuthStore();
  const router = useRouter();
  const { fileTree, whitepaperFiles, wikiFiles, canonFiles, sandboxFiles, loading, error, setFileTree, setLoading, setError } = useFileStore();

  const [activeTab, setActiveTab] = useState('whitepaper');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fileName, setFileName] = useState('');

  const loadTree = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const tree = await fetchFileTree(token); 
      setFileTree(tree as any);
    } catch (err: any) {
      setError(err.message);
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
    // 强制路由到 03_沙盒区
    const path = `03_沙盒区/${safeFile}.md`;
    router.push(`/dashboard/edit?path=${encodeURIComponent(path)}`);
  };

  const renderFileList = (files: any[], emptyMsg: string) => {
    if (files.length === 0) return <div className="text-gray-500 italic py-8">{emptyMsg}</div>;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
        {files.map(file => {
          const displayTitle = file.path.split('/').pop()?.replace('.md', '') || file.path;
          return (
            <Link 
              key={file.path}
              href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
              className="p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] shadow-sm hover:shadow-md hover:border-accent transition-all flex flex-col gap-2 group"
            >
              <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-accent truncate">
                {displayTitle}
              </h3>
              <p className="text-xs text-gray-400 truncate">{file.path}</p>
            </Link>
          )
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <h2 className="text-2xl font-bold mb-4">星途宇宙档案</h2>
        
        <button onClick={() => setActiveTab('whitepaper')} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'whitepaper' ? 'bg-accent/10 text-accent border border-accent/20' : 'hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
          📘 00_共创白皮书 <span className="text-xs ml-2 opacity-50">{whitepaperFiles.length}</span>
        </button>
        <button onClick={() => setActiveTab('wiki')} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'wiki' ? 'bg-accent/10 text-accent border border-accent/20' : 'hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
          📚 01_设定百科 <span className="text-xs ml-2 opacity-50">{wikiFiles.length}</span>
        </button>
        <button onClick={() => setActiveTab('canon')} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'canon' ? 'bg-accent/10 text-accent border border-accent/20' : 'hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
          📜 02_星途志异 <span className="text-xs ml-2 opacity-50">{canonFiles.length}</span>
        </button>
        <button onClick={() => setActiveTab('sandbox')} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'sandbox' ? 'bg-accent/10 text-accent border border-accent/20' : 'hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
          🛠️ 03_边缘沙盒 <span className="text-xs ml-2 opacity-50">{sandboxFiles.length}</span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-accent text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            草拟新设定
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">新文件将默认进入「沙盒区」</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {loading && <div className="animate-pulse flex gap-4 items-center"><div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div> 正在同步远端归档...</div>}
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        
        {!loading && !error && (
          <div className="mt-2">
            {activeTab === 'whitepaper' && (
              <div>
                <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-800 mb-4">共创白皮书 (底层法则)</h2>
                <p className="text-sm text-gray-500 mb-6">全宇宙最高纲领，由核心议会维护。任何创作不可违背此区设定的物理规则与科技天花板。</p>
                {renderFileList(whitepaperFiles, "暂无白皮书内容")}
              </div>
            )}
            {activeTab === 'wiki' && (
              <div>
                <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-800 mb-4">设定百科</h2>
                <p className="text-sm text-gray-500 mb-6">各类武器、星球、组织、种族的官方百科词条。</p>
                {renderFileList(wikiFiles, "暂无百科词条")}
              </div>
            )}
            {activeTab === 'canon' && (
              <div>
                <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-800 mb-4">星途志异 (正史)</h2>
                <p className="text-sm text-gray-500 mb-6">经过审核并被官方收录的正传小说与人物传记。</p>
                {renderFileList(canonFiles, "暂无正史内容")}
              </div>
            )}
            {activeTab === 'sandbox' && (
              <div>
                <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-800 mb-4">边缘观测站 (沙盒)</h2>
                <p className="text-sm text-gray-500 mb-6">所有共创作者的草稿与二设集散地。优秀作品可在此发起讨论申请“转正”。</p>
                {renderFileList(sandboxFiles, "暂无沙盒内容")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新建模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4">开启新的推演 (新建沙盒文件)</h3>
            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-2">文件名称 (支持中文/英文)</label>
              <div className="flex items-center gap-2">
                <input 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-black focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="例如: 阿萨福勒锻造指北"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <span className="text-gray-400">.md</span>
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
                前往编辑器
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
