'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const token = searchParams.get('access_token');
    if (token) {
      setToken(token);
      // 清除 URL 中的 token 并跳转到工作台
      router.replace('/dashboard');
    } else {
      router.replace('/');
    }
  }, [searchParams, router, setToken]);

  return (
    <div className="flex min-h-screen items-center justify-center font-[family-name:var(--font-geist-sans)]">
      <p className="text-gray-500 animate-pulse">鉴权成功，正在为您加载工作台...</p>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>}>
      <AuthSuccessContent />
    </Suspense>
  );
}
