'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';

const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function useAuth(requireAuth: boolean = true) {
  const { user, setUser, setLoading, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [setUser, logout]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // First try to get profile with current access token
      const profileResponse = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        setUser(userData);
        return true;
      }

      // If profile fails, try to refresh token
      const refreshed = await refreshToken();
      return refreshed;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, refreshToken]);

  useEffect(() => {
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // If user is already in store and we're not on a public path, don't check auth
    if (user && !isPublicPath) {
      return;
    }

    // Check auth on mount or when pathname changes
    checkAuth().then((authenticated) => {
      if (requireAuth && !authenticated && !isPublicPath) {
        router.push('/login');
      }
    });
  }, [pathname]); // Only run when pathname changes

  // Set up token refresh interval (refresh before expiry - at 14 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  return { user, checkAuth };
}
