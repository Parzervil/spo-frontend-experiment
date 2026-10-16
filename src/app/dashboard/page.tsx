'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Octokit } from 'octokit';
import AssetImporter from '@/components/AssetImporter';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Dashboard() {
  const { token, user, isGuest, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token && !isGuest) {
      router.replace('/');
    } else if (token && !user) {
      // 验证 token 并获取用户信息
      const fetchUser = async () => {
        try {
          const octokit = new Octokit({ auth: token });
          const { data } = await octokit.rest.users.getAuthenticated();
          setUser({
            login: data.login,
            avatar_url: data.avatar_url,
            name: data.name,
          });
        } catch (error: any) {
          console.error("Token invalid or expired", error);
          if (error.status === 401) {
            toast.error("登录凭证已失效，请重新登录。");
            logout();
            router.replace('/');
          } else {
            // 网络原因无法直连 GitHub API 时，不强行清空 Token 和踢出，提供保底用户对象
            toast.warning("无法连通 GitHub API 用户接口，已使用本地凭据进入工作台。");
            setUser({
              login: 'co-creator',
              avatar_url: '',
              name: '共创者',
            });
          }
        }
      };
      fetchUser();
    }
  }, [hasHydrated, token, isGuest, router, setUser, user, logout]);

  if (!hasHydrated || (!token && !isGuest)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-gray-400 animate-pulse">正在加载工作台...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 游客只读横幅提示 */}
      {isGuest && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-lg">
              👀
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">当前处于【游客浏览模式】</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                您可以自由查阅和检索所有公开世界观设定文档。如需进行共创推演、新建或编辑文档，请使用 GitHub 账号登录。
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            登录 GitHub 开启创作
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold mb-2">
          {isGuest ? '欢迎查阅星途世界观设定' : '欢迎来到共创中心'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isGuest 
            ? '当前连接至 SPO 公开世界观知识引擎，可在左侧导航查阅各分区文档。' 
            : '您的 GitHub API 链路已打通，接下来可以开始管理与推演世界观文档。'}
        </p>
      </div>
      
      <div className="max-w-xl">
        <h2 className="text-lg font-medium mb-4">快捷导入资产</h2>
        {isGuest ? (
          <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 text-center bg-gray-50 dark:bg-[#161616]">
            <p className="text-sm text-gray-500 mb-2">导入本地设定需拥有创作者权限</p>
            <Link href="/" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              登录后即可将本地 Markdown / Word 资产一键导入共创沙盒 &rarr;
            </Link>
          </div>
        ) : (
          <AssetImporter 
            onImport={(md, filename) => {
              sessionStorage.setItem('draft_import', md);
              const userFolder = user?.login || 'default';
              const fullPath = `03_沙盒区/${filename}`;
              router.push(`/dashboard/edit?path=${encodeURIComponent(fullPath)}&import=true`);
            }} 
          />
        )}
      </div>
    </div>
  );
}
