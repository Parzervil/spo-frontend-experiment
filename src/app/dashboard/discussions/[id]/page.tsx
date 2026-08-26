'use client';
import { fetchDiscussionDetails, addDiscussionComment } from '@/lib/github';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';

export default function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const number = parseInt(resolvedParams.id, 10);
  
  const { token } = useAuthStore();
  const [discussion, setDiscussion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);

  const loadData = async () => {
    if (!token) return;
    try {
      const data = await fetchDiscussionDetails(token, number);
      setDiscussion(data);
    } catch (error) {
      console.error(error);
      alert('加载帖子失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, number]);

  const handleReply = async () => {
    if (!token || !discussion) return;
    if (!replyBody.trim()) {
      alert('回复内容不能为空');
      return;
    }
    setReplying(true);
    try {
      await addDiscussionComment(token, discussion.id, replyBody);
      setReplyBody('');
      loadData(); // 重新加载获取最新评论
    } catch (error) {
      console.error(error);
      alert('回复失败');
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  if (!discussion) {
    return <div className="p-8 text-center text-red-500">找不到该帖子</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-[family-name:var(--font-geist-sans)] pb-32">
      <Link href="/dashboard/discussions" className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white mb-6">
        ← 返回协作中心
      </Link>

      {/* 主帖 */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-8 border border-gray-200 dark:border-gray-800 mb-8">
        <h1 className="text-2xl font-bold mb-6">{discussion.title}</h1>
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <img src={discussion.author.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
          <div className="text-sm">
            <span className="font-medium">{discussion.author.login}</span>
            <span className="text-gray-500 mx-2">发布于</span>
            <span className="text-gray-400">{new Date(discussion.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div 
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: discussion.bodyHTML }}
        />
      </div>

      {/* 评论区 */}
      <div className="space-y-6 mb-12">
        <h3 className="font-bold text-lg">{discussion.comments.nodes.length} 条回复</h3>
        {discussion.comments.nodes.map((comment: any) => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <img src={comment.author.avatarUrl} alt="avatar" className="w-6 h-6 rounded-full" />
              <div className="text-sm">
                <span className="font-medium">{comment.author.login}</span>
                <span className="text-gray-500 mx-2">回复于</span>
                <span className="text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
            />
          </div>
        ))}
      </div>

      {/* 回复框 */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="font-bold mb-4">添加回复</h3>
        <textarea 
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="写下你的想法 (支持 Markdown)..."
          className="w-full border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-32 mb-4"
        />
        <div className="flex justify-end">
          <button 
            onClick={handleReply}
            disabled={replying}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {replying ? '发送中...' : '提交回复'}
          </button>
        </div>
      </div>
    </div>
  );
}
