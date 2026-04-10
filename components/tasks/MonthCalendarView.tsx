'use client';

import React, { useState, useMemo } from 'react';
import { Task, Project } from '@/types';
import { cn, isToday } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthCalendarViewProps {
  tasks: Task[];
  projects?: Project[];
  onEditTask: (task: Task) => void;
  onMonthChange?: (month: string) => void; // YYYY-MM
}

const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const IS_WEEKEND  = [false, false, false, false, false, true, true]; // col 5=Fri, 6=Sat

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Sun-first: JS getDay() 0=Sun matches col 0 directly
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ];
  // pad to complete final week
  while (cells.length % 7 !== 0) cells.push(null);

  const grid: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    grid.push(cells.slice(i, i + 7));
  }
  return grid;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthCalendarView({ tasks, projects = [], onEditTask, onMonthChange }: MonthCalendarViewProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function notify(y: number, m: number) {
    onMonthChange?.(`${y}-${String(m + 1).padStart(2, '0')}`);
  }

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear((y) => { notify(y - 1, 11); return y - 1; }); }
    else { setMonth((m) => { notify(year, m - 1); return m - 1; }); }
  };
  const goForward = () => {
    if (month === 11) { setMonth(0); setYear((y) => { notify(y + 1, 0); return y + 1; }); }
    else { setMonth((m) => { notify(year, m + 1); return m + 1; }); }
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); notify(now.getFullYear(), now.getMonth()); };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={goForward}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            onClick={goToday}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Day header row */}
        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800/80">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider',
                IS_WEEKEND[i]
                  ? 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900/50'
                  : 'text-zinc-400 dark:text-zinc-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {grid.map((week, wi) => (
          <div
            key={wi}
            className={cn(
              'grid grid-cols-7',
              wi < grid.length - 1 && 'border-b border-zinc-100 dark:border-zinc-800/60'
            )}
          >
            {week.map((day, di) => {
              const isWeekend = IS_WEEKEND[di];

              if (!day) {
                return (
                  <div
                    key={di}
                    className={cn(
                      'min-h-[80px] sm:min-h-[96px] p-2',
                      di < 6 && 'border-r border-zinc-100 dark:border-zinc-800/60',
                      isWeekend && 'bg-zinc-50 dark:bg-zinc-900/50',
                    )}
                  />
                );
              }

              const todayFlag = isToday(day.toISOString());
              const dayTasks = tasks.filter((t) => isSameDay(new Date(t.dueDate), day));
              const MAX_VISIBLE = 2;
              const visible = dayTasks.slice(0, MAX_VISIBLE);
              const overflow = dayTasks.length - MAX_VISIBLE;

              return (
                <div
                  key={di}
                  className={cn(
                    'min-h-[80px] sm:min-h-[96px] p-2 transition-colors',
                    di < 6 && 'border-r border-zinc-100 dark:border-zinc-800/60',
                    isWeekend
                      ? 'bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/70'
                      : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30',
                  )}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1.5">
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold',
                        todayFlag
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : isWeekend
                          ? 'text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-500 dark:text-zinc-400'
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Task pills */}
                  <div className="space-y-1">
                    {visible.map((task) => (
                      <MonthTaskPill
                        key={task.id}
                        task={task}
                        onClick={() => onEditTask(task)}
                      />
                    ))}
                    {overflow > 0 && (
                      <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 pl-1">
                        +{overflow} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const WORKSTREAM_ACCENT: Record<string, string> = {
  personal: '#FF9900',
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#a1a1aa',
};

function needsDarkText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function MonthTaskPill({ task, onClick }: { task: Task; onClick: () => void }) {
  const isDone     = task.status === 'done';
  const accent     = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
  const darkText   = needsDarkText(accent);
  const textColor  = isDone ? undefined : darkText ? '#1a1a1a' : '#ffffff';
  const subOpacity = darkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md px-2 py-0.5 text-[10px] font-semibold truncate',
        'transition-all hover:brightness-105',
        isDone ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 line-through' : '',
      )}
      style={isDone ? undefined : {
        backgroundColor: accent,
        color: textColor,
        boxShadow: `0 1px 2px ${accent}44`,
      }}
    >
      {task.title}
    </button>
  );
}
