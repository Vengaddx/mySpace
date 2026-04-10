'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import { cn, isOverdue } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const START_HOUR  = 6;
const END_HOUR    = 24;
const HOUR_HEIGHT = 72;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

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

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function taskTopPx(iso: string): number {
  const d = new Date(iso);
  return ((d.getHours() - START_HOUR) + d.getMinutes() / 60) * HOUR_HEIGHT;
}

function getNowPx(): number {
  const n = new Date();
  return ((n.getHours() - START_HOUR) + n.getMinutes() / 60) * HOUR_HEIGHT;
}

function isTodayDate(iso: string): boolean {
  const t = new Date(iso);
  const n = new Date();
  return t.getFullYear() === n.getFullYear() && t.getMonth() === n.getMonth() && t.getDate() === n.getDate();
}

function hasTime(iso: string): boolean {
  const d = new Date(iso);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

// ── Overlap layout ─────────────────────────────────────────────────────────────
function computeColumns(tasks: Task[]): Map<string, { col: number; total: number }> {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const result = new Map<string, { col: number; total: number }>();
  const groups: Task[][] = [];

  for (const task of sorted) {
    const top = taskTopPx(task.dueDate);
    const dur = (task.durationMinutes ?? 60) / 60 * HOUR_HEIGHT;
    const bottom = top + dur;
    let placed = false;
    for (const group of groups) {
      const overlap = group.some(g => {
        const gt = taskTopPx(g.dueDate);
        const gd = (g.durationMinutes ?? 60) / 60 * HOUR_HEIGHT;
        return top < gt + gd && bottom > gt;
      });
      if (overlap) { group.push(task); placed = true; break; }
    }
    if (!placed) groups.push([task]);
  }

  for (const group of groups) {
    group.forEach((task, i) => result.set(task.id, { col: i, total: group.length }));
  }
  return result;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface TodayViewProps {
  tasks: Task[];
  projects: Project[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export function TodayView({ tasks, projects, onEditTask, onUpdateTask }: TodayViewProps) {
  const nowRef = useRef<HTMLDivElement>(null);
  const [nowPx, setNowPx] = useState(getNowPx);

  // Scroll to current time on mount
  useEffect(() => {
    nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => setNowPx(getNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const projectMap = useMemo(() =>
    new Map(projects.map(p => [p.id, p])), [projects]);

  // Partition tasks
  const overdueTasks = useMemo(() =>
    tasks.filter(t => isOverdue(t.dueDate, t.status)), [tasks]);

  const todayTasks = useMemo(() =>
    tasks.filter(t => !isOverdue(t.dueDate, t.status) && isTodayDate(t.dueDate) && t.status !== 'done'),
    [tasks]);

  const scheduledTasks = useMemo(() =>
    todayTasks.filter(t => !t.isUnscheduled && hasTime(t.dueDate)),
    [todayTasks]);

  const unscheduledTasks = useMemo(() =>
    todayTasks.filter(t => t.isUnscheduled || !hasTime(t.dueDate)),
    [todayTasks]);

  const doneTodayCount = useMemo(() =>
    tasks.filter(t => t.status === 'done' && isTodayDate(t.updatedAt)).length,
    [tasks]);

  const layout = useMemo(() => computeColumns(scheduledTasks), [scheduledTasks]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Clock size={13} className="text-accent-cyan" />}
          label="Scheduled"
          value={scheduledTasks.length}
          accent="cyan"
        />
        <StatCard
          icon={<AlertCircle size={13} className="text-accent-orange" />}
          label="Overdue"
          value={overdueTasks.length}
          accent="orange"
        />
        <StatCard
          icon={<CheckCircle2 size={13} className="text-accent-lime" />}
          label="Done today"
          value={doneTodayCount}
          accent="lime"
        />
      </div>

      {/* ── Overdue section ──────────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-orange mb-2">
            Overdue
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {overdueTasks.map(task => (
              <TaskRow key={task.id} task={task} projectMap={projectMap} onEdit={onEditTask} onStatusChange={(id, status) => onUpdateTask(id, { status })} />
            ))}
          </div>
        </section>
      )}

      {/* ── Time grid ───────────────────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-2">
          Schedule · {todayLabel}
        </p>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>

            {/* Hour lines */}
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
                <span className="w-14 shrink-0 text-[10px] text-zinc-400 dark:text-zinc-600 text-right pr-3 pt-1 select-none">
                  {String(h).padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t border-zinc-100 dark:border-zinc-800/60 mt-[1px]" />
              </div>
            ))}

            {/* Now indicator */}
            {nowPx >= 0 && nowPx <= (END_HOUR - START_HOUR) * HOUR_HEIGHT && (
              <div
                ref={nowRef}
                className="absolute left-14 right-0 flex items-center gap-1 z-20 pointer-events-none"
                style={{ top: nowPx }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Task blocks */}
            {scheduledTasks.map(task => {
              const top  = taskTopPx(task.dueDate);
              const dur  = task.durationMinutes ?? 60;
              const height = Math.max(dur / 60 * HOUR_HEIGHT, 28);
              const info = layout.get(task.id) ?? { col: 0, total: 1 };
              const colW = `calc((100% - 3.5rem) / ${info.total})`;
              const left = `calc(3.5rem + (100% - 3.5rem) / ${info.total} * ${info.col})`;
              const accent = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
              const darkText = needsDarkText(accent);

              return (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="absolute rounded-xl px-2.5 py-1.5 text-left overflow-hidden transition-opacity hover:opacity-90 z-10"
                  style={{ top, left, width: colW, height, backgroundColor: accent }}
                >
                  <p className={cn('text-[11px] font-semibold truncate leading-tight', darkText ? 'text-zinc-900' : 'text-white')}>
                    {task.title}
                  </p>
                  <p className={cn('text-[10px] leading-tight mt-0.5', darkText ? 'text-zinc-700' : 'text-white/70')}>
                    {fmtTime(task.dueDate)}{dur !== 60 ? ` · ${dur}m` : ''}
                  </p>
                </button>
              );
            })}

            {/* Empty state for no scheduled tasks */}
            {scheduledTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-zinc-400 dark:text-zinc-600">No scheduled tasks today</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Unscheduled section ──────────────────────────────────────────────── */}
      {unscheduledTasks.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-2">
            Unscheduled · due today
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {unscheduledTasks.map(task => (
              <TaskRow key={task.id} task={task} projectMap={projectMap} onEdit={onEditTask} onStatusChange={(id, status) => onUpdateTask(id, { status })} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'cyan' | 'orange' | 'lime';
}) {
  const ring = { cyan: 'border-accent-cyan/20', orange: 'border-accent-orange/20', lime: 'border-accent-lime/20' }[accent];
  return (
    <div className={cn('rounded-2xl border bg-white dark:bg-zinc-950 px-4 py-3 flex flex-col gap-1', ring)}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 leading-none">{value}</p>
    </div>
  );
}

// ── Task row (for overdue / unscheduled lists) ─────────────────────────────────
const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-accent-orange',
  high:     'bg-accent-lime',
  medium:   'bg-accent-cyan',
  low:      'bg-zinc-300 dark:bg-zinc-600',
};

function TaskRow({ task, projectMap, onEdit, onStatusChange }: {
  task: Task;
  projectMap: Map<string, Project>;
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}) {
  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
  const accent = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';

  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      {/* Status toggle */}
      <button
        onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
        className="shrink-0 w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors flex items-center justify-center"
      >
        {task.status === 'done' && <div className="w-2 h-2 rounded-full bg-accent-lime" />}
      </button>

      {/* Priority dot */}
      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_DOT[task.priority])} />

      {/* Title + meta */}
      <button onClick={() => onEdit(task)} className="flex-1 min-w-0 text-left">
        <p className={cn('text-[13px] font-medium truncate', task.status === 'done' ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-50')}>
          {task.title}
        </p>
        {project && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{project.name}</p>
        )}
      </button>

      {/* Workstream accent */}
      <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: accent }} />
    </div>
  );
}
