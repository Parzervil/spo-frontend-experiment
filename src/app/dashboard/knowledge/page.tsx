'use client';
import { fetchFileTree } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function KnowledgeBase() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const { fileTree, loading, error, setFileTree, setLoading, setError } = useFileStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (user && !folderName) {
      setFolderName(user.login); // 默认文件夹为当前用户名
    }
  }, [user, folderName]);

  useEffect(() => {
    if (!token) return;

    const loadTree = async () => {
      setLoading(true);
      try {
        const tree = await fetchFileTree(token, ''); 
        const filesOnly = (Array.isArray(tree) ? tree : []).filter(item => item.name.endsWith('.md'));
        setFileTree(filesOnly as any);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (fileTree.length === 0) {
      loadTree();
    }
  }, [token, fileTree.length, setFileTree, setLoading, setError]);

  const handleCreate = () => {
    if (!fileName.trim()) {
      toast.warning('请输入文件名');
      return;
    }
    const safeFolder = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'knowledge_base';
    const safeFile = fileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${safeFolder}/${safeFile}.md`;
    router.push(`/dashboard/edit?path=${encodeURIComponent(path)}`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">知识库词条</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          新建词条
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
      )}
      {error && <p className="text-red-500">加载失败: {error}</p>}

      {!loading && !error && fileTree.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">当前仓库还没有 Markdown 词条文件</p>
          <button onClick={() => setShowCreateModal(true)} className="text-blue-500 hover:underline">点击创建第一篇</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {fileTree.map((file) => (
          <Link 
            key={file.path} 
            href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
            className="block p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
              <h3 className="font-bold truncate" title={file.name}>{file.name.replace('.md', '')}</h3>
            </div>
            <p className="text-sm text-gray-500">文件大小: {(file.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs text-gray-400 mt-2 truncate">路径: {file.path}</p>
          </Link>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4">新建词条</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">所属文件夹 (推荐使用您的用户名)</label>
              <input 
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-black"
                placeholder="例如: knowledge_base"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-1">文件名称 (仅支持英文/拼音/数字)</label>
              <div className="flex items-center gap-2">
                <input 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-black"
                  placeholder="例如: star_city"
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
                className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium"
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
