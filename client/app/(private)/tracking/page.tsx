import { Suspense } from 'react';
import TrackingView from '@/components/features/tracking/TrackingView';
import { ListSkeleton } from '@/components/ui/Loading';

export const metadata = {
  title: 'Rastreamento Operacional | LogMagna',
};

export default function TrackingPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <TrackingView />
    </Suspense>
  );
}
