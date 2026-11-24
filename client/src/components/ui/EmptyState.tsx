import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-[#e8f0eb] text-[#1a3326] flex items-center justify-center mb-4">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">{description}</p>
      {action}
    </div>
  );
}
