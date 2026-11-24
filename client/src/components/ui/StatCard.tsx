import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './Loading';

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  loading?: boolean;
  tone?: 'default' | 'emerald' | 'amber';
}

const TONE_MAP = {
  default: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
};

export function StatCard({ label, value, sub, icon: Icon, loading = false, tone = 'default' }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`p-2 rounded-xl ${TONE_MAP[tone]}`}>
          <Icon size={17} />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
        {loading ? <Skeleton className="h-8 w-28" /> : value}
      </div>
      <div className="text-xs text-slate-500 mt-1.5">
        {loading ? <Skeleton className="h-3.5 w-36 mt-1" /> : sub}
      </div>
    </div>
  );
}
