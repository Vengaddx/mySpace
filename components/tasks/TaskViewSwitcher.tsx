'use client';

import { cn } from '@/lib/utils';

export type FocusView = 'tasks' | 'week' | 'today' | 'follow_up' | 'mail';

const VIEWS: { value: FocusView; label: string; badgeColor?: string }[] = [
  { value: 'tasks',     label: 'Active' },
  { value: 'week',      label: 'Week' },
  { value: 'today',     label: 'Today' },
  { value: 'follow_up', label: 'Follow Up', badgeColor: 'bg-orange-500' },
  { value: 'mail',      label: 'Mail',      badgeColor: 'bg-violet-500' },
];

interface TaskViewSwitcherProps {
  view: FocusView;
  onChange: (v: FocusView) => void;
  mailCount?: number;
  followUpCount?: number;
}

export function TaskViewSwitcher({ view, onChange, mailCount = 0, followUpCount = 0 }: TaskViewSwitcherProps) {
  const badges: Partial<Record<FocusView, number>> = {
    mail:      mailCount,
    follow_up: followUpCount,
  };

  return (
    <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl p-0.5 shrink-0">
      {VIEWS.map((v) => {
        const count = badges[v.value] ?? 0;
        return (
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
            {count > 0 && (
              <span className={cn('absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none', v.badgeColor)}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
