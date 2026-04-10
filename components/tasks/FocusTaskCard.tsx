'use client';

import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { cn, isOverdue, isToday, formatDateShort } from '@/lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  Zap,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';

interface FocusTaskCardProps {
  task: Task;
  projects: Project[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onDelete: (id: string) => void;
  /** Show workstream label (used in month view grouped by workstream) */
  showWorkstream?: boolean;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  critical: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
  high: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
  medium: 'text-zinc-500 dark:text-zinc-400',
  low: 'text-zinc-300 dark:text-zinc-600',
};
const PRIORITY_LABELS: Record<Task['priority'], string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

const STATUS_STYLES: Record<Task['status'], string> = {
  in_progress: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
  todo: 'border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400',
  deferred: 'text-zinc-400 dark:text-zinc-500 italic',
  done: 'text-zinc-300 dark:text-zinc-600',
};
const STATUS_LABELS: Record<Task['status'], string> = {
  in_progress: 'In Progress', todo: 'To Do', deferred: 'Deferred', done: 'Done',
};

export function FocusTaskCard({
  task,
  projects,
  onEdit,
  onStatusChange,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onDelete,
  showWorkstream,
}: FocusTaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isToday(task.dueDate);
  const isDone = task.status === 'done';
  const project = projects.find((p) => p.id === task.projectId);

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all duration-150',
        isDone
          ? 'bg-white dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 opacity-50'
          : task.priority === 'critical' && overdue
          ? 'bg-white dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700'
          : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      )}
    >
      {/* Critical left accent */}
      {task.priority === 'critical' && !isDone && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-zinc-900 dark:bg-zinc-200 rounded-full" />
      )}

      <div
        className="px-4 py-3.5 flex items-start gap-3 cursor-pointer"
        onClick={() => onEdit(task)}
      >
        {/* Checkbox */}
        <button
          className="mt-0.5 shrink-0 text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, isDone ? 'todo' : 'done');
          }}
        >
          <CheckCircle2
            size={15}
            className={cn(isDone && 'text-zinc-400 dark:text-zinc-500 fill-zinc-100 dark:fill-zinc-800')}
          />
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Row 1: title + date */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {task.priority === 'critical' && !isDone && (
                <AlertCircle size={12} className="shrink-0 text-zinc-900 dark:text-zinc-100" />
              )}
              <p
                className={cn(
                  'text-[13.5px] font-medium leading-snug',
                  isDone
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-50'
                )}
              >
                {task.title}
              </p>
            </div>

            {/* Date badge */}
            {!isDone && (
              <span
                className={cn(
                  'shrink-0 text-[11px] font-semibold tracking-wide whitespace-nowrap flex items-center gap-1',
                  overdue
                    ? 'text-zinc-500 dark:text-zinc-400'
                    : dueToday
                    ? 'text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-500'
                )}
              >
                <Calendar size={10} />
                {overdue ? 'Overdue' : dueToday ? 'Today' : formatDateShort(task.dueDate)}
              </span>
            )}
          </div>

          {/* Row 2: chips */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span
              className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded-md',
                PRIORITY_STYLES[task.priority]
              )}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
            <span
              className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded-md',
                STATUS_STYLES[task.status]
              )}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {project && (
              <>
                <span className="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">
                  {project.name}
                </span>
              </>
            )}
            {showWorkstream && (
              <>
                <span className="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
                <span className="text-[11px] font-semibold tracking-wide uppercase text-zinc-400 dark:text-zinc-600">
                  {task.workstream === 'satorp'
                    ? 'SATORP'
                    : task.workstream === 'pmo'
                    ? 'PMO'
                    : task.workstream.charAt(0).toUpperCase() + task.workstream.slice(1)}
                </span>
              </>
            )}
          </div>

          {/* Row 3: notes snippet */}
          {task.notes && !isDone && (
            <p className="mt-1.5 text-[12px] text-zinc-400 dark:text-zinc-600 line-clamp-1 leading-relaxed">
              {task.notes}
            </p>
          )}
        </div>

        {/* Row actions menu */}
        <div
          className="relative shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <FocusCardMenu
              task={task}
              onEdit={() => { setMenuOpen(false); onEdit(task); }}
              onDelete={() => { setMenuOpen(false); onDelete(task.id); }}
              onStatusChange={(s) => { setMenuOpen(false); onStatusChange(task.id, s); }}
              onToggleWeekFocus={() => { setMenuOpen(false); onToggleWeekFocus(task.id); }}
              onToggleMonthFocus={() => { setMenuOpen(false); onToggleMonthFocus(task.id); }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FocusCardMenu({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onClose,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: Task['status']) => void;
  onToggleWeekFocus: () => void;
  onToggleMonthFocus: () => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [onClose]);

  return (
    <div
      className="absolute right-0 top-8 z-50 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-lg dark:shadow-black/40 py-1 w-48"
      onClick={(e) => e.stopPropagation()}
    >
      <Btn icon={<Pencil size={13} />} label="Edit" onClick={onEdit} />
      <Btn icon={<CheckCircle size={13} />} label="Mark Done" onClick={() => onStatusChange('done')} />
      <Btn icon={<PlayCircle size={13} />} label="In Progress" onClick={() => onStatusChange('in_progress')} />
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <Btn
        icon={<Star size={13} className={task.isWeekFocus ? 'fill-current' : ''} />}
        label={task.isWeekFocus ? 'Remove Week Highlight' : 'Add to Week'}
        onClick={onToggleWeekFocus}
      />
      <Btn
        icon={<Zap size={13} className={task.isMonthFocus ? 'fill-current' : ''} />}
        label={task.isMonthFocus ? 'Remove Month Focus' : 'Add to Month'}
        onClick={onToggleMonthFocus}
      />
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <Btn
        icon={<Trash2 size={13} />}
        label="Delete"
        onClick={onDelete}
        className="text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
      />
    </div>
  );
}

function Btn({
  icon, label, onClick, className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
