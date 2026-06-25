'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Task, Project } from '@/types';
import { cn, isOverdue, isToday } from '@/lib/utils';
import { FocusTaskCard } from './FocusTaskCard';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface FocusListViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FocusListView({
  tasks, projects, onEdit, onStatusChange, onToggleWeekFocus, onToggleMonthFocus, onDelete,
}: FocusListViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const { overdue, today, completedToday } = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const completedToday: Task[] = [];

    tasks.forEach((t) => {
      if (t.status === 'done') {
        const doneAt = t.completionDate ?? t.updatedAt;
        if (isToday(doneAt)) completedToday.push(t);
        return;
      }
      if (t.isUnscheduled) return;
      if (isOverdue(t.dueDate, t.status, t.isUnscheduled)) overdue.push(t);
      else if (isToday(t.dueDate)) today.push(t);
    });

    const byPriority = (a: Task, b: Task) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    overdue.sort(byPriority);
    today.sort(byPriority);
    completedToday.sort((a, b) =>
      (b.completionDate ?? b.updatedAt).localeCompare(a.completionDate ?? a.updatedAt)
    );

    return { overdue, today, completedToday };
  }, [tasks]);

  const isEmpty = overdue.length === 0 && today.length === 0 && completedToday.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-16 flex flex-col items-center gap-3 text-center">
        <Sparkles size={22} className="text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Nothing due today.</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Enjoy the clear runway.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <section>
          <SectionHeader label="Overdue" count={overdue.length} tone="warn" />
          <div className="space-y-2">
            {overdue.map((t) => (
              <FocusTaskCard
                key={t.id}
                task={t}
                projects={projects}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                onToggleWeekFocus={onToggleWeekFocus}
                onToggleMonthFocus={onToggleMonthFocus}
                onDelete={onDelete}
                showWorkstream
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader label="Today" count={today.length} />
        {today.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 py-1">No tasks scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {today.map((t) => (
              <FocusTaskCard
                key={t.id}
                task={t}
                projects={projects}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                onToggleWeekFocus={onToggleWeekFocus}
                onToggleMonthFocus={onToggleMonthFocus}
                onDelete={onDelete}
                showWorkstream
              />
            ))}
          </div>
        )}
      </section>

      {completedToday.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-600 uppercase mb-2.5 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            <ChevronDown size={12} className={cn('transition-transform', showCompleted && 'rotate-180')} />
            Completed Today
            <span className="font-normal opacity-70">· {completedToday.length}</span>
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completedToday.map((t) => (
                <FocusTaskCard
                  key={t.id}
                  task={t}
                  projects={projects}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onToggleWeekFocus={onToggleWeekFocus}
                  onToggleMonthFocus={onToggleMonthFocus}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeader({ label, count, tone }: { label: string; count: number; tone?: 'warn' }) {
  return (
    <p
      className={cn(
        'text-[11px] font-bold tracking-[0.15em] uppercase mb-2.5',
        tone === 'warn' ? 'text-accent-orange' : 'text-zinc-400 dark:text-zinc-600'
      )}
    >
      {label}
      {count > 0 && <span className="font-normal opacity-70"> · {count}</span>}
    </p>
  );
}
