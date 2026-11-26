import { Suspense } from 'react';
import PublicTrackingView from '@/components/features/public/PublicTrackingView';
import { PageSkeleton } from '@/components/ui/Loading';

export const metadata = {
  title: 'Rastreamento Público | LogMagna',
};

export default function RastrearPublicoPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PublicTrackingView />
    </Suspense>
  );
}
