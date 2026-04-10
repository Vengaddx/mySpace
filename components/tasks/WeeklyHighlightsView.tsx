'use client';

import { useMemo } from 'react';
import { Task, Project } from '@/types';
import { cn, isOverdue, getCurrentWeekRange } from '@/lib/utils';
import { Star } from 'lucide-react';
import { FocusTaskCard } from './FocusTaskCard';
import { Plus } from 'lucide-react';

interface WeeklyHighlightsViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  /** Whether the current context spans multiple workstreams (All view) */
  crossWorkstream?: boolean;
}

export function WeeklyHighlightsView({
  tasks,
  projects,
  onEdit,
  onStatusChange,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onDelete,
  onAdd,
  crossWorkstream,
}: WeeklyHighlightsViewProps) {
  const weekTasks = useMemo(() => {
    const focused = tasks.filter((t) => t.isWeekFocus);
    return [...focused].sort((a, b) => {
      // Critical first
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      // Overdue next
      const aOver = isOverdue(a.dueDate, a.status);
      const bOver = isOverdue(b.dueDate, b.status);
      if (aOver && !bOver) return -1;
      if (bOver && !aOver) return 1;
      // Done at bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (b.status === 'done' && a.status !== 'done') return -1;
      // Then by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);

  const open = weekTasks.filter((t) => t.status !== 'done');
  const done = weekTasks.filter((t) => t.status === 'done');
  const overdue = open.filter((t) => isOverdue(t.dueDate, t.status));

  if (weekTasks.length === 0) {
    return (
      <EmptyFocusState
        icon={<Star size={22} className="text-zinc-300 dark:text-zinc-700" />}
        title="No weekly highlights"
        body="Mark tasks as weekly highlights to see them here. Use the ⋯ menu on any task, or toggle in the task drawer."
        onAdd={onAdd}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <FocusSummary
        total={weekTasks.length}
        open={open.length}
        overdue={overdue.length}
        done={done.length}
        rangeLabel={getCurrentWeekRange()}
        accentLabel="THIS WEEK"
      />

      {/* Open tasks */}
      {open.length > 0 && (
        <div className="space-y-2">
          {open.map((task) => (
            <FocusTaskCard
              key={task.id}
              task={task}
              projects={projects}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onToggleWeekFocus={onToggleWeekFocus}
              onToggleMonthFocus={onToggleMonthFocus}
              onDelete={onDelete}
              showWorkstream={crossWorkstream}
            />
          ))}
        </div>
      )}

      {/* Done tasks — collapsed section */}
      {done.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300 dark:text-zinc-700 mb-2 px-0.5">
            Completed · {done.length}
          </p>
          <div className="space-y-2">
            {done.map((task) => (
              <FocusTaskCard
                key={task.id}
                task={task}
                projects={projects}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                onToggleWeekFocus={onToggleWeekFocus}
                onToggleMonthFocus={onToggleMonthFocus}
                onDelete={onDelete}
                showWorkstream={crossWorkstream}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

interface FocusSummaryProps {
  total: number;
  open: number;
  overdue: number;
  done: number;
  rangeLabel: string;
  accentLabel: string;
}

export function FocusSummary({
  total,
  open,
  overdue,
  done,
  rangeLabel,
  accentLabel,
}: FocusSummaryProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold tracking-[0.18em] text-zinc-400 dark:text-zinc-600 uppercase">
          {accentLabel}
        </span>
        <span className="text-[12px] text-zinc-400 dark:text-zinc-600">{rangeLabel}</span>
      </div>

      <div className="flex items-center gap-3 text-[12px]">
        <StatPill value={open} label="open" />
        {overdue > 0 && <StatPill value={overdue} label="overdue" emphasis />}
        <StatPill value={done} label="done" muted />
      </div>
    </div>
  );
}

function StatPill({
  value,
  label,
  emphasis,
  muted,
}: {
  value: number;
  label: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1',
        emphasis
          ? 'text-zinc-700 dark:text-zinc-300'
          : muted
          ? 'text-zinc-300 dark:text-zinc-600'
          : 'text-zinc-500 dark:text-zinc-500'
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function EmptyFocusState({
  icon,
  title,
  body,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-12 flex flex-col items-center gap-4 text-center">
      {icon}
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
        <p className="text-[12px] text-zinc-400 dark:text-zinc-600 max-w-xs leading-relaxed">{body}</p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Plus size={12} />
        New Task
      </button>
    </div>
  );
}
