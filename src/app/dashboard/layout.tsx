'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const themeClasses = {
  default: {
    sidebar: 'bg-white dark:bg-black',
    main: 'bg-gray-50 dark:bg-[#0a0a0a]',
  },
  peach: {
    sidebar: 'bg-[#fff5f0] dark:bg-[#2a1a15]',
    main: 'bg-[#fcf2ed] dark:bg-[#20100d]',
  },
  mint: {
    sidebar: 'bg-[#f0fff4] dark:bg-[#142218]',
    main: 'bg-[#f5fff7] dark:bg-[#0c1810]',
  },
  blue: {
    sidebar: 'bg-[#f0f7ff] dark:bg-[#131c26]',
    main: 'bg-[#f5f9ff] dark:bg-[#0a1118]',
  },
  lavender: {
    sidebar: 'bg-[#faf0ff] dark:bg-[#20152a]',
    main: 'bg-[#fdf7ff] dark:bg-[#150d1a]',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const pathname = usePathname();

  const navs = [
    { name: '工作台首页', path: '/dashboard' },
    { name: '知识库 (知识引擎)', path: '/dashboard/knowledge' },
    { name: '协作中心 (动态)', path: '/dashboard/discussions' },
  ];

  const currentTheme = themeClasses[theme] || themeClasses.default;

  return (
    <div className="flex h-screen font-[family-name:var(--font-geist-sans)] transition-colors duration-300">
      {/* 侧边栏 */}
      <aside className={`w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 transition-colors duration-300 ${currentTheme.sidebar}`}>
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
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
              }`}
            >
              {nav.name}
            </Link>
          ))}
        </nav>

        <ThemeSwitcher />

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
      <main className={`flex-1 overflow-auto transition-colors duration-300 ${currentTheme.main}`}>
        {children}
      </main>
    </div>
  );
}
