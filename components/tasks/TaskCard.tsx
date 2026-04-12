'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import { cn, formatDateShort, isOverdue, isToday } from '@/lib/utils';
import { PriorityBadge, StatusBadge, WorkstreamBadge } from '@/components/ui/Badge';
import { Calendar, AlertCircle, Star, MoreHorizontal, CheckCircle2, Circle, PlayCircle, Bell, Mail, Pencil, Trash2, Zap } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: Task['status']) => void;
  onToggleCritical?: (id: string) => void;
  onClick?: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({
  task, onEdit, onDelete, onStatusChange, onToggleCritical, onClick, compact = false,
}: TaskCardProps) {
  const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);
  const dueToday = isToday(task.dueDate);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 cursor-pointer',
        'hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700',
        overdue && task.status !== 'done'
          ? 'border-zinc-300 dark:border-zinc-600'
          : 'border-zinc-100 dark:border-zinc-800',
        task.status === 'done' && 'opacity-60',
        compact ? 'px-4 py-3' : 'px-5 py-4'
      )}
      onClick={() => onClick?.(task)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            className="mt-0.5 shrink-0 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.(task.id, task.status === 'done' ? 'todo' : 'done');
            }}
            title={task.status}
          >
            <StatusIcon status={task.status} />
          </button>

          <div className="min-w-0 flex-1">
            <p className={cn(
              'text-sm font-medium text-zinc-900 dark:text-zinc-50 leading-snug',
              task.status === 'done' && 'line-through text-zinc-400 dark:text-zinc-500'
            )}>
              {task.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {task.priority === 'critical' && (
            <AlertCircle className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          )}
          {task.isWeekFocus && (
            <Star className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 fill-zinc-200 dark:fill-zinc-700" />
          )}
          <div className="relative">
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-all"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <TaskMenu
                task={task}
                onEdit={() => { setMenuOpen(false); onEdit?.(task); }}
                onDelete={() => { setMenuOpen(false); onDelete?.(task.id); }}
                onStatusChange={(s) => { setMenuOpen(false); onStatusChange?.(task.id, s); }}
                onToggleCritical={() => { setMenuOpen(false); onToggleCritical?.(task.id); }}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap ml-[26px]">
        <WorkstreamBadge workstream={task.workstream} />
        <PriorityBadge priority={task.priority} />
        {!compact && <StatusBadge status={task.status} />}
        <span className={cn(
          'flex items-center gap-1 text-[11px] font-medium',
          overdue ? 'text-zinc-500 dark:text-zinc-400' : dueToday ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'
        )}>
          <Calendar className="w-3 h-3" />
          {overdue ? `Overdue · ${formatDateShort(task.dueDate)}` : dueToday ? 'Today' : formatDateShort(task.dueDate)}
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'done')        return <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />;
  if (status === 'in_progress') return <PlayCircle   className="w-4 h-4" style={{ color: '#00C1FF' }} />;
  if (status === 'follow_up')   return <Bell         className="w-4 h-4" style={{ color: '#FF9900' }} />;
  if (status === 'send_mail')   return <Mail         className="w-4 h-4" style={{ color: '#a78bfa' }} />;
  return <Circle className="w-4 h-4" style={{ color: '#a1a1aa' }} />;
}

interface TaskMenuProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: Task['status']) => void;
  onToggleCritical: () => void;
  onClose: () => void;
}

function TaskMenu({ task, onEdit, onDelete, onStatusChange, onToggleCritical, onClose }: TaskMenuProps) {
  React.useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      className="absolute right-0 top-6 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-lg dark:shadow-black/40 py-1 w-44"
      onClick={(e) => e.stopPropagation()}
    >
      <MenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="Edit" onClick={onEdit} />
      <MenuItem icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Mark Done" onClick={() => onStatusChange('done')} />
      <MenuItem icon={<PlayCircle className="w-3.5 h-3.5" />} label="In Progress" onClick={() => onStatusChange('in_progress')} />
      <MenuItem icon={<Bell className="w-3.5 h-3.5" />} label="Follow Up" onClick={() => onStatusChange('follow_up')} />
      <MenuItem icon={<Mail className="w-3.5 h-3.5" />} label="Send Mail" onClick={() => onStatusChange('send_mail')} />
      <MenuItem icon={<Zap className="w-3.5 h-3.5" />} label={task.priority === 'critical' ? 'Remove Critical' : 'Mark Critical'} onClick={onToggleCritical} />
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
      <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={onDelete} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" />
    </div>
  );
}

function MenuItem({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button
      className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors', className)}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
