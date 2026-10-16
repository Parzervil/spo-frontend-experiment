import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    login: string;
    avatar_url: string;
    name: string | null;
  } | null;
  isGuest: boolean;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isGuest: false,
      setToken: (token) => set({ token, isGuest: false }),
      setUser: (user) => set({ user }),
      loginAsGuest: () =>
        set({
          token: null,
          isGuest: true,
          user: {
            login: 'guest',
            avatar_url: '',
            name: '访客体验官',
          },
        }),
      logout: () => set({ token: null, user: null, isGuest: false }),
    }),
    {
      name: 'auth-storage', // 将 token 保存在 localStorage 中
    }
  )
);
