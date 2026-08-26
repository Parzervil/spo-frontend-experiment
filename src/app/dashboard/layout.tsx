'use client';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

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
          <div className="flex items-center gap-3">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.login}</p>
            </div>
            <button onClick={logout} className="text-xs text-red-500 hover:underline shrink-0">
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto bg-[#F9F9F9] dark:bg-[#101010]">
        {children}
      </main>
    </div>
  );
}
