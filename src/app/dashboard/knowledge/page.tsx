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
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  useEffect(() => {
    if (user && !folderName) {
      setFolderName(user.login); // 默认文件夹为当前用户名
    }
  }, [user, folderName]);

  const loadTree = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const tree = await fetchFileTree(token); 
      // 过滤出 knowledge_base 下的 markdown 文件
      const filesOnly = (Array.isArray(tree) ? tree : [])
        .filter(item => item.type === 'blob' && item.path.startsWith('knowledge_base/') && item.path.endsWith('.md'))
        .map(item => ({
          ...item,
          name: item.path.split('/').pop() || '',
          // 为了展示方便，我们将 path 去掉 knowledge_base/ 前缀
          displayPath: item.path.replace(/^knowledge_base\//, ''),
          size: item.size || 0
        }));
      setFileTree(filesOnly as any);
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
    const safeFolder = folderName.trim() || user?.login || 'default';
    const safeFile = fileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `knowledge_base/${safeFolder}/${safeFile}.md`;
    router.push(`/dashboard/edit?path=${encodeURIComponent(path)}`);
  };

  // 文件夹分组逻辑
  const defaultFolders = ['设计（Public）', 'IDEAS（Public）'];
  const folders = Array.from(new Set([
    ...defaultFolders, 
    ...fileTree.map(f => (f as any).displayPath.split('/')[0]).filter(name => !name.endsWith('.md'))
  ]));
  
  // 当前显示的文件
  const displayFiles = currentFolder 
    ? fileTree.filter(f => (f as any).displayPath.startsWith(`${currentFolder}/`))
    : [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          {currentFolder && (
            <button 
              onClick={() => setCurrentFolder(null)} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
          )}
          <h1 className="text-2xl font-bold">
            {currentFolder ? `${currentFolder}` : '知识库'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadTree}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-black dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="刷新数据"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium"
          >
            新建
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
      )}
      {error && <p className="text-red-500">加载失败: {error}</p>}

      {!loading && !error && !currentFolder && folders.length === 0 && fileTree.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">当前知识库没有任何文件夹</p>
          <button onClick={() => setShowCreateModal(true)} className="text-blue-500 hover:underline">点击新建第一篇文档</button>
        </div>
      )}

      {/* 根目录：显示文件夹列表和根目录独立文件 */}
      {!loading && !error && !currentFolder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {folders.map(folder => (
            <div 
              key={folder}
              onClick={() => setCurrentFolder(folder)}
              className="block p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 group-hover:fill-blue-500/20 transition-colors"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                <h3 className="font-bold truncate text-lg">{folder}</h3>
              </div>
              <p className="text-sm text-gray-500">{fileTree.filter(f => (f as any).displayPath.startsWith(`${folder}/`)).length} 篇文档</p>
            </div>
          ))}
          {/* 根目录下的 Markdown 文件 */}
          {fileTree.filter(f => !(f as any).displayPath.includes('/')).map(file => (
            <Link 
              key={file.path} 
              href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
              className="block p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                <h3 className="font-bold truncate" title={(file as any).name}>{(file as any).name.replace('.md', '')}</h3>
              </div>
              <p className="text-sm text-gray-500">文件大小: {(file.size / 1024).toFixed(1)} KB</p>
            </Link>
          ))}
        </div>
      )}

      {/* 文件夹内部：显示该文件夹内的文件 */}
      {!loading && !error && currentFolder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {displayFiles.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-500">该文件夹下暂无文件</div>
          )}
          {displayFiles.map((file) => (
            <Link 
              key={file.path} 
              href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
              className="block p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                <h3 className="font-bold truncate" title={(file as any).name}>{(file as any).name.replace('.md', '')}</h3>
              </div>
              <p className="text-sm text-gray-500">文件大小: {(file.size / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-gray-400 mt-2 truncate">路径: {file.path}</p>
            </Link>
          ))}
        </div>
      )}

      {/* 新建模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-xl w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-4">新建</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">所属文件夹</label>
              <select 
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={user?.login}>个人目录: {user?.login}</option>
                <option value="设计（Public）">设计（Public）</option>
                <option value="IDEAS（Public）">IDEAS（Public）</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-1">文件名称 (仅支持英文/拼音/数字)</label>
              <div className="flex items-center gap-2">
                <input 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
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
