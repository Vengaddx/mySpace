'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Project, RecurrenceType } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RefreshCw, LayoutList, GripVertical } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const START_HOUR  = 6;
const END_HOUR    = 24;
const HOUR_HEIGHT = 64;      // px per hour
const HEADER_H    = 56;      // px — sticky day-header row height
const SNAP_MIN    = 15;      // drag snap
const DEFAULT_DUR = 60;      // default block duration (minutes)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const IS_WEEKEND  = [false, false, false, false, false, true, true]; // Fri=5, Sat=6

// ── Helpers ────────────────────────────────────────────────────────────────
function getWeekStart(d: Date): Date {
  // Week starts Sunday (getDay() === 0)
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatRange(a: Date, b: Date): string {
  return `${a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}
function fmtHour(h: number, m = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function getNowPx(): number {
  const n = new Date();
  return ((n.getHours() - START_HOUR) + n.getMinutes() / 60) * HOUR_HEIGHT;
}
function isInRange(iso: string): boolean {
  const h = new Date(iso).getHours(); return h >= START_HOUR && h < END_HOUR;
}
function taskTopPx(iso: string): number {
  const d = new Date(iso);
  return ((d.getHours() - START_HOUR) + d.getMinutes() / 60) * HOUR_HEIGHT;
}

// ── Recurrence matching ────────────────────────────────────────────────────
function matchesRecurrence(task: Task, day: Date): boolean {
  if (!task.recurrence || task.recurrence === 'none') return false;
  const dow = day.getDay();
  switch (task.recurrence) {
    case 'daily':    return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekly':   return new Date(task.dueDate).getDay() === dow;
    default:         return false;
  }
}

function makeInstance(task: Task, day: Date): Task {
  const base = new Date(task.dueDate);
  const inst = new Date(day);
  inst.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return { ...task, dueDate: inst.toISOString() };
}

// ── Workstream accent colors ───────────────────────────────────────────────
const WORKSTREAM_ACCENT: Record<string, string> = {
  personal: '#FF9900',  // accent-orange
  aramco:   '#AEDD00',  // accent-lime
  satorp:   '#00C1FF',  // accent-cyan
  pmo:      '#a1a1aa',  // neutral
};

// Returns true if dark text (#1a1a1a) should be used on this background
function needsDarkText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

// Priority accent bar for the inbox panel
const PRIORITY_BAR: Record<string, string> = {
  critical: 'bg-accent-orange',
  high:     'bg-accent-lime',
  medium:   'bg-accent-cyan',
  low:      'bg-zinc-300 dark:bg-zinc-600',
};

const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  none: '', daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly',
};

// ── Overlap layout ─────────────────────────────────────────────────────────
interface LayoutItem { task: Task; left: number; width: number }

function computeLayout(tasks: Task[]): LayoutItem[] {
  if (!tasks.length) return [];
  const items = tasks
    .map(t => ({
      task: t,
      start: new Date(t.dueDate).getTime(),
      end:   new Date(t.dueDate).getTime() + (t.durationMinutes ?? DEFAULT_DUR) * 60_000,
    }))
    .sort((a, b) => a.start - b.start);

  const lanes: number[] = [];
  const laneOf = new Map<string, number>();
  for (const item of items) {
    let lane = lanes.findIndex(end => end <= item.start);
    if (lane === -1) { lane = lanes.length; lanes.push(item.end); } else lanes[lane] = item.end;
    laneOf.set(item.task.id + item.task.dueDate, lane);
  }

  return items.map(({ task, start, end }) => {
    const overlapping = items.filter(o => o.start < end && o.end > start).length;
    const lane = laneOf.get(task.id + task.dueDate) ?? 0;
    return { task, left: lane / overlapping, width: 1 / overlapping };
  });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface DropTarget { dayIdx: number; hour: number; minute: number }

interface WeekCalendarViewProps {
  tasks: Task[];
  projects?: Project[];
  onEditTask: (task: Task) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  unscheduledTasks?: Task[];
}

// ══════════════════════════════════════════════════════════════════════════
export function WeekCalendarView({ tasks, projects = [], onEditTask, onUpdateTask, unscheduledTasks = [] }: WeekCalendarViewProps) {
  const projectMap  = new Map(projects.map(p => [p.id, p]));
  const todayDate   = useMemo(() => new Date(), []);

  const [weekOffset, setWeekOffset]     = useState(0);
  const [dropTarget, setDropTarget]     = useState<DropTarget | null>(null);
  const [nowPx,      setNowPx]          = useState(getNowPx);
  const [isDragging, setIsDragging]     = useState(false);
  const [prevHov,    setPrevHov]        = useState(false);
  const [nextHov,    setNextHov]        = useState(false);
  const [panelProjectId, setPanelProjectId] = useState<string | null>(null);
  const [inboxHov,       setInboxHov]       = useState(false);

  const draggingId  = useRef<string | null>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (new Date().getHours() - START_HOUR - 1.5) * HOUR_HEIGHT);
    }
  }, [weekOffset]);

  useEffect(() => {
    const id = setInterval(() => setNowPx(getNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekStart = useMemo(() => addDays(getWeekStart(new Date()), weekOffset * 7), [weekOffset]);
  const days      = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const tasksByDay = useMemo(() => days.map(day => {
    const result: Task[] = [];
    for (const t of tasks) {
      const isExact = !t.recurrence || t.recurrence === 'none';
      if (isExact) {
        if (isSameDay(new Date(t.dueDate), day)) result.push(t);
      } else if (matchesRecurrence(t, day)) {
        result.push(makeInstance(t, day));
      }
    }
    return result;
  }), [tasks, days]);

  const layoutsByDay = useMemo(() =>
    tasksByDay.map(dt => computeLayout(dt.filter(t => isInRange(t.dueDate)))),
    [tasksByDay]
  );

  // ── Inbox panel ──────────────────────────────────────────────────────────
  const unscheduledProjects = useMemo(() => {
    const ids = new Set(unscheduledTasks.map(t => t.projectId).filter(Boolean) as string[]);
    return projects.filter(p => ids.has(p.id));
  }, [unscheduledTasks, projects]);

  const filteredUnscheduled = useMemo(() => {
    if (!panelProjectId) return unscheduledTasks;
    return unscheduledTasks.filter(t => t.projectId === panelProjectId);
  }, [unscheduledTasks, panelProjectId]);

  // ── Drop handlers ────────────────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent, dayIdx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const rawMin = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60 + START_HOUR * 60;
    const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN;
    const clamped = Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snapped));
    setDropTarget({ dayIdx, hour: Math.floor(clamped / 60), minute: clamped % 60 });
    setPrevHov(false); setNextHov(false);
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    if (!draggingId.current || !onUpdateTask || !dropTarget) return;
    const allTasksForLookup = [...tasks, ...unscheduledTasks];
    const original = allTasksForLookup.find(t => t.id === draggingId.current);
    if (!original) return;

    const base = (original.recurrence && original.recurrence !== 'none')
      ? new Date(original.dueDate)
      : new Date(day);
    base.setHours(dropTarget.hour, dropTarget.minute, 0, 0);
    onUpdateTask(draggingId.current, { dueDate: base.toISOString(), isUnscheduled: false });
    draggingId.current = null; setDropTarget(null); setIsDragging(false);
  }

  function handleCrossWeekDrop(e: React.DragEvent, direction: 1 | -1) {
    e.preventDefault();
    if (!draggingId.current || !onUpdateTask) return;
    const allTasksForLookup = [...tasks, ...unscheduledTasks];
    const original = allTasksForLookup.find(t => t.id === draggingId.current);
    if (!original) return;
    const d = new Date(original.dueDate);
    d.setDate(d.getDate() + direction * 7);
    onUpdateTask(draggingId.current, { dueDate: d.toISOString(), isUnscheduled: false });
    setWeekOffset(o => o + direction);
    draggingId.current = null; setIsDragging(false); setPrevHov(false); setNextHov(false);
  }

  function startDrag(id: string) {
    draggingId.current = id;
    setIsDragging(true);
  }

  function endDrag() {
    draggingId.current = null;
    setIsDragging(false); setDropTarget(null); setPrevHov(false); setNextHov(false); setInboxHov(false);
  }

  function handleInboxDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingId.current || !onUpdateTask) return;
    onUpdateTask(draggingId.current, { isUnscheduled: true });
    draggingId.current = null; setIsDragging(false); setInboxHov(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3" style={{ height: 'calc(100vh - 180px)', minHeight: 480 }}>

      {/* ── Calendar column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-auto md:overflow-x-visible">

        {/* Navigation */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            onDragOver={isDragging ? e => { e.preventDefault(); setPrevHov(true); setNextHov(false); setDropTarget(null); } : undefined}
            onDragLeave={isDragging ? () => setPrevHov(false) : undefined}
            onDrop={isDragging ? e => handleCrossWeekDrop(e, -1) : undefined}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150',
              prevHov
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 scale-110'
                : isDragging
                ? 'border-dashed border-zinc-400 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400 animate-pulse'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[140px] text-center select-none">
            {formatRange(days[0], days[6])}
          </span>

          <button
            onClick={() => setWeekOffset(o => o + 1)}
            onDragOver={isDragging ? e => { e.preventDefault(); setNextHov(true); setPrevHov(false); setDropTarget(null); } : undefined}
            onDragLeave={isDragging ? () => setNextHov(false) : undefined}
            onDrop={isDragging ? e => handleCrossWeekDrop(e, 1) : undefined}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150',
              nextHov
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 scale-110'
                : isDragging
                ? 'border-dashed border-zinc-400 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400 animate-pulse'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <ChevronRight size={14} />
          </button>

          {weekOffset !== 0 && !isDragging && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              This week
            </button>
          )}

          {isDragging && (
            <span className="ml-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 select-none">
              Drop on ← → to move to prev / next week
            </span>
          )}
        </div>

        {/* ── Single scroll container: sticky header + body share same grid width ── */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex">

            {/* Time gutter column */}
            <div className="w-12 shrink-0 select-none pointer-events-none">
              {/* Sticky spacer matching header height */}
              <div
                className="sticky top-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800"
                style={{ height: HEADER_H }}
              />
              {/* Time labels */}
              <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                {HOURS.map(h => (
                  <div key={h} className="absolute right-0 w-full flex justify-end pr-2" style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}>
                    <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 leading-none tabular-nums">{fmtHour(h)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day columns — header + body share identical flex-1 width */}
            <div className="flex-1 min-w-0">

              {/* Sticky header row — same grid as body below */}
              <div
                className="sticky top-0 z-20 grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                style={{ height: HEADER_H }}
              >
                {days.map((day, i) => {
                  const isToday    = isSameDay(day, todayDate);
                  const isWeekend  = IS_WEEKEND[i];
                  const outOfRange = tasksByDay[i].filter(t => !isInRange(t.dueDate)).length;
                  return (
                    <div key={i} className={cn(
                      'flex flex-col items-center justify-center border-l border-zinc-100 dark:border-zinc-800/60',
                      i === 0 && 'border-l-0',
                      isWeekend && 'bg-zinc-50 dark:bg-zinc-900/50',
                    )}>
                      <p className={cn(
                        'text-[9px] font-semibold uppercase tracking-wider mb-0.5',
                        isWeekend ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500',
                      )}>
                        {DAY_NAMES[i]}
                      </p>
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', isToday && 'bg-zinc-900 dark:bg-white')}>
                        <span className={cn(
                          'text-[12px] font-bold',
                          isToday ? 'text-white dark:text-zinc-900' : isWeekend ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300',
                        )}>
                          {day.getDate()}
                        </span>
                      </div>
                      {outOfRange > 0 && (
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-0.5">+{outOfRange}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Body grid — same grid-cols-7, pixel-perfect alignment with header */}
              <div className="grid grid-cols-7 relative" style={{ height: TOTAL_HEIGHT }}>

                {/* Hour grid lines */}
                {HOURS.map((h, i) => (
                  <React.Fragment key={h}>
                    <div className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800/50 pointer-events-none" style={{ top: i * HOUR_HEIGHT }} />
                    <div className="absolute left-0 right-0 border-t border-dashed border-zinc-50 dark:border-zinc-800/25 pointer-events-none" style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                  </React.Fragment>
                ))}

                {/* Per-day columns */}
                {days.map((day, dayIdx) => {
                  const isToday   = isSameDay(day, todayDate);
                  const isWeekend = IS_WEEKEND[dayIdx];
                  const isDropDay = dropTarget?.dayIdx === dayIdx;
                  const layout    = layoutsByDay[dayIdx];

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        'relative border-l border-zinc-100 dark:border-zinc-800/60',
                        dayIdx === 0 && 'border-l-0',
                        isWeekend && !isToday && 'bg-zinc-50 dark:bg-zinc-900/50',
                        isToday && 'bg-blue-50/40 dark:bg-zinc-900/20',
                        isDropDay && 'bg-accent-cyan/8 dark:bg-accent-cyan/5',
                      )}
                    onDragOver={e => handleDragOver(e, dayIdx)}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
                    onDrop={e => handleDrop(e, day)}
                  >
                    {/* Current time line */}
                    {isToday && nowPx >= 0 && nowPx <= TOTAL_HEIGHT && (
                      <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: nowPx }}>
                        <div className="w-[7px] h-[7px] rounded-full bg-accent-cyan shrink-0 -ml-[3.5px]" />
                        <div className="flex-1 h-[1.5px] bg-accent-cyan" />
                      </div>
                    )}

                    {/* Drop ghost line */}
                    {isDropDay && dropTarget && (
                      <div
                        className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                        style={{ top: ((dropTarget.hour - START_HOUR) + dropTarget.minute / 60) * HOUR_HEIGHT }}
                      >
                        <div className="w-[7px] h-[7px] rounded-full bg-zinc-400 shrink-0 -ml-[3.5px]" />
                        <div className="flex-1 h-[1.5px] bg-zinc-400" />
                        <span className="text-[9px] font-bold bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-1.5 py-0.5 rounded mr-1 shrink-0 leading-none">
                          {fmtHour(dropTarget.hour, dropTarget.minute)}
                        </span>
                      </div>
                    )}

                    {/* Task blocks */}
                    {layout.map(({ task, left, width }) => {
                      const d           = new Date(task.dueDate);
                      const dur         = task.durationMinutes ?? DEFAULT_DUR;
                      const top         = taskTopPx(task.dueDate);
                      const height      = (dur / 60) * HOUR_HEIGHT - 2;
                      const isDone      = task.status === 'done';
                      const isRecurring = !!(task.recurrence && task.recurrence !== 'none');
                      const accent  = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
                      const cardKey = task.id + task.dueDate;
                      const endDate = new Date(d.getTime() + dur * 60_000);

                      const isShort   = height < 28;
                      const isMed     = height >= 28 && height < 52;
                      const darkText  = needsDarkText(accent);
                      const textColor = isDone ? '#71717a' : darkText ? '#1a1a1a' : '#ffffff';
                      const subColor  = isDone ? '#a1a1aa' : darkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';

                      return (
                        <div
                          key={cardKey}
                          draggable
                          onClick={() => {
                            const original = isRecurring ? tasks.find(t => t.id === task.id) ?? task : task;
                            onEditTask(original);
                          }}
                          onDragStart={e => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', task.id);
                            startDrag(task.id);
                          }}
                          onDragEnd={endDrag}
                          style={{
                            top,
                            height,
                            left:  `calc(${left  * 100}% + 2px)`,
                            width: `calc(${width * 100}% - 4px)`,
                            minHeight: 22,
                            backgroundColor: isDone ? '#e4e4e7' : accent,
                            boxShadow: isDone ? 'none' : `0 1px 3px ${accent}55`,
                          }}
                          className={cn(
                            'absolute rounded-lg overflow-hidden select-none',
                            'cursor-grab active:cursor-grabbing',
                            'transition-[opacity,transform] duration-150 z-[5]',
                            'hover:z-10 hover:brightness-105',
                            'active:opacity-70 active:scale-[0.98]',
                            isDone && 'opacity-40',
                          )}
                        >
                          <div className={cn(
                            'flex flex-col min-w-0 px-2.5',
                            isShort ? 'pt-1' : 'pt-1.5',
                          )}>
                            <p
                              className={cn(
                                'font-semibold leading-tight tracking-tight truncate',
                                isShort ? 'text-[10px]' : 'text-[11px]',
                                isDone && 'line-through',
                              )}
                              style={{ color: textColor }}
                            >
                              {isRecurring && <RefreshCw size={7} className="inline mr-[3px] mb-[1px] opacity-70" />}
                              {task.title}
                            </p>
                            {!isShort && !isMed && (
                              <p className="text-[9px] font-medium mt-1 leading-none truncate"
                                style={{ color: subColor }}>
                                {fmtHour(d.getHours(), d.getMinutes())} – {fmtHour(endDate.getHours(), endDate.getMinutes())}
                              </p>
                            )}
                            {isMed && (
                              <p className="text-[9px] font-medium mt-1 leading-none truncate"
                                style={{ color: subColor }}>
                                {fmtHour(d.getHours(), d.getMinutes())}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Inbox / Unscheduled Panel — hidden on mobile, shown on iPad+ ── */}
      <div
        className={cn(
          'hidden md:flex w-[200px] shrink-0 flex-col rounded-2xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-150',
          inboxHov
            ? 'border-zinc-400 dark:border-zinc-500 shadow-lg scale-[1.01]'
            : isDragging
            ? 'border-dashed border-zinc-300 dark:border-zinc-600 animate-pulse'
            : 'border-zinc-100 dark:border-zinc-800/80'
        )}
        onDragOver={isDragging ? e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setInboxHov(true); setDropTarget(null); } : undefined}
        onDragLeave={isDragging ? () => setInboxHov(false) : undefined}
        onDrop={isDragging ? handleInboxDrop : undefined}
      >

        {/* Panel header */}
        <div className={cn('px-4 pt-4 pb-3 shrink-0 border-b transition-colors', inboxHov ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60' : 'border-zinc-50 dark:border-zinc-800/60')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors', inboxHov ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800/80')}>
                <LayoutList size={12} className={cn('transition-colors', inboxHov ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400')} />
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
            {inboxHov ? 'Drop to unschedule' : 'Drag to calendar to schedule · drag back to unschedule'}
          </p>
        </div>

        {/* Project filter chips */}
        {unscheduledProjects.length > 0 && (
          <div className="px-3 py-2.5 shrink-0 border-b border-zinc-50 dark:border-zinc-800/40">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPanelProjectId(null)}
                className={cn(
                  'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                  panelProjectId === null
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
              >
                All
              </button>
              {unscheduledProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPanelProjectId(p.id)}
                  className={cn(
                    'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                    panelProjectId === p.id
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
          {filteredUnscheduled.length === 0 ? (
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
                  Tasks without a date<br />will appear here
                </p>
              </div>
            </div>
          ) : (
            filteredUnscheduled.map(task => {
              const proj = projectMap.get(task.projectId ?? '');
              return (
                <div
                  key={task.id}
                  draggable
                  onClick={() => onEditTask(task)}
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', task.id);
                    startDrag(task.id);
                  }}
                  onDragEnd={endDrag}
                  className="group relative flex items-stretch gap-0 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-sm active:opacity-50 overflow-hidden"
                >
                  {/* Priority accent bar */}
                  <div className={cn('w-[3px] shrink-0', PRIORITY_BAR[task.priority] ?? PRIORITY_BAR.medium)} />

                  <div className="flex-1 min-w-0 px-2.5 py-2">
                    <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">
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

                  {/* Drag handle — shown on hover */}
                  <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                    <GripVertical size={11} className="text-zinc-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Panel footer hint when tasks present */}
        {filteredUnscheduled.length > 0 && (
          <div className="px-3 py-2 border-t border-zinc-50 dark:border-zinc-800/40 shrink-0">
            <p className="text-[9px] text-zinc-300 dark:text-zinc-600 text-center leading-relaxed">
              {filteredUnscheduled.length} task{filteredUnscheduled.length !== 1 ? 's' : ''} in pool
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
