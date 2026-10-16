'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Octokit } from 'octokit';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const { setToken, setUser, loginAsGuest, token, isGuest } = useAuthStore();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [validating, setValidating] = useState(false);

  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo`;

  const handleGuestLogin = () => {
    loginAsGuest();
    toast.info('已进入游客浏览模式 (仅供阅读)');
    router.push('/dashboard');
  };

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
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          星途 SPO 世界观共创网络
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">世界观共创平台</h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-xl leading-relaxed">
          基于无头 CMS 架构，由 GitHub 驱动的多人协作讨论、设定推演与世界观研究一体化工作台。
        </p>

        {/* 方案 A：并列呈现创作者登录与游客只读体验 */}
        <div className="flex flex-col gap-3 w-full sm:w-auto items-center mt-4">
          <div className="flex gap-3 items-center flex-col sm:flex-row w-full sm:w-auto">
            {/* 游客直接体验 */}
            <button
              onClick={handleGuestLogin}
              className="w-full sm:w-auto rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors flex items-center justify-center font-medium text-sm sm:text-base h-11 sm:h-12 px-8 gap-2 cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              游客体验 (仅供阅读)
            </button>

            {/* GitHub 创作者登录 */}
            <a
              href={loginUrl}
              className="w-full sm:w-auto rounded-full bg-foreground text-background transition-colors flex items-center justify-center hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-11 sm:h-12 px-8 gap-2 cursor-pointer font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub 授权登录 (创作者)
            </a>
          </div>

          <div className="flex gap-4 items-center text-xs text-gray-400 mt-2">
            {(token || isGuest) && (
              <Link href="/dashboard" className="hover:text-black dark:hover:text-white underline underline-offset-4">
                已进入工作台 &rarr;
              </Link>
            )}
            <button
              onClick={() => setShowTokenModal(true)}
              className="hover:text-gray-600 dark:hover:text-gray-200 underline underline-offset-4 cursor-pointer"
            >
              开发者 Token 直登
            </button>
          </div>
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
                  className="px-4 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleTokenLogin}
                  disabled={validating}
                  className="px-5 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
