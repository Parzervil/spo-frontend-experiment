'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Octokit } from 'octokit';
import AssetImporter from '@/components/AssetImporter';

import { toast } from 'sonner';

export default function Dashboard() {
  const { token, user, logout, setUser } = useAuthStore();
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

    if (!token) {
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
  }, [hasHydrated, token, router, setUser, user, logout]);

  if (!hasHydrated || !token) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-gray-400 animate-pulse">正在加载工作台...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">欢迎来到共创中心</h1>
        <p className="text-gray-500">您的 GitHub API 链路已成功打通，接下来可以开始管理世界观文档。</p>
      </div>
      
      <div className="max-w-xl">
        <h2 className="text-lg font-medium mb-4">快捷导入资产</h2>
        <AssetImporter 
          onImport={(md, filename) => {
            sessionStorage.setItem('draft_import', md);
            const userFolder = user?.login || 'default';
            const fullPath = `knowledge_base/${userFolder}/${filename}`;
            router.push(`/dashboard/edit?path=${encodeURIComponent(fullPath)}&import=true`);
          }} 
        />
      </div>
    </div>
  );
}
