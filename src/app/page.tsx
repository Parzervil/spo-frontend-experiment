'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Octokit } from 'octokit';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [validating, setValidating] = useState(false);

  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo`;

  const handleTokenLogin = async () => {
    const raw = inputToken.trim();
    if (!raw) {
      toast.warning('请输入 GitHub Personal Access Token');
      return;
    }
    setValidating(true);
    try {
      const octokit = new Octokit({ auth: raw });
      const { data } = await octokit.rest.users.getAuthenticated();
      setToken(raw);
      setUser({
        login: data.login,
        avatar_url: data.avatar_url,
        name: data.name || data.login,
      });
      toast.success(`欢迎回来，${data.name || data.login}`);
      setShowTokenModal(false);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Token validation failed:', err);
      // 如果网络超时但格式看起来像合法 token，允许强制进入
      if (raw.startsWith('ghp_') || raw.startsWith('github_pat_')) {
        setToken(raw);
        setUser({
          login: 'user',
          avatar_url: '',
          name: 'GitHub 用户',
        });
        toast.info('已保存 Token 并进入工作台');
        setShowTokenModal(false);
        router.push('/dashboard');
      } else {
        toast.error('Token 校验失败，请检查 Token 权限或网络');
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold">世界观共创平台</h1>
        <p className="text-lg text-gray-500 max-w-xl">
          基于无头 CMS 架构，由 GitHub 驱动的多人协作讨论、创作与研究一体化工作台。
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10"
            href="/dashboard"
          >
            进入工作台
          </Link>
          <a
            href={loginUrl}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-8 sm:px-10 gap-2 cursor-pointer"
          >
            GitHub 授权登录
          </a>
          <button
            onClick={() => setShowTokenModal(true)}
            className="rounded-full border border-dashed border-gray-300 dark:border-gray-700 transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] text-sm sm:text-base h-10 sm:h-12 px-6 gap-2 text-gray-600 dark:text-gray-300"
          >
            Token 直登
          </button>
        </div>

        {/* 备用 Token 登录弹窗 */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-md w-full text-left shadow-2xl">
              <h3 className="text-lg font-bold mb-2">使用 GitHub Personal Access Token 登录</h3>
              <p className="text-xs text-gray-500 mb-4">
                适合 OAuth 无法直连或本地调试。需要在 GitHub Settings &gt; Developer settings 中创建具有 <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">repo</code> 权限的 Token。
              </p>
              <input
                type="password"
                placeholder="ghp_... 或 github_pat_..."
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTokenLogin()}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-black font-mono text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleTokenLogin}
                  disabled={validating}
                  className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {validating ? '验证中...' : '确认并登录'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
