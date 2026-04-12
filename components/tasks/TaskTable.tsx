'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import { cn, formatDateShort, isOverdue, isToday } from '@/lib/utils';
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  AlertCircle,
  Calendar,
  Bell,
  Pencil,
  Trash2,
  Zap,
  PlayCircle,
  Star,
  CheckCircle,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  onToggleCritical: (id: string) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onEdit: (task: Task) => void;
}

type SortKey = 'title' | 'priority' | 'status' | 'dueDate';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { in_progress: 0, todo: 1, follow_up: 2, done: 3 };

export function TaskTable({
  tasks,
  onStatusChange,
  onDelete,
  onToggleCritical,
  onToggleWeekFocus,
  onToggleMonthFocus,
  onEdit,
}: TaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'dueDate') {
      cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortKey === 'priority') {
      cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    } else if (sortKey === 'status') {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    } else if (sortKey === 'title') {
      cmp = a.title.localeCompare(b.title);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800/80">
              {/* # */}
              <th className="w-10 pl-4 pr-2 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
                  #
                </span>
              </th>
              {/* Checkbox */}
              <th className="w-10 pr-2 py-3" />
              {/* Task name */}
              <ColHeader label="Task" sortKey="title" current={sortKey} dir={sortDir} onSort={handleSort} />
              {/* Priority */}
              <ColHeader
                label="Priority"
                sortKey="priority"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="hidden sm:table-cell"
              />
              {/* Status */}
              <ColHeader
                label="Status"
                sortKey="status"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="hidden md:table-cell"
              />
              {/* Due date */}
              <ColHeader
                label="Due"
                sortKey="dueDate"
                current={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="hidden sm:table-cell"
              />
              {/* Reminder */}
              <th className="px-3 py-3 hidden lg:table-cell">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Reminder
                </span>
              </th>
              {/* Actions */}
              <th className="w-12 pr-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, i) => (
              <TaskRow
                key={task.id}
                sno={i + 1}
                task={task}
                isLast={i === sorted.length - 1}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onToggleCritical={onToggleCritical}
                onToggleWeekFocus={onToggleWeekFocus}
                onToggleMonthFocus={onToggleMonthFocus}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColHeader({
  label, sortKey, current, dir, onSort, className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <th className={cn('text-left px-3 py-3 whitespace-nowrap', className)}>
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors',
          active
            ? 'text-zinc-700 dark:text-zinc-200'
            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
        )}
      >
        {label}
        <span className="ml-0.5">
          {active ? (
            dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          ) : (
            <ChevronsUpDown size={11} className="opacity-40" />
          )}
        </span>
      </button>
    </th>
  );
}

