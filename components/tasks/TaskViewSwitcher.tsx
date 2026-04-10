'use client';

import { cn } from '@/lib/utils';

export type FocusView = 'list' | 'week';

const VIEWS: { value: FocusView; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'week', label: 'Week' },
];

interface TaskViewSwitcherProps {
  view: FocusView;
  onChange: (v: FocusView) => void;
}

export function TaskViewSwitcher({ view, onChange }: TaskViewSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl p-0.5 shrink-0">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={cn(
            'px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all leading-none',
            view === v.value
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
