'use client';

import { cn } from '@/lib/utils';

export type FocusView = 'list' | 'week' | 'today' | 'mail';

const VIEWS: { value: FocusView; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'week', label: 'Week' },
  { value: 'today', label: 'Today' },
  { value: 'mail', label: 'Mail' },
];

interface TaskViewSwitcherProps {
  view: FocusView;
  onChange: (v: FocusView) => void;
  mailCount?: number;
}

export function TaskViewSwitcher({ view, onChange, mailCount = 0 }: TaskViewSwitcherProps) {
  return (
    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl p-0.5 shrink-0">
      {VIEWS.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={cn(
            'relative px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all leading-none',
            view === v.value
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          )}
        >
          {v.label}
          {v.value === 'mail' && mailCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
              {mailCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
