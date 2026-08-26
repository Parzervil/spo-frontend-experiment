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

  const themes: { id: ThemeType; color: string; label: string }[] = [
    { id: 'default', color: 'bg-gray-200', label: '默认' },
    { id: 'peach', color: 'bg-[#fff5f0]', label: '晚霞' },
    { id: 'mint', color: 'bg-[#f0fff4]', label: '薄荷' },
    { id: 'blue', color: 'bg-[#f0f7ff]', label: '海风' },
    { id: 'lavender', color: 'bg-[#faf0ff]', label: '薰衣草' },
  ];

  return (
    <div className="px-4 py-2 mt-4 mb-2">
      <p className="text-xs text-gray-500 mb-2 font-medium">应用主题</p>
      <div className="flex gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setTheme(t.id)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${t.color} ${
              theme === t.id 
                ? 'border-blue-500 scale-110 shadow-sm' 
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
