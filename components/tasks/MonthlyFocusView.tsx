'use client';

import { useMemo } from 'react';
import { Task, Project, Workstream } from '@/types';
import { cn, isOverdue, getCurrentMonthYear } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { FocusTaskCard } from './FocusTaskCard';
import { FocusSummary } from './WeeklyHighlightsView';
import { Plus } from 'lucide-react';

interface MonthlyFocusViewProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  crossWorkstream?: boolean;
}

const WS_ORDER: Workstream[] = ['aramco', 'satorp', 'pmo', 'personal'];
const WS_LABELS: Record<Workstream, string> = {
  aramco: 'Aramco',
  satorp: 'SATORP',
  pmo: 'PMO',
  personal: 'Personal',
};

export function MonthlyFocusView({
  tasks,
  projects,
  onEdit,
  onStatusChange,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onDelete,
  onAdd,
  crossWorkstream,
}: MonthlyFocusViewProps) {
  const monthTasks = useMemo(() => {
    return tasks
      .filter((t) => t.isMonthFocus)
      .sort((a, b) => {
        if (a.priority === 'critical' && b.priority !== 'critical') return -1;
        if (b.priority === 'critical' && a.priority !== 'critical') return 1;
        const aOver = isOverdue(a.dueDate, a.status);
        const bOver = isOverdue(b.dueDate, b.status);
        if (aOver && !bOver) return -1;
        if (bOver && !aOver) return 1;
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (b.status === 'done' && a.status !== 'done') return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks]);

  const open = monthTasks.filter((t) => t.status !== 'done');
  const done = monthTasks.filter((t) => t.status === 'done');
  const overdue = open.filter((t) => isOverdue(t.dueDate, t.status));

  if (monthTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-12 flex flex-col items-center gap-4 text-center">
        <Zap size={22} className="text-zinc-300 dark:text-zinc-700" />
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            No monthly focus tasks
          </p>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-600 max-w-xs leading-relaxed">
            Mark tasks as monthly focus to track your key commitments for the month. Use the ⋯ menu or task drawer.
          </p>
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

  // When cross-workstream, group by workstream; otherwise flat list
  if (crossWorkstream) {
    const grouped = WS_ORDER.map((ws) => ({
      ws,
      tasks: monthTasks.filter((t) => t.workstream === ws),
    })).filter((g) => g.tasks.length > 0);

    return (
      <div className="space-y-4">
        <FocusSummary
          total={monthTasks.length}
          open={open.length}
          overdue={overdue.length}
          done={done.length}
          rangeLabel={getCurrentMonthYear()}
          accentLabel="THIS MONTH"
        />

        {grouped.map(({ ws, tasks: groupTasks }) => (
          <WorkstreamGroup
            key={ws}
            label={WS_LABELS[ws]}
            tasks={groupTasks}
            projects={projects}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onToggleWeekFocus={onToggleWeekFocus}
            onToggleMonthFocus={onToggleMonthFocus}
            onDelete={onDelete}
            showWorkstream={false}
          />
        ))}
      </div>
    );
  }

  // Single-workstream: flat list with optional done section
  return (
    <div className="space-y-4">
      <FocusSummary
        total={monthTasks.length}
        open={open.length}
        overdue={overdue.length}
        done={done.length}
        rangeLabel={getCurrentMonthYear()}
        accentLabel="THIS MONTH"
      />

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
              showWorkstream={false}
            />
          ))}
        </div>
      )}

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
                showWorkstream={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkstreamGroup({
  label,
  tasks,
  projects,
  onEdit,
  onStatusChange,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onDelete,
  showWorkstream,
}: {
  label: string;
  tasks: Task[];
  projects: Project[];
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, s: Task['status']) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onDelete: (id: string) => void;
  showWorkstream: boolean;
}) {
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div>
      {/* Workstream header */}
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-zinc-500 dark:text-zinc-500">
          {label}
        </span>
        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600 tabular-nums">
          {tasks.length}
        </span>
      </div>

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
            showWorkstream={showWorkstream}
          />
        ))}
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
            showWorkstream={showWorkstream}
          />
        ))}
      </div>
    </div>
  );
}
