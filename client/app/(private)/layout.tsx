'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { NotificacoesProvider } from '@/components/providers/NotificacoesProvider';
import { PageSkeleton } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/auth-context';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageSkeleton />;
  }

  return (
    <NotificacoesProvider>
      <AppShell>{children}</AppShell>
    </NotificacoesProvider>
  );
}
