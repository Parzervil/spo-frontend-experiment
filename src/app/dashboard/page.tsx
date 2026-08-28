'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Octokit } from 'octokit';
import AssetImporter from '@/components/AssetImporter';

export default function Dashboard() {
  const { token, user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      router.replace('/');
    } else if (mounted && token && !user) {
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
        } catch (error) {
          console.error("Token invalid or expired", error);
          logout();
          router.replace('/');
        }
      };
      fetchUser();
    }
  }, [mounted, token, router, setUser, user, logout]);

  if (!mounted || !token) return null;

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
