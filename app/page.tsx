'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, checkAuth } = useAuth(false);

  useEffect(() => {
    const redirectUser = async () => {
      if (user) {
        // User is already loaded from store
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/home');
        }
      } else {
        // Try to authenticate
        const authenticated = await checkAuth();
        if (authenticated) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/home');
          }
        } else {
          router.push('/login');
        }
      }
    };

    redirectUser();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
