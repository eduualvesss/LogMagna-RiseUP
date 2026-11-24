import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function Alert({
  variant = 'info',
  children,
  className = '',
}: {
  variant?: 'error' | 'success' | 'info' | 'warning';
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    info: 'bg-[#e8f0eb] text-[#1a3326] border-[#c8dcd0]',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
  };

  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm animate-pop-in ${styles[variant]} ${className}`}
    >
      <Icon size={17} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
