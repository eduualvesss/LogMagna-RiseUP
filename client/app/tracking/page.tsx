import { Suspense } from 'react';
import { Tracking } from '../screens';
import { PageSkeleton } from '../components/Loading';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Tracking />
    </Suspense>
  );
}