function TaskRow({
  sno, task, isLast, onStatusChange, onDelete, onToggleCritical, onToggleWeekFocus, onToggleMonthFocus, onEdit,
}: {
  sno: number;
  task: Task;
  isLast: boolean;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  onToggleCritical: (id: string) => void;
  onToggleWeekFocus: (id: string) => void;
  onToggleMonthFocus: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);
  const dueToday = isToday(task.dueDate);
  const isDone = task.status === 'done';

  return (
    <tr
      className={cn(
        'group cursor-pointer transition-colors',
        isDone ? 'opacity-45' : '',
        !isLast && 'border-b border-zinc-100 dark:border-zinc-800/60',
        'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40'
      )}
      onClick={() => onEdit(task)}
    >
      {/* Sno */}
      <td className="pl-4 pr-2 py-3.5 w-10">
        <span className="text-[11px] text-zinc-300 dark:text-zinc-600 tabular-nums">{sno}</span>
      </td>

      {/* Checkbox */}
      <td className="pr-2 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onStatusChange(task.id, isDone ? 'todo' : 'done')}
          className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <CheckCircle2
            size={15}
            className={cn(isDone && 'text-zinc-400 dark:text-zinc-500 fill-zinc-100 dark:fill-zinc-800')}
          />
        </button>
      </td>

      {/* Task name */}
      <td className="px-3 py-3.5 min-w-0 max-w-[320px]">
        <div className="flex items-center gap-2 min-w-0">
          {task.priority === 'critical' && !isDone && (
            <AlertCircle size={12} className="text-accent-orange shrink-0" />
          )}
          <p
            className={cn(
              'text-[13px] font-medium leading-snug truncate',
              isDone
                ? 'line-through text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-900 dark:text-zinc-50'
            )}
          >
            {task.title}
          </p>
        </div>
      </td>

      {/* Priority */}
      <td className="px-3 py-3.5 hidden sm:table-cell">
        <PriorityChip priority={task.priority} />
      </td>

      {/* Status */}
      <td className="px-3 py-3.5 hidden md:table-cell">
        <StatusChip status={task.status} />
      </td>

      {/* Due Date */}
      <td className="px-3 py-3.5 hidden sm:table-cell whitespace-nowrap">
        <div
          className={cn(
            'flex items-center gap-1.5 text-[12px] font-medium',
            overdue && !isDone
              ? 'text-zinc-500 dark:text-zinc-400'
              : dueToday && !isDone
              ? 'text-zinc-800 dark:text-zinc-200'
              : 'text-zinc-400 dark:text-zinc-500'
          )}
        >
          <Calendar size={11} />
          {overdue && !isDone ? (
            <span>Overdue</span>
          ) : dueToday && !isDone ? (
            <span>Today</span>
          ) : (
            <span>{formatDateShort(task.dueDate)}</span>
          )}
        </div>
      </td>

      {/* Reminder */}
      <td className="px-3 py-3.5 hidden lg:table-cell whitespace-nowrap">
        {task.reminderAt ? (
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-400 dark:text-zinc-500">
            <Bell size={11} />
            <span>{formatDateShort(task.reminderAt)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-200 dark:text-zinc-700">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="pr-4 py-3.5 w-12" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex justify-end">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <RowMenu
              task={task}
              onEdit={() => { setMenuOpen(false); onEdit(task); }}
              onDelete={() => { setMenuOpen(false); onDelete(task.id); }}
              onStatusChange={(s) => { setMenuOpen(false); onStatusChange(task.id, s); }}
              onToggleCritical={() => { setMenuOpen(false); onToggleCritical(task.id); }}
              onToggleWeekFocus={() => { setMenuOpen(false); onToggleWeekFocus(task.id); }}
              onToggleMonthFocus={() => { setMenuOpen(false); onToggleMonthFocus(task.id); }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function PriorityChip({ priority }: { priority: Task['priority'] }) {
  const styles: Record<Task['priority'], string> = {
    critical: 'bg-accent-orange/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-orange/40',
    high:     'bg-accent-lime/20   text-zinc-800 dark:text-zinc-100 ring-1 ring-accent-lime/40',
    medium:   'bg-accent-cyan/15   text-zinc-800 dark:text-zinc-100 ring-1 ring-accent-cyan/30',
    low:      'text-zinc-400 dark:text-zinc-500',
  };
  const labels: Record<Task['priority'], string> = {
    critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
  };
  return (
    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap', styles[priority])}>
      {labels[priority]}
    </span>
  );
}

function StatusChip({ status }: { status: Task['status'] }) {
  const styles: Record<Task['status'], string> = {
    in_progress: 'bg-accent-cyan/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-cyan/40',
    todo:        'border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400',
    follow_up:    'text-zinc-400 dark:text-zinc-500 italic',
    done:        'text-zinc-300 dark:text-zinc-600',
  };
  const labels: Record<Task['status'], string> = {
    in_progress: 'In Progress', todo: 'To Do', follow_up: 'Follow Up', done: 'Done',
  };
  return (
    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap', styles[status])}>
      {labels[status]}
    </span>
  );
}

function RowMenu({
  task, onEdit, onDelete, onStatusChange, onToggleCritical, onToggleWeekFocus, onToggleMonthFocus, onClose,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: Task['status']) => void;
  onToggleCritical: () => void;
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
      <MenuBtn icon={<Pencil size={13} />} label="Edit" onClick={onEdit} />
      <MenuBtn icon={<CheckCircle size={13} />} label="Mark Done" onClick={() => onStatusChange('done')} />
      <MenuBtn icon={<PlayCircle size={13} />} label="In Progress" onClick={() => onStatusChange('in_progress')} />
      <MenuBtn
        icon={<Zap size={13} />}
        label={task.priority === 'critical' ? 'Remove Critical' : 'Mark Critical'}
        onClick={onToggleCritical}
      />
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <MenuBtn
        icon={<Star size={13} className={task.isWeekFocus ? 'fill-current' : ''} />}
        label={task.isWeekFocus ? 'Remove Week Highlight' : 'Add to Week'}
        onClick={onToggleWeekFocus}
      />
      <MenuBtn
        icon={<Zap size={13} className={task.isMonthFocus ? 'fill-current' : ''} />}
        label={task.isMonthFocus ? 'Remove Month Focus' : 'Add to Month'}
        onClick={onToggleMonthFocus}
      />
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <MenuBtn
        icon={<Trash2 size={13} />}
        label="Delete"
        onClick={onDelete}
        className="text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
      />
    </div>
  );
}

function MenuBtn({
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
