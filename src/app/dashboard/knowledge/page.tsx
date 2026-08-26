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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'tree'>('grid');

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
      // 过滤出 knowledge_base 下的文件，以及标题(路径)中含 Public 的文件夹
      const filesOnly = (Array.isArray(tree) ? tree : [])
        .filter(item => {
          if (item.type !== 'blob' || !item.path.endsWith('.md')) return false;
          const lower = item.path.toLowerCase();
          return item.path.startsWith('knowledge_base/') || lower.includes('public');
        })
        .map(item => {
          const displayPath = item.path.startsWith('knowledge_base/') 
            ? item.path.replace(/^knowledge_base\//, '')
            : item.path;
          return {
            ...item,
            name: item.path.split('/').pop() || '',
            displayPath,
            size: item.size || 0
          };
        });
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

  const FolderCard = ({ folder }: { folder: string }) => (
    <div 
      onClick={() => setCurrentFolder(folder)}
      className={`block bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-all cursor-pointer group ${viewMode === 'list' ? 'p-4 flex items-center justify-between' : 'p-6'}`}
    >
      <div className={`flex items-center ${viewMode === 'list' ? 'gap-4' : 'gap-3 mb-2'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 group-hover:fill-blue-500/20 transition-colors"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
        <h3 className="font-bold truncate text-lg">{folder}</h3>
      </div>
      <p className="text-sm text-gray-500">{fileTree.filter(f => (f as any).displayPath.startsWith(`${folder}/`)).length} 篇文档</p>
    </div>
  );

  const FileCard = ({ file }: { file: any }) => (
    <Link 
      href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`}
      className={`block bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'p-4 flex items-center justify-between' : 'p-6'}`}
    >
      <div className={`flex items-center ${viewMode === 'list' ? 'gap-4' : 'gap-3 mb-3'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <h3 className="font-bold truncate" title={file.name}>{file.name.replace('.md', '')}</h3>
      </div>
      <div className={viewMode === 'list' ? 'flex items-center gap-6' : ''}>
        <p className="text-sm text-gray-500">文件大小: {(file.size / 1024).toFixed(1)} KB</p>
        {viewMode === 'grid' && currentFolder && <p className="text-xs text-gray-400 mt-2 truncate">路径: {file.path}</p>}
      </div>
    </Link>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          {currentFolder && viewMode !== 'tree' && (
            <button 
              onClick={() => setCurrentFolder(null)} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
          )}
          <h1 className="text-2xl font-bold">
            {currentFolder && viewMode !== 'tree' ? `${currentFolder}` : '知识库'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* 排版切换按钮 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`} title="网格视图">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`} title="列表视图">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
            </button>
            <button onClick={() => setViewMode('tree')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'tree' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`} title="目录树视图">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v4h4"/><path d="M12 14H8"/></svg>
            </button>
          </div>
          
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

      {!loading && !error && folders.length === 0 && fileTree.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">当前知识库没有任何文件夹</p>
          <button onClick={() => setShowCreateModal(true)} className="text-blue-500 hover:underline">点击新建第一篇文档</button>
        </div>
      )}

      {/* Tree View 渲染整个目录树 */}
      {!loading && !error && viewMode === 'tree' && (
        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <ul className="space-y-4 font-mono text-sm">
            {folders.map(folder => {
              const filesInFolder = fileTree.filter(f => (f as any).displayPath.startsWith(`${folder}/`));
              return (
                <li key={folder}>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-2 cursor-default">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                    {folder}/
                  </div>
                  {filesInFolder.length > 0 ? (
                    <ul className="pl-6 space-y-2 border-l-2 border-gray-100 dark:border-gray-800 ml-2">
                      {filesInFolder.map(file => (
                        <li key={file.path}>
                          <Link href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`} className="flex items-center gap-2 hover:text-blue-500 hover:underline text-gray-700 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                            {(file as any).name}
                            <span className="text-gray-400 text-xs ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="pl-8 ml-2 text-gray-400 text-xs italic">空文件夹</div>
                  )}
                </li>
              );
            })}
            {/* 根目录的独立文件 */}
            {fileTree.filter(f => !(f as any).displayPath.includes('/')).map(file => (
              <li key={file.path} className="mt-4">
                <Link href={`/dashboard/edit?path=${encodeURIComponent(file.path)}`} className="flex items-center gap-2 hover:text-blue-500 hover:underline text-gray-700 dark:text-gray-300 font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                  {(file as any).name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid or List View 根目录：显示文件夹列表和独立文件 */}
      {!loading && !error && viewMode !== 'tree' && !currentFolder && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
          {folders.map(folder => <FolderCard key={folder} folder={folder} />)}
          {fileTree.filter(f => !(f as any).displayPath.includes('/')).map(file => <FileCard key={file.path} file={file} />)}
        </div>
      )}

      {/* Grid or List View 文件夹内部：显示该文件夹内的文件 */}
      {!loading && !error && viewMode !== 'tree' && currentFolder && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
          {displayFiles.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-500">该文件夹下暂无文件</div>
          )}
          {displayFiles.map(file => <FileCard key={file.path} file={file} />)}
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
