'use client';
import { fetchDiscussions, fetchRepoAndCategories, createDiscussion } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DiscussionsPage() {
  const { token, isGuest } = useAuthStore();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新建帖子状态
  const [isCreating, setIsCreating] = useState(false);
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categoryMap: Record<string, { label: string, icon: string }> = {
    'Announcements': { label: '公告', icon: '📢' },
    'General': { label: '综合讨论', icon: '💬' },
    'Ideas': { label: '想法与创意', icon: '💡' },
    'Q&A': { label: '问答', icon: '🙋' },
    'Show and tell': { label: '分享展示', icon: '🙌' }
  };

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, repo] = await Promise.all([
        fetchDiscussions(token),
        fetchRepoAndCategories(token)
      ]);
      setDiscussions(list);
      setRepoInfo(repo);
      
      // 默认选择第一个允许的分类
      if (repo.discussionCategories.nodes.length > 0) {
        const firstAllowed = repo.discussionCategories.nodes.find((cat: any) => categoryMap[cat.name]);
        setSelectedCategory(firstAllowed ? firstAllowed.id : repo.discussionCategories.nodes[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载讨论区失败，请确认是否已在 GitHub 仓库开启 Discussions');
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
      toast.warning('标题和内容不能为空');
      return;
    }

    setSubmitting(true);
    try {
      await createDiscussion(token, repoInfo.id, selectedCategory, newTitle, newBody);
      setIsCreating(false);
      setNewTitle('');
      setNewBody('');
      toast.success('发布成功');
      // 重新加载列表
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('发帖失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">协作中心</h1>
        {!isCreating && (
          isGuest ? (
            <Link
              href="/"
              className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            >
              登录参与讨论 &rarr;
            </Link>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-accent/20 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              发起新讨论
            </button>
          )
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 sm:p-8 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold">发起新讨论</h2>
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
              <div className="relative">
                <div 
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full p-3 pr-10 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-black hover:border-gray-300 dark:hover:border-gray-700 transition-all text-sm cursor-pointer flex items-center h-[46px]"
                >
                  {(() => {
                    const selectedNode = repoInfo?.discussionCategories.nodes.find((c: any) => c.id === selectedCategory);
                    if (selectedNode && categoryMap[selectedNode.name]) {
                      const mapping = categoryMap[selectedNode.name];
                      return <span>{mapping.label}</span>;
                    }
                    return <span className="text-gray-400">请选择...</span>;
                  })()}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`absolute right-3 top-[15px] text-gray-400 pointer-events-none transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                
                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)}></div>
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {repoInfo?.discussionCategories.nodes
                        .filter((cat: any) => categoryMap[cat.name])
                        .map((cat: any) => {
                          const mapping = categoryMap[cat.name];
                          return (
                            <div
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setShowCategoryDropdown(false);
                              }}
                              className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#333] cursor-pointer flex justify-between items-center text-sm transition-colors"
                            >
                              <span className="text-gray-900 dark:text-gray-100">
                                {mapping.label}
                              </span>
                              {selectedCategory === cat.id && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标题</label>
              <input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm"
                placeholder="一句话概括讨论主题"
                autoFocus
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">正文内容 (支持 Markdown)</label>
            <textarea 
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              className="w-full p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-black focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all min-h-[160px] resize-y text-sm leading-relaxed font-[family-name:var(--font-geist-mono)]"
              placeholder="详细描述你的想法、建议或问题... (支持使用 Markdown 排版)"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 shadow-sm shadow-accent/20"
            >
              {submitting ? '发布中...' : '确认发布'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 w-2/3">
                  <div className="w-12 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                </div>
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mb-4"></div>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
              <p className="text-gray-500 mb-4">
                {isGuest ? '当前处于游客浏览模式，尚未拉取社区讨论' : '暂时还没有任何讨论'}
              </p>
              {isGuest ? (
                <Link href="/" className="text-accent hover:underline text-sm font-medium">
                  登录 GitHub 即可同步社区讨论并参与交流 &rarr;
                </Link>
              ) : (
                <button onClick={() => setIsCreating(true)} className="text-blue-500 hover:underline">成为第一个发言的人</button>
              )}
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
                      {{
                        'General': '综合讨论',
                        'Ideas': '想法与创意',
                        'Q&A': '问答',
                        'Show and tell': '分享展示',
                        'Announcements': '公告'
                      }[d.category.name as string] || d.category.name}
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
