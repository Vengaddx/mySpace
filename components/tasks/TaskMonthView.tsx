'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Task } from '@/types';
import { cn, isOverdue } from '@/lib/utils';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_LABELS_SHORT = ['S','M','T','W','T','F','S'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDetailDate(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
}

function getPriorityStyle(priority: Task['priority'], status: Task['status']) {
  if (status === 'done') return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 line-through';
  switch (priority) {
    case 'critical': return 'bg-accent-orange/90 text-white';
    case 'high':     return 'bg-accent-green/80 text-white';
    case 'medium':   return 'bg-accent-cyan/80 text-white';
    default:         return 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300';
  }
}

function getPriorityDot(priority: Task['priority'], status: Task['status']) {
  if (status === 'done') return 'bg-zinc-300 dark:bg-zinc-700';
  switch (priority) {
    case 'critical': return 'bg-accent-orange';
    case 'high':     return 'bg-accent-green';
    case 'medium':   return 'bg-accent-cyan';
    default:         return 'bg-zinc-400 dark:bg-zinc-600';
  }
}

interface TaskMonthViewProps {
  tasks: Task[];
  today: string;
  onTaskEdit: (task: Task) => void;
}

export function TaskMonthView({ tasks, today, onTaskEdit }: TaskMonthViewProps) {
  const todayDate = new Date(today + 'T12:00:00');
  const [viewYear,  setViewYear]  = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setSelectedDate(null);
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  }

  // Grid cells (full weeks)
  const cells = useMemo<Date[]>(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last  = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const total = Math.ceil((startPad + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) =>
      new Date(viewYear, viewMonth, 1 - startPad + i)
    );
  }, [viewYear, viewMonth]);

  // Map dateStr → tasks due on that day (exclude unscheduled)
  const taskMap = useMemo<Record<string, Task[]>>(() => {
    const map: Record<string, Task[]> = {};
    tasks
      .filter(t => !t.isUnscheduled && t.status !== 'done')
      .forEach(t => {
        const ds = t.dueDate.slice(0, 10);
        if (!map[ds]) map[ds] = [];
        map[ds].push(t);
      });
    return map;
  }, [tasks]);

  const isInCurrentMonth = (d: Date) =>
    d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  const isTodayFn = (d: Date) => toDateStr(d) === today;

  const selectedTasks = selectedDate ? (taskMap[selectedDate] ?? []) : [];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white tracking-tight">
            {MONTH_NAMES[viewMonth]}
          </h2>
          <span className="text-[14px] text-zinc-400 dark:text-zinc-600 font-normal">
            {viewYear}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goToday}
            className="px-2.5 py-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Day-of-week headers ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800/80">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className={cn('py-2 text-center', i < 6 && 'border-r border-zinc-100 dark:border-zinc-800/60')}>
            {/* Full label on md+, single letter on mobile */}
            <span className="hidden sm:inline text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-600 uppercase">
              {label}
            </span>
            <span className="sm:hidden text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
              {DAY_LABELS_SHORT[i]}
            </span>
          </div>
        ))}
      </div>

      {/* ── Day Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          const ds         = toDateStr(date);
          const inMonth    = isInCurrentMonth(date);
          const isToday    = isTodayFn(date);
          const isSelected = ds === selectedDate;
          const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
          const isLastRow  = idx >= cells.length - 7;
          const isLastCol  = date.getDay() === 6;
          const dayTasks   = taskMap[ds] ?? [];
          const hasOverdue = dayTasks.some(t => isOverdue(t.dueDate, t.status, t.isUnscheduled));

          // Sort: critical first, then by status
          const sorted = [...dayTasks].sort((a, b) => {
            const po: Record<string,number> = { critical:0, high:1, medium:2, low:3 };
            return (po[a.priority] ?? 3) - (po[b.priority] ?? 3);
          });

          return (
            <div
              key={ds}
              onClick={() => {
                if (!inMonth) return;
                setSelectedDate(isSelected ? null : ds);
              }}
              className={cn(
                'relative flex flex-col pt-2 pb-1.5 px-1 min-h-[72px] sm:min-h-[90px]',
                'border-b border-r border-zinc-100 dark:border-zinc-800/60',
                isLastRow && 'border-b-0',
                isLastCol && 'border-r-0',
                !inMonth && 'bg-zinc-50/60 dark:bg-[#0d0d0d]',
                isSelected && 'bg-zinc-100 dark:bg-zinc-900',
                inMonth && !isSelected && 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer',
              )}
            >
              {/* Day number */}
              <div className="flex justify-center mb-1">
                <span className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-[13px] font-medium leading-none select-none transition-all',
                  isToday
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                    : !inMonth
                    ? 'text-zinc-300 dark:text-zinc-700'
                    : isWeekend
                    ? 'text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-700 dark:text-zinc-300'
                )}>
                  {date.getDate()}
                </span>
              </div>

              {/* Task pills — desktop shows labels, mobile shows dots */}
              <div className="flex flex-col gap-[2px] px-0.5">
                {/* Desktop: up to 3 labeled pills */}
                <div className="hidden sm:flex flex-col gap-[2px]">
                  {sorted.slice(0, 3).map(t => (
                    <button
                      key={t.id}
                      onClick={e => { e.stopPropagation(); onTaskEdit(t); }}
                      title={t.title}
                      className={cn(
                        'w-full rounded-[4px] px-1 py-[2px] text-[9px] font-bold leading-none truncate text-left transition-opacity hover:opacity-75',
                        getPriorityStyle(t.priority, t.status)
                      )}
                    >
                      {t.title}
                    </button>
                  ))}
                  {sorted.length > 3 && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-600 pl-1 leading-none">
                      +{sorted.length - 3} more
                    </span>
                  )}
                </div>

                {/* Mobile: dots only */}
                <div className="sm:hidden flex items-center justify-center gap-[3px] flex-wrap pt-0.5">
                  {sorted.slice(0, 5).map(t => (
                    <div
                      key={t.id}
                      className={cn('w-1.5 h-1.5 rounded-full', getPriorityDot(t.priority, t.status))}
                    />
                  ))}
                  {sorted.length > 5 && (
                    <span className="text-[8px] text-zinc-400 dark:text-zinc-600 leading-none">+{sorted.length-5}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected Day Detail Panel ───────────────────────────────────────── */}
      {selectedDate && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-4 sm:px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-500 uppercase">
              {formatDetailDate(selectedDate)}
            </p>
            <button
              onClick={() => setSelectedDate(null)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-600 py-2">No open tasks on this day.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks
                .sort((a,b) => {
                  const po: Record<string,number> = { critical:0, high:1, medium:2, low:3 };
                  return (po[a.priority]??3) - (po[b.priority]??3);
                })
                .map(task => {
                  const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);
                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskEdit(task)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left group"
                    >
                      {/* Priority dot */}
                      <div className={cn('w-2 h-2 rounded-full shrink-0', getPriorityDot(task.priority, task.status))} />

                      {/* Title */}
                      <span className={cn(
                        'flex-1 text-[13px] font-medium truncate',
                        task.status === 'done'
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-800 dark:text-zinc-200'
                      )}>
                        {task.title}
                      </span>

                      {/* Overdue badge */}
                      {overdue && (
                        <span className="text-[9px] font-bold tracking-wider text-accent-orange uppercase shrink-0">
                          Overdue
                        </span>
                      )}

                      {/* Priority badge */}
                      <span className={cn(
                        'text-[9px] font-bold tracking-wider uppercase shrink-0 px-2 py-0.5 rounded-full',
                        getPriorityStyle(task.priority, task.status)
                      )}>
                        {task.priority}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
