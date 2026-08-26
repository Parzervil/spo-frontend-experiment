'use client';
import { useThemeStore, ThemeType } from '@/store/useThemeStore';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="px-4 py-2 mt-4 mb-2">
      <p className="text-xs text-gray-500 mb-2 font-medium">界面主题</p>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeType)}
        className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-sm rounded-lg p-2 outline-none focus:border-accent"
      >
        <option value="system">跟随系统</option>
        <option value="light">Default Light</option>
        <option value="dark">Default Dark</option>
      </select>
    </div>
  );
}
