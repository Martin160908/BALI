'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { HolaMundo } from '@/components/home/HolaMundo';

function subscribeToAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getAuthSnapshot() {
  return window.sessionStorage.getItem('bali-demo-authenticated') === 'true';
}

function getServerSnapshot() {
  return false;
}

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  return isAuthenticated ? <HolaMundo /> : null;
}
