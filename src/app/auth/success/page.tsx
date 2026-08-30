'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('access_token');
    const userLogin = searchParams.get('user_login');
    const userAvatar = searchParams.get('user_avatar');
    const userName = searchParams.get('user_name');

    if (token) {
      setToken(token);
      if (userLogin) {
        setUser({
          login: userLogin,
          avatar_url: userAvatar || '',
          name: userName || userLogin,
        });
      }
      router.replace('/dashboard');
    } else {
      router.replace('/');
    }
  }, [searchParams, router, setToken, setUser]);

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
