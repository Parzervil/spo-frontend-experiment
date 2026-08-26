'use client';
import { fetchDiscussions, fetchRepoAndCategories, createDiscussion } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DiscussionsPage() {
  const { token } = useAuthStore();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新建帖子状态
  const [isCreating, setIsCreating] = useState(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, repo] = await Promise.all([
        fetchDiscussions(token),
        fetchRepoAndCategories(token)
      ]);
      setDiscussions(list);
      setRepoInfo(repo);
      
      // 默认选择第一个分类
      if (repo.discussionCategories.nodes.length > 0) {
        setSelectedCategory(repo.discussionCategories.nodes[0].id);
      }
    } catch (error) {
      console.error(error);
      alert('加载讨论区失败，请确认是否已在 GitHub 仓库开启 Discussions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !repoInfo) return;
    if (!newTitle.trim() || !newBody.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await createDiscussion(token, repoInfo.id, selectedCategory, newTitle, newBody);
      setIsCreating(false);
      setNewTitle('');
      setNewBody('');
      // 重新加载列表
      loadData();
    } catch (error) {
      console.error(error);
      alert('发帖失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">协作中心 (Discussions)</h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isCreating ? '取消发布' : '发起新讨论'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold mb-4">发起新讨论</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">分类</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-black"
            >
              {repoInfo?.discussionCategories.nodes.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">标题</label>
            <input 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-black"
              placeholder="一句话概括讨论主题"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">正文内容 (支持 Markdown)</label>
            <textarea 
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              className="w-full p-2 border rounded bg-white dark:bg-black h-32 resize-y"
              placeholder="详细描述你的想法、建议或问题..."
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {submitting ? '发布中...' : '提交讨论'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-center py-10">加载中...</p>
      ) : (
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">暂时还没有任何讨论</p>
              <button onClick={() => setIsCreating(true)} className="text-blue-500 hover:underline">成为第一个发言的人</button>
            </div>
          ) : (
            discussions.map((d) => (
              <Link 
                key={d.id} 
                href={`/dashboard/discussions/${d.number}`}
                className="block p-5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {d.category.name}
                    </span>
                    <h3 className="font-bold text-lg">{d.title}</h3>
                  </div>
                  <span className="text-sm text-gray-400">#{d.number}</span>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {d.body}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <img src={d.author.avatarUrl} alt="author" className="w-5 h-5 rounded-full" />
                    <span>{d.author.login}</span>
                    <span>·</span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>{d.comments.totalCount} 回复</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
