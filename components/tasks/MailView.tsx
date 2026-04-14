'use client';

import React from 'react';
import { Task, Project, Workstream } from '@/types';
import { cn, formatDateShort, isOverdue } from '@/lib/utils';
import {
  Mail,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Pencil,
  Plus,
} from 'lucide-react';

const WORKSTREAM_LABEL: Record<Workstream, string> = {
  aramco:   'Aramco',
  satorp:   'SATORP',
  pmo:      'PMO',
  personal: 'Personal',
};

const WORKSTREAM_ACCENT: Record<Workstream, string> = {
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#a1a1aa',
  personal: '#F2296B',
};

const PRIORITY_RANK: Record<Task['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface MailViewProps {
  tasks: Task[];
  projects: Project[];
  onMarkSent: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddMailTask: () => void;
}

export function MailView({ tasks, projects, onMarkSent, onEdit, onAddMailTask }: MailViewProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const mailTasks = tasks
    .filter((t) => t.status === 'send_mail')
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  // Group by workstream preserving priority order within each group
  const groups = new Map<Workstream, Task[]>();
  for (const task of mailTasks) {
    const ws = task.workstream as Workstream;
    if (!groups.has(ws)) groups.set(ws, []);
    groups.get(ws)!.push(task);
  }

  if (mailTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
          <Mail size={20} className="text-violet-400 dark:text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No pending mails</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Tasks marked "Send Mail" will appear here</p>
        </div>
        <button
          onClick={onAddMailTask}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <Plus size={12} />
          New Mail Task
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
          onMarkSent={onMarkSent}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function WorkstreamGroup({
  workstream,
  tasks,
  projectMap,
  onMarkSent,
  onEdit,
}: {
  workstream: Workstream;
  tasks: Task[];
  projectMap: Map<string, Project>;
  onMarkSent: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const accent = WORKSTREAM_ACCENT[workstream];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Group header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          {WORKSTREAM_LABEL[workstream]}
        </span>
        <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {tasks.map((task) => (
          <MailTaskRow
            key={task.id}
            task={task}
            project={task.projectId ? projectMap.get(task.projectId) : undefined}
            onMarkSent={onMarkSent}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function MailTaskRow({
  task,
  project,
  onMarkSent,
  onEdit,
}: {
  task: Task;
  project?: Project;
  onMarkSent: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
      onClick={() => onEdit(task)}
    >
      {/* Mail icon */}
      <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
        <Mail size={13} className="text-violet-400 dark:text-violet-400" />
      </div>

      {/* Title + meta */}
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
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
              {project.name}
            </span>
          )}
          {project && (
            <span className="text-zinc-200 dark:text-zinc-700 text-[11px]">·</span>
          )}
          <div
            className={cn(
              'flex items-center gap-1 text-[11px]',
              overdue ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'
            )}
          >
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

      {/* Actions */}
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
          onClick={() => onMarkSent(task.id)}
          title="Mark as sent"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-[11px] font-semibold transition-colors"
        >
          <CheckCircle2 size={11} />
          Sent
        </button>
      </div>
    </div>
  );
}
