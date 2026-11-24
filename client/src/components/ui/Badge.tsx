import type { ReactNode } from 'react';
import type { BadgeVariant } from '@/lib/format';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15',
  brand: 'bg-[#e8f0eb] text-[#1a3326] ring-1 ring-inset ring-[#1a3326]/15',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
