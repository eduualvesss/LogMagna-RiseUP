'use client';

import type { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-slate-200 mb-6">
      {items.map((item) => {
        const active = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active
                ? 'border-[#1a3326] text-[#1a3326]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {Icon && <Icon size={16} />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 text-[11px] rounded-full tabular-nums ${
                  active ? 'bg-[#1a3326] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
