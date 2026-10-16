'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isGuest, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navs = [
    { name: '工作台首页', path: '/dashboard' },
    { name: '知识库 (知识引擎)', path: '/dashboard/knowledge' },
    { name: '协作中心 (动态)', path: '/dashboard/discussions' },
  ];

  return (
    <div className="flex h-screen font-[family-name:var(--font-geist-sans)]">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-gray-200 dark:border-[#222] bg-white dark:bg-[#151515] flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold">世界观共创</h2>
          {mounted && isGuest && (
            <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              游客浏览模式
            </span>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navs.map((nav) => (
            <Link 
              key={nav.path} 
              href={nav.path}
              className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                pathname === nav.path 
                  ? 'bg-black text-white dark:bg-white dark:text-black font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]'
              }`}
            >
              {nav.name}
            </Link>
          ))}
        </nav>

        <ThemeSwitcher />

        <div className="p-4 border-t border-gray-200 dark:border-[#222]">
          {mounted && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || user?.login || '未登录'}</p>
                  {isGuest && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">只读权限</span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    logout();
                    router.push('/');
                  }} 
                  className="text-xs text-red-500 hover:underline shrink-0 cursor-pointer"
                >
                  退出
                </button>
              </div>

              {isGuest && (
                <Link
                  href="/"
                  className="block text-center text-xs py-1.5 px-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  登录 GitHub 参与创作 &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto bg-[#F9F9F9] dark:bg-[#101010]">
        {children}
      </main>
    </div>
  );
}
