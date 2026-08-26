'use client';
import { fetchFileTree } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useFileStore } from '@/store/useFileStore';
import Link from 'next/link';
import { useEffect } from 'react';

export default function KnowledgeBase() {
  const { token } = useAuthStore();
  const { fileTree, loading, error, setFileTree, setLoading, setError } = useFileStore();

  useEffect(() => {
    if (!token) return;

    const loadTree = async () => {
      setLoading(true);
      try {
        const tree = await fetchFileTree(token, ''); // 或者传特定目录如 'knowledge_base'
        // GitHub API getContent returns an array of objects for directories
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">知识库词条</h1>
        <Link 
          href={`/dashboard/edit?path=knowledge_base/doc_${new Date().getTime()}.md`} 
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          新建词条
        </Link>
      </div>

      {loading && <p className="text-gray-500">正在从 GitHub 加载词条...</p>}
      {error && <p className="text-red-500">加载失败: {error}</p>}

      {!loading && !error && fileTree.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">当前仓库还没有 Markdown 词条文件</p>
          <Link href={`/dashboard/edit?path=knowledge_base/doc_${new Date().getTime()}.md`} className="text-blue-500 hover:underline">点击创建第一篇</Link>
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
    </div>
  );
}
