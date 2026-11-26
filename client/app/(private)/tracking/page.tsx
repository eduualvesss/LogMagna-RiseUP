import { Suspense } from 'react';
import TrackingView from '@/components/features/tracking/TrackingView';
import { TableSkeleton } from '@/components/ui/Loading';

export const metadata = {
  title: 'Rastreamento Operacional | LogMagna',
};

export default function TrackingPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} />}>
      <TrackingView />
    </Suspense>
  );
}
