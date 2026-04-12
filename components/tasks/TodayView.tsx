'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Task, Project } from '@/types';
import { cn, isOverdue } from '@/lib/utils';
import { LayoutList, ChevronDown, Circle, PlayCircle, Bell, Mail, CheckCircle2 } from 'lucide-react';

// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'done')        return <CheckCircle2 size={11} style={{ color: '#4ade80' }} />;
  if (status === 'in_progress') return <PlayCircle   size={11} style={{ color: '#00C1FF' }} />;
  if (status === 'follow_up')   return <Bell         size={11} style={{ color: '#FF9900' }} />;
  if (status === 'send_mail')   return <Mail         size={11} style={{ color: '#a78bfa' }} />;
  return <Circle size={11} style={{ color: '#a1a1aa' }} />;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SNAP_MIN    = 15;
const START_HOUR  = 6;
const END_HOUR    = 24;
const HOUR_HEIGHT = 64;
const MIN_DRAG_PX = 6; // pixels of movement before drag starts (vs click)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const WORKSTREAM_ACCENT: Record<string, string> = {
  personal: '#FF9900',
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#a1a1aa',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function fmtMins(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

function clampSnap(rawMin: number): number {
  const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN;
  return Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snapped));
}

// ── Overlap column layout ─────────────────────────────────────────────────────
function computeColumns(tasks: Task[]): Map<string, { col: number; total: number }> {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const result = new Map<string, { col: number; total: number }>();
  const groups: Task[][] = [];

  for (const task of sorted) {
    const top    = taskTopPx(task.dueDate);
    const bottom = top + (task.durationMinutes ?? 60) / 60 * HOUR_HEIGHT;
    let placed = false;
    for (const group of groups) {
      if (group.some(g => {
        const gt = taskTopPx(g.dueDate);
        const gb = gt + (g.durationMinutes ?? 60) / 60 * HOUR_HEIGHT;
        return top < gb && bottom > gt;
      })) { group.push(task); placed = true; break; }
    }
    if (!placed) groups.push([task]);
  }
  for (const group of groups) {
    group.forEach((task, i) => result.set(task.id, { col: i, total: group.length }));
  }
  return result;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface TodayViewProps {
  tasks: Task[];
  projects: Project[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TodayView({ tasks, projects, onEditTask, onUpdateTask }: TodayViewProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const poolRef    = useRef<HTMLDivElement>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);

  // Stable callback refs — avoids stale closures in the global pointer effect
  const onUpdateTaskRef = useRef(onUpdateTask);
  const onEditTaskRef   = useRef(onEditTask);
  useEffect(() => { onUpdateTaskRef.current = onUpdateTask; }, [onUpdateTask]);
  useEffect(() => { onEditTaskRef.current   = onEditTask;   }, [onEditTask]);

  // ── Drag (all mutable data in refs; only visual state in useState) ────────────
  type DragData = {
    taskId: string;
    task: Task;
    source: 'pool' | 'timeline';
    startX: number;
    startY: number;
    /** Pixels from task card top to where user grabbed (timeline drag only) */
    pointerOffsetY: number;
    hasMoved: boolean;
  };
  const dragRef   = useRef<DragData | null>(null);
  const dropPxRef = useRef<number | null>(null); // raw px value for drop, used in onUp

  const [dragTask,  setDragTask]  = useState<Task | null>(null);
  const [ghostPos,  setGhostPos]  = useState<{ x: number; y: number } | null>(null);
  const [dropPx,    setDropPx]    = useState<number | null>(null);
  const [dropLabel, setDropLabel] = useState('');
  const [overPool,  setOverPool]  = useState(false);

  // ── Resize ────────────────────────────────────────────────────────────────────
  type ResizeData = { taskId: string; startY: number; startDuration: number };
  const resizeRef    = useRef<ResizeData | null>(null);
  const resizeDurRef = useRef(60);

  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeDur,  setResizeDur]  = useState(60);

  // ── Now indicator ─────────────────────────────────────────────────────────────
  const [nowPx, setNowPx] = useState(getNowPx);

  // ── Other UI ──────────────────────────────────────────────────────────────────
  const [poolProjectIds, setPoolProjectIds] = useState<string[]>([]);
  const [overdueOpen,   setOverdueOpen]   = useState(false);

  // Scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, getNowPx() - el.clientHeight * 0.3);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowPx(getNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Global pointer handlers ───────────────────────────────────────────────────
  // Uses only refs (never closure-captured state) so the effect runs once and
  // always sees the latest values without re-attaching listeners on every render.
  useEffect(() => {
    const getSnappedMins = (clientY: number, offsetY: number): number | null => {
      const el = scrollRef.current;
      if (!el) return null;
      const r    = el.getBoundingClientRect();
      const relY = clientY - r.top + el.scrollTop - offsetY;
      return clampSnap((relY / HOUR_HEIGHT) * 60 + START_HOUR * 60);
    };

    const cleanDrag = () => {
      dragRef.current = null;
      dropPxRef.current = null;
      setDragTask(null);
      setGhostPos(null);
      setDropPx(null);
      setDropLabel('');
      setOverPool(false);
    };

    const onMove = (e: PointerEvent) => {
      // ── Resize ──────────────────────────────────────────────────────────────
      if (resizeRef.current) {
        const dy     = e.clientY - resizeRef.current.startY;
        const newDur = Math.max(
          SNAP_MIN,
          resizeRef.current.startDuration +
            Math.round((dy / HOUR_HEIGHT) * 60 / SNAP_MIN) * SNAP_MIN,
        );
        resizeDurRef.current = newDur;
        setResizeDur(newDur);
        return;
      }

      // ── Drag ────────────────────────────────────────────────────────────────
      if (!dragRef.current) return;
      const d = dragRef.current;

      // Threshold check — treat tiny movements as click, not drag
      if (!d.hasMoved) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < MIN_DRAG_PX) return;
        d.hasMoved = true;
      }

      setGhostPos({ x: e.clientX, y: e.clientY });

      // Pool drop zone (only relevant when dragging a timeline task)
      if (d.source === 'timeline') {
        const pool = poolRef.current;
        if (pool) {
          const r = pool.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right &&
              e.clientY >= r.top  && e.clientY <= r.bottom) {
            setOverPool(true);
            setDropPx(null);
            dropPxRef.current = null;
            return;
          }
        }
        setOverPool(false);
      }

      // Timeline drop zone
      const container = scrollRef.current;
      if (container) {
        const r = container.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          const snapped = getSnappedMins(e.clientY, d.pointerOffsetY);
          if (snapped !== null) {
            const px = (snapped / 60 - START_HOUR) * HOUR_HEIGHT;
            if (dropPxRef.current !== px) {
              dropPxRef.current = px;
              setDropPx(px);
              setDropLabel(fmtMins(snapped));
            }
          }
        } else {
          dropPxRef.current = null;
          setDropPx(null);
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      // ── Commit resize ────────────────────────────────────────────────────────
      if (resizeRef.current) {
        onUpdateTaskRef.current(resizeRef.current.taskId, { durationMinutes: resizeDurRef.current });
        resizeRef.current = null;
        setResizingId(null);
        return;
      }

      // ── Commit drag ──────────────────────────────────────────────────────────
      if (!dragRef.current) return;
      const d = dragRef.current;

      if (!d.hasMoved) {
        // No movement → it was a click; open the edit drawer
        onEditTaskRef.current(d.task);
        cleanDrag();
        return;
      }

      const { taskId } = d;

      // Drop on pool → unschedule the task
      const pool = poolRef.current;
      if (pool) {
        const r = pool.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          onUpdateTaskRef.current(taskId, { isUnscheduled: true });
          cleanDrag();
          return;
        }
      }

      // Drop on timeline → schedule / reschedule
      const container = scrollRef.current;
      if (container) {
        const r = container.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {
          const snapped = getSnappedMins(e.clientY, d.pointerOffsetY);
          if (snapped !== null) {
            const newDate = new Date();
            newDate.setHours(Math.floor(snapped / 60), snapped % 60, 0, 0);
            onUpdateTaskRef.current(taskId, { dueDate: newDate.toISOString(), isUnscheduled: false });
          }
        }
      }

      cleanDrag();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, []); // empty deps — reads all live values through refs

  // ── Derived data ──────────────────────────────────────────────────────────────
  const today      = new Date();
  const dayName    = today.toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr    = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const overdueTasks     = useMemo(() => tasks.filter(t => isOverdue(t.dueDate, t.status, t.isUnscheduled)), [tasks]);
  const todayOpen        = useMemo(() => tasks.filter(t => isTodayDate(t.dueDate) || (t.status === 'done' && isTodayDate(t.updatedAt))), [tasks]);
  const scheduledTasks   = useMemo(() => todayOpen.filter(t => !t.isUnscheduled && hasTime(t.dueDate)), [todayOpen]);
  const unscheduledTasks = useMemo(() => todayOpen.filter(t => t.isUnscheduled || !hasTime(t.dueDate)), [todayOpen]);
  const layout           = useMemo(() => computeColumns(scheduledTasks), [scheduledTasks]);

  const poolProjects = useMemo(() => {
    const ids = new Set(unscheduledTasks.map(t => t.projectId).filter(Boolean) as string[]);
    return projects.filter(p => ids.has(p.id));
  }, [unscheduledTasks, projects]);

  const filteredPool = useMemo(() =>
    poolProjectIds.length > 0
      ? unscheduledTasks.filter(t => t.projectId != null && poolProjectIds.includes(t.projectId))
      : unscheduledTasks,
    [unscheduledTasks, poolProjectIds],
  );

  const totalOpen  = scheduledTasks.length + unscheduledTasks.length;
  const isDragging = !!dragTask;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0" style={{ userSelect: 'none' }}>

      {/* ── Floating drag ghost ────────────────────────────────────────────── */}
      {ghostPos && dragTask && (
        <div
          className="fixed z-[999] pointer-events-none"
          style={{ left: ghostPos.x + 14, top: ghostPos.y - 14 }}
        >
          <div
            className="px-2.5 py-1.5 rounded-lg shadow-2xl text-[11px] font-semibold max-w-[200px] truncate ring-1 ring-black/10"
            style={{
              backgroundColor: WORKSTREAM_ACCENT[dragTask.workstream] ?? '#a1a1aa',
              color: needsDarkText(WORKSTREAM_ACCENT[dragTask.workstream] ?? '#a1a1aa') ? '#18181b' : '#ffffff',
            }}
          >
            {dragTask.title}
          </div>
        </div>
      )}

      {/* ── Date header ──────────────────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{dayName}</h2>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">{dateStr}</span>
        </div>
        {totalOpen > 0 && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{totalOpen} today</span>
        )}
      </div>

      {/* ── Overdue bar ──────────────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden border border-accent-orange/20 bg-accent-orange/5 dark:bg-accent-orange/[0.06]">
          <button
            onClick={() => setOverdueOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent-orange/5 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-orange shrink-0" />
            <span className="text-[11px] font-semibold text-accent-orange">
              {overdueTasks.length} overdue
            </span>
            {!overdueOpen && (
              <span className="text-[10px] text-accent-orange/60 truncate flex-1 text-left">
                — {overdueTasks.slice(0, 2).map(t => t.title).join(', ')}{overdueTasks.length > 2 ? ` +${overdueTasks.length - 2}` : ''}
              </span>
            )}
            <ChevronDown size={12} className={cn('ml-auto shrink-0 text-accent-orange/60 transition-transform duration-200', overdueOpen && 'rotate-180')} />
          </button>
          {overdueOpen && (
            <div className="border-t border-accent-orange/10 divide-y divide-accent-orange/10">
              {overdueTasks.map(task => (
                <OverdueRow key={task.id} task={task} projectMap={projectMap} onEdit={onEditTask} onDone={id => onUpdateTask(id, { status: 'done' })} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-start">

        {/* ── Timeline ───────────────────────────────────────────────────────── */}
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
                <span className="w-12 shrink-0 text-[10px] text-zinc-400 dark:text-zinc-600 text-right pr-3 pt-1 tabular-nums">
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
              <div ref={nowLineRef} className="absolute left-0 right-0 flex items-center z-20 pointer-events-none" style={{ top: nowPx }}>
                <div className="w-12 shrink-0 flex justify-end pr-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Drop snap indicator — shows target time while dragging */}
            {isDragging && dropPx !== null && (
              <div className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" style={{ top: dropPx }}>
                <div className="w-12 shrink-0 flex justify-end pr-1.5">
                  <span className="text-[9px] font-bold text-accent-cyan tabular-nums">{dropLabel}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-accent-cyan shrink-0 -ml-1" />
                <div className="flex-1 h-0.5 bg-accent-cyan rounded-full opacity-80" />
              </div>
            )}

            {/* Task blocks */}
            {scheduledTasks.map(task => {
              const top     = taskTopPx(task.dueDate);
              const rawDur  = resizingId === task.id ? resizeDur : (task.durationMinutes ?? 60);
              const height  = Math.max((rawDur / 60) * HOUR_HEIGHT - 3, 24);
              const info    = layout.get(task.id) ?? { col: 0, total: 1 };
              const gutter  = 3;
              const colW    = `calc((100% - 3rem - ${gutter * (info.total + 1)}px) / ${info.total})`;
              const left    = `calc(3rem + ${gutter}px + ((100% - 3rem - ${gutter * (info.total + 1)}px) / ${info.total} + ${gutter}px) * ${info.col})`;
              const accent  = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
              const dark    = needsDarkText(accent);
              const project = task.projectId ? projectMap.get(task.projectId) : undefined;
              const isActiveDrag = isDragging && dragTask?.id === task.id && !resizingId;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'absolute rounded-xl overflow-hidden z-10 group transition-opacity',
                    isActiveDrag    ? 'opacity-25 cursor-grabbing' : 'cursor-grab',
                    resizingId === task.id ? 'cursor-ns-resize' : '',
                  )}
                  style={{
                    top: top + 1,
                    left,
                    width: colW,
                    height,
                    backgroundColor: accent,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || resizeRef.current) return;
                    const r       = scrollRef.current!.getBoundingClientRect();
                    const relY    = e.clientY - r.top + scrollRef.current!.scrollTop;
                    const offsetY = Math.max(0, Math.min(relY - top, height));
                    dragRef.current = {
                      taskId: task.id,
                      task,
                      source: 'timeline',
                      startX: e.clientX,
                      startY: e.clientY,
                      pointerOffsetY: offsetY,
                      hasMoved: false,
                    };
                    setDragTask(task);
                  }}
                >
                  {/* Content */}
                  <div className="px-2.5 py-1.5 h-full flex flex-col pointer-events-none">
                    <p className={cn(
                      'text-[12px] font-semibold leading-tight truncate',
                      dark ? 'text-zinc-900' : 'text-white',
                      task.status === 'done' && 'line-through opacity-50',
                    )}>
                      {task.title}
                    </p>
                    {height >= 40 && (
                      <p className={cn('text-[10px] leading-tight mt-0.5 shrink-0', dark ? 'text-zinc-700' : 'text-white/70')}>
                        {fmtTime(task.dueDate)}{rawDur !== 60 ? ` · ${rawDur}m` : ''}
                        {project ? ` · ${project.name}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Resize handle — bottom grip bar, visible on hover */}
                  {height >= 28 && (
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-4 flex items-end justify-center pb-1',
                        'cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity',
                        resizingId === task.id && 'opacity-100',
                      )}
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Cancel any in-progress drag
                        dragRef.current = null;
                        setDragTask(null);
                        setGhostPos(null);
                        // Start resize
                        const startDur = task.durationMinutes ?? 60;
                        resizeRef.current  = { taskId: task.id, startY: e.clientY, startDuration: startDur };
                        resizeDurRef.current = startDur;
                        setResizingId(task.id);
                        setResizeDur(startDur);
                      }}
                    >
                      <div className={cn('w-8 h-[3px] rounded-full', dark ? 'bg-zinc-900/25' : 'bg-white/35')} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {scheduledTasks.length === 0 && (
              <div
                className="absolute left-12 right-0 flex items-center justify-center pointer-events-none"
                style={{ top: getNowPx() - 20, height: 40 }}
              >
                <p className="text-xs text-zinc-400 dark:text-zinc-600">No events scheduled · drag a task here</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Task Pool ──────────────────────────────────────────────────────── */}
        <div
          ref={poolRef}
          className={cn(
            'hidden sm:flex shrink-0 flex-col rounded-2xl border bg-white dark:bg-zinc-950 overflow-hidden relative transition-all duration-150',
            overPool
              ? 'border-accent-cyan/60 ring-2 ring-accent-cyan/20 shadow-lg shadow-accent-cyan/10'
              : isDragging
              ? 'border-zinc-300 dark:border-zinc-700'
              : 'border-zinc-100 dark:border-zinc-800/80',
          )}
          style={{ width: 280, maxHeight: 'calc(100vh - 260px)', minHeight: 320 }}
        >
          {/* Drop-here overlay when a timeline task is dragged over the pool */}
          {overPool && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none rounded-2xl bg-accent-cyan/5">
              <div className="bg-accent-cyan/20 text-accent-cyan text-[11px] font-bold px-3 py-1.5 rounded-lg">
                Drop to unschedule
              </div>
            </div>
          )}

          {/* Pool header */}
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
              {isDragging ? 'Drop here to unschedule · drag to timeline to schedule' : 'Drag to timeline · drag back to unschedule'}
            </p>
          </div>

          {/* Project filter chips — multi-select */}
          {poolProjects.length > 0 && (
            <div className="px-3 py-2.5 shrink-0 border-b border-zinc-50 dark:border-zinc-800/40">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setPoolProjectIds([])}
                  className={cn(
                    'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                    poolProjectIds.length === 0
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                  )}
                >
                  All
                </button>
                {poolProjects.map(p => {
                  const active = poolProjectIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPoolProjectIds(prev =>
                        active ? prev.filter(id => id !== p.id) : [...prev, p.id]
                      )}
                      className={cn(
                        'text-[9px] font-semibold px-2 py-1 rounded-full transition-all',
                        active
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                      )}
                    >
                      {p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2.5 px-2.5 space-y-1.5">
            {filteredPool.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-600">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">All scheduled</p>
                  <p className="text-[10px] text-zinc-300 dark:text-zinc-600 leading-relaxed">No unscheduled<br />tasks for today</p>
                </div>
              </div>
            ) : (
              filteredPool.map(task => {
                const proj   = projectMap.get(task.projectId ?? '');
                const accent = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
                return (
                  <div
                    key={task.id}
                    className="w-full group relative flex items-stretch gap-0 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 text-left transition-all duration-150 hover:shadow-sm overflow-hidden cursor-grab active:cursor-grabbing select-none"
                    style={{ touchAction: 'none' }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      dragRef.current = {
                        taskId: task.id,
                        task,
                        source: 'pool',
                        startX: e.clientX,
                        startY: e.clientY,
                        pointerOffsetY: 0,
                        hasMoved: false,
                      };
                      setDragTask(task);
                    }}
                  >
                    <div className="w-[3px] shrink-0" style={{ backgroundColor: accent }} />
                    <div className="flex-1 min-w-0 px-2.5 py-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn('text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2', task.status === 'done' && 'line-through opacity-50')}>
                          {task.title}
                        </p>
                        <StatusIcon status={task.status} />
                      </div>
                      {proj ? (
                        <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 mt-1 truncate">{proj.name}</p>
                      ) : (
                        <p className="text-[9px] font-medium text-zinc-300 dark:text-zinc-600 mt-1 capitalize">{task.workstream}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredPool.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-50 dark:border-zinc-800/40 shrink-0">
              <p className="text-[9px] text-zinc-300 dark:text-zinc-600 text-center">
                {filteredPool.length} task{filteredPool.length !== 1 ? 's' : ''} · drag to timeline to schedule
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Overdue row ───────────────────────────────────────────────────────────────
function OverdueRow({ task, projectMap, onEdit, onDone }: {
  task: Task;
  projectMap: Map<string, Project>;
  onEdit: (t: Task) => void;
  onDone: (id: string) => void;
}) {
  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
  const dueDate = new Date(task.dueDate);
  const daysAgo = Math.floor((Date.now() - dueDate.getTime()) / 86_400_000);
  const accent  = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
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
