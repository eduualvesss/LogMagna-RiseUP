import type { CSSProperties } from 'react';

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      style={{ width: size, height: size }}
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin-slow ${className}`}
    />
  );
}

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody className="divide-y divide-slate-100" aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-5 py-4">
              <Skeleton className="h-4" style={{ width: c === 0 ? '75%' : '55%' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex bg-[#f8faf9] min-h-screen" aria-busy="true">
      <div className="hidden lg:block w-60 bg-[#11221a] h-screen fixed left-0 top-0" />
      <div className="lg:ml-60 flex-1 p-8 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
