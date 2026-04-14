'use client';

import React from 'react';
import { Task, Project, Workstream } from '@/types';
import { cn, formatDateShort, isOverdue } from '@/lib/utils';
import { Bell, CheckCircle2, Calendar, AlertCircle, Pencil, Plus } from 'lucide-react';

const WORKSTREAM_LABEL: Record<Workstream, string> = {
  aramco:   'Aramco',
  satorp:   'SATORP',
  pmo:      'PMO',
  personal: 'Personal',
};

const WORKSTREAM_ACCENT: Record<Workstream, string> = {
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#FFB503',
  personal: '#F2296B',
};

const PRIORITY_RANK: Record<Task['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface FollowUpViewProps {
  tasks: Task[];
  projects: Project[];
  onMarkDone: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddTask: () => void;
}

export function FollowUpView({ tasks, projects, onMarkDone, onEdit, onAddTask }: FollowUpViewProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const followTasks = tasks
    .filter((t) => t.status === 'follow_up')
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  const groups = new Map<Workstream, Task[]>();
  for (const task of followTasks) {
    const ws = task.workstream as Workstream;
    if (!groups.has(ws)) groups.set(ws, []);
    groups.get(ws)!.push(task);
  }

  if (followTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
          <Bell size={20} className="text-orange-400 dark:text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No follow-ups pending</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Tasks marked "Follow Up" will appear here</p>
        </div>
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <Plus size={12} />
          New Follow-up
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([ws, wsTasks]) => (
        <WorkstreamGroup
          key={ws}
          workstream={ws}
          tasks={wsTasks}
          projectMap={projectMap}
          onMarkDone={onMarkDone}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function WorkstreamGroup({
  workstream, tasks, projectMap, onMarkDone, onEdit,
}: {
  workstream: Workstream;
  tasks: Task[];
  projectMap: Map<string, Project>;
  onMarkDone: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: WORKSTREAM_ACCENT[workstream] }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          {WORKSTREAM_LABEL[workstream]}
        </span>
        <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {tasks.map((task) => (
          <FollowUpRow
            key={task.id}
            task={task}
            project={task.projectId ? projectMap.get(task.projectId) : undefined}
            onMarkDone={onMarkDone}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function FollowUpRow({
  task, project, onMarkDone, onEdit,
}: {
  task: Task;
  project?: Project;
  onMarkDone: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
      onClick={() => onEdit(task)}
    >
      <div className="shrink-0 w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
        <Bell size={13} className="text-orange-400 dark:text-orange-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.priority === 'critical' && (
            <AlertCircle size={11} className="text-accent-orange shrink-0" />
          )}
          <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50 truncate leading-snug">
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {project && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{project.name}</span>
          )}
          {project && <span className="text-zinc-200 dark:text-zinc-700 text-[11px]">·</span>}
          <div className={cn('flex items-center gap-1 text-[11px]', overdue ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500')}>
            <Calendar size={10} />
            <span>{overdue ? 'Overdue' : formatDateShort(task.dueDate)}</span>
          </div>
          {task.priority === 'high' && (
            <>
              <span className="text-zinc-200 dark:text-zinc-700 text-[11px]">·</span>
              <span className="text-[11px] text-accent-lime font-medium">High</span>
            </>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(task)}
          title="Edit"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onMarkDone(task.id)}
          title="Mark done"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-[11px] font-semibold transition-colors"
        >
          <CheckCircle2 size={11} />
          Done
        </button>
      </div>
    </div>
  );
}
