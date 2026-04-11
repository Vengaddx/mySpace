'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import { cn, isOverdue } from '@/lib/utils';
import { LayoutList } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────
const START_HOUR  = 6;
const END_HOUR    = 24;
const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const WORKSTREAM_ACCENT: Record<string, string> = {
  personal: '#FF9900',
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#a1a1aa',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#FF9900',
  high:     '#AEDD00',
  medium:   '#00C1FF',
  low:      '#71717a',
};

const PRIORITY_BAR: Record<string, string> = {
  critical: 'bg-accent-orange',
  high:     'bg-accent-green',
  medium:   'bg-accent-blue',
  low:      'bg-zinc-300 dark:bg-zinc-600',
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
  const t = new Date(iso), n = new Date();
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
    const top    = taskTopPx(task.dueDate);
    const bottom = top + (task.durationMinutes ?? 60) / 60 * HOUR_HEIGHT;
    let placed = false;
    for (const group of groups) {
      if (group.some(g => { const gt = taskTopPx(g.dueDate), gb = gt + (g.durationMinutes ?? 60) / 60 * HOUR_HEIGHT; return top < gb && bottom > gt; })) {
        group.push(task); placed = true; break;
      }
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
  const scrollRef  = useRef<HTMLDivElement>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);
  const [nowPx, setNowPx] = useState(getNowPx);
  const [poolProjectId, setPoolProjectId] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = Math.max(0, getNowPx() - el.clientHeight * 0.3);
    el.scrollTop = offset;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowPx(getNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today   = new Date();
  const dayName = today.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const overdueTasks = useMemo(() => tasks.filter(t => isOverdue(t.dueDate, t.status)), [tasks]);

  const todayOpen = useMemo(() =>
    tasks.filter(t =>
      isTodayDate(t.dueDate) ||
      (t.status === 'done' && isTodayDate(t.updatedAt))
    ),
    [tasks]);

  const scheduledTasks   = useMemo(() => todayOpen.filter(t => !t.isUnscheduled && hasTime(t.dueDate)), [todayOpen]);
  const unscheduledTasks = useMemo(() => todayOpen.filter(t => t.isUnscheduled || !hasTime(t.dueDate)), [todayOpen]);
  const layout           = useMemo(() => computeColumns(scheduledTasks), [scheduledTasks]);

  const poolProjects = useMemo(() => {
    const ids = new Set(unscheduledTasks.map(t => t.projectId).filter(Boolean) as string[]);
    return projects.filter(p => ids.has(p.id));
  }, [unscheduledTasks, projects]);

  const filteredPool = useMemo(() => {
    if (!poolProjectId) return unscheduledTasks;
    return unscheduledTasks.filter(t => t.projectId === poolProjectId);
  }, [unscheduledTasks, poolProjectId]);

  const totalOpen = scheduledTasks.length + unscheduledTasks.length;

  return (
    <div className="flex flex-col gap-0 -mx-0">

      {/* ── Date header ─────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{dayName}</h2>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">{dateStr}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          {overdueTasks.length > 0 && (
            <span className="text-accent-orange font-semibold">{overdueTasks.length} overdue</span>
          )}
          {totalOpen > 0 && <span>{totalOpen} today</span>}
        </div>
      </div>

      {/* ── Overdue strip ───────────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <div className="mb-4 rounded-2xl overflow-hidden border border-accent-orange/20 bg-accent-orange/5 dark:bg-accent-orange/[0.06]">
          <div className="px-4 py-2 border-b border-accent-orange/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-orange">Overdue</p>
          </div>
          <div className="divide-y divide-accent-orange/10">
            {overdueTasks.map(task => (
              <OverdueRow
                key={task.id}
                task={task}
                projectMap={projectMap}
                onEdit={onEditTask}
                onDone={id => onUpdateTask(id, { status: 'done' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main area: time grid + task pool ────────────────────────────────── */}
      <div className="flex gap-3 items-start">

        {/* ── Time grid ─────────────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 260px)', minHeight: 320 }}
        >
          <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>

            {/* Hour rows */}
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start pointer-events-none"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              >
                <span className="w-12 shrink-0 text-[10px] text-zinc-400 dark:text-zinc-600 text-right pr-3 pt-1 select-none tabular-nums">
                  {String(h).padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t border-zinc-100 dark:border-zinc-800/50" />
              </div>
            ))}

            {/* Half-hour dashes */}
            {HOURS.map(h => (
              <div
                key={`${h}-half`}
                className="absolute left-12 right-0 pointer-events-none"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              >
                <div className="border-t border-dashed border-zinc-100/60 dark:border-zinc-800/30" />
              </div>
            ))}

            {/* Now indicator */}
            {nowPx >= 0 && nowPx <= (END_HOUR - START_HOUR) * HOUR_HEIGHT && (
              <div
                ref={nowLineRef}
                className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: nowPx }}
              >
                <div className="w-12 shrink-0 flex justify-end pr-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Task blocks */}
            {scheduledTasks.map(task => {
              const top    = taskTopPx(task.dueDate);
              const dur    = task.durationMinutes ?? 60;
              const height = Math.max((dur / 60) * HOUR_HEIGHT - 3, 24);
              const info   = layout.get(task.id) ?? { col: 0, total: 1 };
              const gutter = 3;
              const colW   = `calc((100% - 3rem - ${gutter * (info.total + 1)}px) / ${info.total})`;
              const left   = `calc(3rem + ${gutter + (info.col) * (gutter + 1) * 0}px + (100% - 3rem - ${gutter * (info.total + 1)}px) / ${info.total} * ${info.col} + ${gutter * (info.col + 1)}px)`;
              const accent = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
              const dark   = needsDarkText(accent);
              const project = task.projectId ? projectMap.get(task.projectId) : undefined;

              return (
                <button
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="absolute rounded-xl px-2.5 py-1.5 text-left overflow-hidden hover:brightness-95 transition-all z-10"
                  style={{ top: top + 1, left, width: colW, height, backgroundColor: accent }}
                >
                  <p className={cn('text-[12px] font-semibold leading-tight truncate', dark ? 'text-zinc-900' : 'text-white', task.status === 'done' && 'line-through opacity-50')}>
                    {task.title}
                  </p>
                  {height >= 40 && (
                    <p className={cn('text-[10px] leading-tight mt-0.5', dark ? 'text-zinc-700' : 'text-white/70')}>
                      {fmtTime(task.dueDate)}{dur !== 60 ? ` · ${dur}m` : ''}
                      {project ? ` · ${project.name}` : ''}
                    </p>
                  )}
                </button>
              );
            })}

            {/* Empty state */}
            {scheduledTasks.length === 0 && (
              <div
                className="absolute left-12 right-0 flex items-center justify-center pointer-events-none"
                style={{ top: getNowPx() - 20, height: 40 }}
              >
                <p className="text-xs text-zinc-400 dark:text-zinc-600">No events scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Task Pool panel ───────────────────────────────────────────────── */}
        <div className="hidden sm:flex w-[188px] shrink-0 flex-col rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 260px)', minHeight: 320 }}
        >
          {/* Panel header */}
          <div className="px-4 pt-4 pb-3 shrink-0 border-b border-zinc-50 dark:border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center">
                  <LayoutList size={12} className="text-zinc-500 dark:text-zinc-400" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                  Task Pool
                </span>
              </div>
              {unscheduledTasks.length > 0 && (
                <span className="text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums">
                  {unscheduledTasks.length}
                </span>
              )}
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-1.5 leading-relaxed">
              Tasks without a scheduled time
            </p>
          </div>

          {/* Project filter chips */}
          {poolProjects.length > 0 && (
            <div className="px-3 py-2.5 shrink-0 border-b border-zinc-50 dark:border-zinc-800/40">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setPoolProjectId(null)}
                  className={cn(
                    'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                    poolProjectId === null
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  )}
                >
                  All
                </button>
                {poolProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPoolProjectId(p.id)}
                    className={cn(
                      'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                      poolProjectId === p.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2.5 px-2.5 space-y-1.5">
            {filteredPool.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-600">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">All scheduled</p>
                  <p className="text-[10px] text-zinc-300 dark:text-zinc-600 leading-relaxed">
                    No unscheduled<br />tasks for today
                  </p>
                </div>
              </div>
            ) : (
              filteredPool.map(task => {
                const proj = projectMap.get(task.projectId ?? '');
                return (
                  <button
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="w-full group relative flex items-stretch gap-0 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 text-left transition-all duration-150 hover:shadow-sm overflow-hidden"
                  >
                    {/* Priority accent bar */}
                    <div className={cn('w-[3px] shrink-0', PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.medium)} />

                    <div className="flex-1 min-w-0 px-2.5 py-2">
                      <p className={cn('text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2', task.status === 'done' && 'line-through opacity-50')}>
                        {task.title}
                      </p>
                      {proj ? (
                        <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                          {proj.name}
                        </p>
                      ) : (
                        <p className="text-[9px] font-medium text-zinc-300 dark:text-zinc-600 mt-1 capitalize">
                          {task.workstream}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          {filteredPool.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-50 dark:border-zinc-800/40 shrink-0">
              <p className="text-[9px] text-zinc-300 dark:text-zinc-600 text-center leading-relaxed">
                {filteredPool.length} task{filteredPool.length !== 1 ? 's' : ''} in pool
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Overdue row ────────────────────────────────────────────────────────────────
function OverdueRow({ task, projectMap, onEdit, onDone }: {
  task: Task;
  projectMap: Map<string, Project>;
  onEdit: (t: Task) => void;
  onDone: (id: string) => void;
}) {
  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
  const dueDate = new Date(task.dueDate);
  const daysAgo = Math.floor((Date.now() - dueDate.getTime()) / 86_400_000);
  const accent  = PRIORITY_COLOR[task.priority] ?? '#71717a';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 group">
      <button
        onClick={() => onDone(task.id)}
        className="shrink-0 w-[18px] h-[18px] rounded-full border-2 border-accent-orange/40 hover:border-accent-orange hover:bg-accent-orange/10 transition-colors flex items-center justify-center"
      />
      <div className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: accent }} />
      <button onClick={() => onEdit(task)} className="flex-1 min-w-0 text-left">
        <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
        {project && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{project.name}</p>}
      </button>
      <span className="text-[11px] text-accent-orange/80 shrink-0">
        {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`}
      </span>
    </div>
  );
}
