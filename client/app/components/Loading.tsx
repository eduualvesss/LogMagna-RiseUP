import type { CSSProperties } from 'react';

export const Spinner = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <span
    role="status"
    aria-label="Carregando"
    style={{ width: size, height: size }}
    className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin-slow ${className}`}
  />
);

export const Skeleton = ({ className = '', style }: { className?: string; style?: CSSProperties }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <tbody className="divide-y divide-gray-100" aria-busy="true">
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="p-4">
            <Skeleton className="h-5" style={{ width: c === 0 ? '80%' : '55%' }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const PageSkeleton = () => (
  <div className="flex bg-[#f4f6f5] min-h-screen" aria-busy="true">
    <div className="w-64 bg-[#1a3326] h-screen fixed left-0 top-0" />
    <div className="ml-64 flex-1 p-8 space-y-6">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-5 w-96" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);