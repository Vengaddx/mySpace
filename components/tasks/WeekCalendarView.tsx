'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Project, RecurrenceType } from '@/types';
import { cn, sortTasksLogically, isOverdue } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RefreshCw, LayoutList, GripVertical, Circle, PlayCircle, Bell, Mail, CheckCircle2 } from 'lucide-react';

function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'done')        return <CheckCircle2 size={11} style={{ color: '#4ade80' }} />;
  if (status === 'in_progress') return <PlayCircle   size={11} style={{ color: '#00C1FF' }} />;
  if (status === 'follow_up')   return <Bell         size={11} style={{ color: '#FF9900' }} />;
  if (status === 'send_mail')   return <Mail         size={11} style={{ color: '#a78bfa' }} />;
  return <Circle size={11} style={{ color: '#a1a1aa' }} />;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const START_HOUR  = 6;
const END_HOUR    = 24;
const HOUR_HEIGHT = 64;
const HEADER_H    = 56;
const SNAP_MIN    = 15;
const DEFAULT_DUR = 60;
const MIN_DRAG_PX = 6;
const HOURS       = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const IS_WEEKEND  = [false, false, false, false, false, true, true];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekStart(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfDay(d: Date): Date { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
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
function clampSnap(rawMin: number): number {
  const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN;
  return Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, snapped));
}

// ── Recurrence ────────────────────────────────────────────────────────────────
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

// ── Colors ────────────────────────────────────────────────────────────────────
const WORKSTREAM_ACCENT: Record<string, string> = {
  personal: '#F2296B',
  aramco:   '#AEDD00',
  satorp:   '#00C1FF',
  pmo:      '#FFB503',
};
function needsDarkText(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  none: '', daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly',
};

// ── Overlap layout ────────────────────────────────────────────────────────────
interface LayoutItem { task: Task; left: number; width: number }
function computeLayout(tasks: Task[]): LayoutItem[] {
  if (!tasks.length) return [];
  const items = tasks
    .map(t => ({ task: t, start: new Date(t.dueDate).getTime(), end: new Date(t.dueDate).getTime() + (t.durationMinutes ?? DEFAULT_DUR) * 60_000 }))
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

// ── Types ─────────────────────────────────────────────────────────────────────
interface DropTarget { dayIdx: number; hour: number; minute: number }
interface WeekCalendarViewProps {
  tasks: Task[];
  projects?: Project[];
  onEditTask: (task: Task) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  unscheduledTasks?: Task[];
}

// ══════════════════════════════════════════════════════════════════════════════
export function WeekCalendarView({ tasks, projects = [], onEditTask, onUpdateTask, unscheduledTasks = [] }: WeekCalendarViewProps) {
  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const todayDate  = useMemo(() => new Date(), []);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [weekOffset,      setWeekOffset]      = useState(0);
  const [mobileDayOffset, setMobileDayOffset] = useState(0);
  const [isMobile,        setIsMobile]        = useState(false);
  const [nowPx,           setNowPx]           = useState(getNowPx);
  const [panelProjectIds, setPanelProjectIds] = useState<string[]>([]);

  // ── Drag visual state ─────────────────────────────────────────────────────
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [ghostPos,       setGhostPos]       = useState<{ x: number; y: number; task: Task } | null>(null);
  const [dropTarget,     setDropTarget]     = useState<DropTarget | null>(null);
  const [prevHov,        setPrevHov]        = useState(false);
  const [nextHov,        setNextHov]        = useState(false);
  const [inboxHov,       setInboxHov]       = useState(false);

  // ── Resize visual state ───────────────────────────────────────────────────
  const [resizingId,  setResizingId]  = useState<string | null>(null);
  const [resizeDur,   setResizeDur]   = useState(DEFAULT_DUR);

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const scrollRef      = useRef<HTMLDivElement>(null);
  const dayColumnRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const prevBtnRef     = useRef<HTMLButtonElement>(null);
  const nextBtnRef     = useRef<HTMLButtonElement>(null);
  const inboxRef       = useRef<HTMLDivElement>(null);

  // ── Stable callback refs ──────────────────────────────────────────────────
  const onUpdateTaskRef  = useRef(onUpdateTask);
  const onEditTaskRef    = useRef(onEditTask);
  const allTasksRef      = useRef([...tasks, ...unscheduledTasks]);
  useEffect(() => { onUpdateTaskRef.current = onUpdateTask; },                 [onUpdateTask]);
  useEffect(() => { onEditTaskRef.current   = onEditTask; },                   [onEditTask]);
  useEffect(() => { allTasksRef.current     = [...tasks, ...unscheduledTasks]; }, [tasks, unscheduledTasks]);

  // ── Drag data ref ─────────────────────────────────────────────────────────
  type DragData = {
    taskId: string;
    task: Task;
    source: 'timeline' | 'pool';
    startX: number;
    startY: number;
    pointerOffsetY: number;
    hasMoved: boolean;
  };
  const dragRef      = useRef<DragData | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);

  // ── Resize data ref ───────────────────────────────────────────────────────
  type ResizeData = { taskId: string; startY: number; startDuration: number };
  const resizeRef    = useRef<ResizeData | null>(null);
  const resizeDurRef = useRef(DEFAULT_DUR);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scroll to current hour on week/day change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (new Date().getHours() - START_HOUR - 1.5) * HOUR_HEIGHT);
    }
  }, [weekOffset, mobileDayOffset]);

  // Now indicator tick
  useEffect(() => {
    const id = setInterval(() => setNowPx(getNowPx()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Week / day calculations ───────────────────────────────────────────────
  const weekStart  = useMemo(() => addDays(getWeekStart(new Date()), weekOffset * 7), [weekOffset]);
  const weekDays   = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const mobileDays = useMemo(() => {
    const center = startOfDay(addDays(new Date(), mobileDayOffset));
    return [-1, 0, 1].map(d => addDays(center, d));
  }, [mobileDayOffset]);

  const days    = isMobile ? mobileDays : weekDays;
  const numCols = days.length;

  // Keep days in a ref for the global effect
  const daysRef = useRef(days);
  useEffect(() => { daysRef.current = days; }, [days]);

  const tasksByDay = useMemo(() => days.map(day => {
    const result: Task[] = [];
    for (const t of tasks) {
      const isExact = !t.recurrence || t.recurrence === 'none';
      if (isExact) { if (isSameDay(new Date(t.dueDate), day)) result.push(t); }
      else if (matchesRecurrence(t, day)) { result.push(makeInstance(t, day)); }
    }
    return result;
  }), [tasks, days]);

  const layoutsByDay = useMemo(() =>
    tasksByDay.map(dt => computeLayout(dt.filter(t => isInRange(t.dueDate)))),
    [tasksByDay],
  );

  const unscheduledProjects = useMemo(() => {
    const ids = new Set(unscheduledTasks.map(t => t.projectId).filter(Boolean) as string[]);
    return projects.filter(p => ids.has(p.id));
  }, [unscheduledTasks, projects]);

  const filteredUnscheduled = useMemo(() => {
    const pool = panelProjectIds.length > 0
      ? unscheduledTasks.filter(t => t.projectId != null && panelProjectIds.includes(t.projectId))
      : unscheduledTasks;
    return sortTasksLogically(pool);
  }, [unscheduledTasks, panelProjectIds]);

  // ── Global pointer handlers ───────────────────────────────────────────────
  useEffect(() => {
    const cleanDrag = () => {
      dragRef.current = null;
      dropTargetRef.current = null;
      setDraggingTaskId(null);
      setGhostPos(null);
      setDropTarget(null);
      setPrevHov(false);
      setNextHov(false);
      setInboxHov(false);
    };

    // Compute which day column and position the pointer is over
    const getTimelineTarget = (clientX: number, clientY: number, offsetY: number): DropTarget | null => {
      const container = scrollRef.current;
      if (!container) return null;
      const containerRect = container.getBoundingClientRect();
      // Reject if pointer is in sticky header area
      if (clientY < containerRect.top + HEADER_H) return null;

      for (let i = 0; i < dayColumnRefs.current.length; i++) {
        const col = dayColumnRefs.current[i];
        if (!col) continue;
        const r = col.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
          const relY    = clientY - r.top - offsetY;
          const rawMin  = (relY / HOUR_HEIGHT) * 60 + START_HOUR * 60;
          const snapped = clampSnap(rawMin);
          return { dayIdx: i, hour: Math.floor(snapped / 60), minute: snapped % 60 };
        }
      }
      return null;
    };

    const onMove = (e: PointerEvent) => {
      // ── Resize ────────────────────────────────────────────────────────────
      if (resizeRef.current) {
        const dy     = e.clientY - resizeRef.current.startY;
        const newDur = Math.max(
          SNAP_MIN,
          resizeRef.current.startDuration + Math.round((dy / HOUR_HEIGHT) * 60 / SNAP_MIN) * SNAP_MIN,
        );
        resizeDurRef.current = newDur;
        setResizeDur(newDur);
        return;
      }

      // ── Drag ──────────────────────────────────────────────────────────────
      if (!dragRef.current) return;
      const d = dragRef.current;
      if (!d.hasMoved) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < MIN_DRAG_PX) return;
        d.hasMoved = true;
      }
      setGhostPos({ x: e.clientX, y: e.clientY, task: d.task });

      // Prev / next week buttons
      const prevBtn = prevBtnRef.current;
      const nextBtn = nextBtnRef.current;
      let overNavBtn = false;
      if (prevBtn) {
        const r = prevBtn.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        setPrevHov(over);
        if (over) overNavBtn = true;
      }
      if (nextBtn) {
        const r = nextBtn.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        setNextHov(over);
        if (over) overNavBtn = true;
      }

      // Inbox panel (pool → unschedule not applicable for pool source, only timeline)
      const inbox = inboxRef.current;
      let overInbox = false;
      if (inbox && d.source === 'timeline') {
        const r = inbox.getBoundingClientRect();
        overInbox = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        setInboxHov(overInbox);
      }

      if (overNavBtn || overInbox) {
        setDropTarget(null);
        dropTargetRef.current = null;
        return;
      }

      // Timeline columns
      const target = getTimelineTarget(e.clientX, e.clientY, d.pointerOffsetY);
      if (target) {
        const cur = dropTargetRef.current;
        if (!cur || cur.dayIdx !== target.dayIdx || cur.hour !== target.hour || cur.minute !== target.minute) {
          dropTargetRef.current = target;
          setDropTarget(target);
        }
      } else {
        dropTargetRef.current = null;
        setDropTarget(null);
      }
    };

    const onUp = (e: PointerEvent) => {
      // ── Commit resize ──────────────────────────────────────────────────────
      if (resizeRef.current) {
        onUpdateTaskRef.current?.(resizeRef.current.taskId, { durationMinutes: resizeDurRef.current });
        resizeRef.current = null;
        setResizingId(null);
        return;
      }

      // ── Commit drag ────────────────────────────────────────────────────────
      if (!dragRef.current) return;
      const d = dragRef.current;

      if (!d.hasMoved) {
        const original = d.task.recurrence && d.task.recurrence !== 'none'
          ? allTasksRef.current.find(t => t.id === d.taskId) ?? d.task
          : d.task;
        onEditTaskRef.current(original);
        cleanDrag();
        return;
      }

      const { taskId } = d;

      // Drop on prev week button
      const prevBtn = prevBtnRef.current;
      if (prevBtn) {
        const r = prevBtn.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const original = allTasksRef.current.find(t => t.id === taskId);
          if (original) {
            const nd = new Date(original.dueDate);
            nd.setDate(nd.getDate() - 7);
            onUpdateTaskRef.current?.(taskId, { dueDate: nd.toISOString(), isUnscheduled: false });
            setWeekOffset(o => o - 1);
          }
          cleanDrag();
          return;
        }
      }

      // Drop on next week button
      const nextBtn = nextBtnRef.current;
      if (nextBtn) {
        const r = nextBtn.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          const original = allTasksRef.current.find(t => t.id === taskId);
          if (original) {
            const nd = new Date(original.dueDate);
            nd.setDate(nd.getDate() + 7);
            onUpdateTaskRef.current?.(taskId, { dueDate: nd.toISOString(), isUnscheduled: false });
            setWeekOffset(o => o + 1);
          }
          cleanDrag();
          return;
        }
      }

      // Drop on inbox panel → unschedule
      const inbox = inboxRef.current;
      if (inbox && d.source === 'timeline') {
        const r = inbox.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          onUpdateTaskRef.current?.(taskId, { isUnscheduled: true });
          cleanDrag();
          return;
        }
      }

      // Drop on timeline column → schedule / reschedule
      const target = getTimelineTarget(e.clientX, e.clientY, d.pointerOffsetY);
      if (target) {
        const currentDays = daysRef.current;
        const day = currentDays[target.dayIdx];
        if (day) {
          const original = allTasksRef.current.find(t => t.id === taskId);
          const useCurrentDate = original?.recurrence && original.recurrence !== 'none';
          const base = useCurrentDate ? new Date(original!.dueDate) : new Date(day);
          base.setHours(target.hour, target.minute, 0, 0);
          onUpdateTaskRef.current?.(taskId, { dueDate: base.toISOString(), isUnscheduled: false });
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
  }, []); // stable — reads all live state through refs

  // ── Mobile swipe ──────────────────────────────────────────────────────────
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const isDragging = !!draggingTaskId;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3" style={{ height: 'calc(100svh - 220px)', minHeight: 400, userSelect: 'none' }}>

      {/* ── Floating drag ghost ──────────────────────────────────────────── */}
      {ghostPos && (
        <div
          className="fixed z-[999] pointer-events-none"
          style={{ left: ghostPos.x + 14, top: ghostPos.y - 14 }}
        >
          <div
            className="px-2.5 py-1.5 rounded-lg shadow-2xl text-[11px] font-semibold max-w-[200px] truncate ring-1 ring-black/10"
            style={{
              backgroundColor: WORKSTREAM_ACCENT[ghostPos.task.workstream] ?? '#a1a1aa',
              color: needsDarkText(WORKSTREAM_ACCENT[ghostPos.task.workstream] ?? '#a1a1aa') ? '#18181b' : '#ffffff',
            }}
          >
            {ghostPos.task.title}
          </div>
        </div>
      )}

      {/* ── Calendar column ─────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-x-auto md:overflow-x-visible"
        onTouchStart={isMobile ? (e) => {
          swipeStartX.current = e.touches[0].clientX;
          swipeStartY.current = e.touches[0].clientY;
        } : undefined}
        onTouchEnd={isMobile ? (e) => {
          if (swipeStartX.current === null || swipeStartY.current === null) return;
          const dx = e.changedTouches[0].clientX - swipeStartX.current;
          const dy = e.changedTouches[0].clientY - swipeStartY.current;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) setMobileDayOffset(o => o + 1);
            else setMobileDayOffset(o => o - 1);
          }
          swipeStartX.current = null;
          swipeStartY.current = null;
        } : undefined}
      >

        {/* Navigation */}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <button
            ref={prevBtnRef}
            onClick={() => !isDragging && (isMobile ? setMobileDayOffset(o => o - 1) : setWeekOffset(o => o - 1))}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150',
              prevHov
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 scale-110'
                : isDragging && !isMobile
                ? 'border-dashed border-zinc-400 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400 animate-pulse'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[120px] text-center select-none">
            {isMobile
              ? days[1].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: days[1].getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
              : formatRange(days[0], days[days.length - 1])}
          </span>

          <button
            ref={nextBtnRef}
            onClick={() => !isDragging && (isMobile ? setMobileDayOffset(o => o + 1) : setWeekOffset(o => o + 1))}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150',
              nextHov
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 scale-110'
                : isDragging && !isMobile
                ? 'border-dashed border-zinc-400 dark:border-zinc-500 text-zinc-500 dark:text-zinc-400 animate-pulse'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
            )}
          >
            <ChevronRight size={14} />
          </button>

          {isMobile && mobileDayOffset !== 0 && (
            <button onClick={() => setMobileDayOffset(0)} className="ml-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              Today
            </button>
          )}
          {!isMobile && weekOffset !== 0 && !isDragging && (
            <button onClick={() => setWeekOffset(0)} className="ml-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              This week
            </button>
          )}
          {isDragging && !isMobile && (
            <span className="ml-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              Drop on ← → to move to prev / next week
            </span>
          )}
        </div>

        {/* Single scroll container */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' } as React.CSSProperties}
        >
          <div className="flex">

            {/* Time gutter */}
            <div className="w-12 shrink-0 select-none pointer-events-none">
              <div className="sticky top-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800" style={{ height: HEADER_H }} />
              <div className="relative" style={{ height: TOTAL_HEIGHT }}>
                {HOURS.map(h => (
                  <div key={h} className="absolute right-0 w-full flex justify-end pr-2" style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}>
                    <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 leading-none tabular-nums">{fmtHour(h)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day columns */}
            <div className="flex-1 min-w-0">

              {/* Sticky header */}
              <div
                className="sticky top-0 z-20 grid border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                style={{ height: HEADER_H, gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
              >
                {days.map((day, i) => {
                  const isToday   = isSameDay(day, todayDate);
                  const isWeekend = IS_WEEKEND[day.getDay()];
                  const outOfRange = tasksByDay[i].filter(t => !isInRange(t.dueDate)).length;
                  return (
                    <div key={i} className={cn(
                      'flex flex-col items-center justify-center border-l border-zinc-100 dark:border-zinc-800/60',
                      i === 0 && 'border-l-0',
                      isWeekend && 'bg-zinc-50 dark:bg-zinc-900/50',
                    )}>
                      <p className={cn('text-[9px] font-semibold uppercase tracking-wider mb-0.5', isWeekend ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500')}>
                        {DAY_NAMES[day.getDay()]}
                      </p>
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', isToday && 'bg-zinc-900 dark:bg-white')}>
                        <span className={cn('text-[12px] font-bold', isToday ? 'text-white dark:text-zinc-900' : isWeekend ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300')}>
                          {day.getDate()}
                        </span>
                      </div>
                      {outOfRange > 0 && <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-0.5">+{outOfRange}</p>}
                    </div>
                  );
                })}
              </div>

              {/* Body grid */}
              <div className="grid relative" style={{ height: TOTAL_HEIGHT, gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}>

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
                  const isWeekend = IS_WEEKEND[day.getDay()];
                  const isDropDay = dropTarget?.dayIdx === dayIdx;
                  const layout    = layoutsByDay[dayIdx];

                  return (
                    <div
                      key={dayIdx}
                      ref={el => { dayColumnRefs.current[dayIdx] = el; }}
                      className={cn(
                        'relative border-l border-zinc-100 dark:border-zinc-800/60',
                        dayIdx === 0 && 'border-l-0',
                        isWeekend && !isToday && 'bg-zinc-50 dark:bg-zinc-900/50',
                        isToday && 'bg-blue-50/40 dark:bg-zinc-900/20',
                        isDropDay && isDragging && 'bg-accent-cyan/8 dark:bg-accent-cyan/5',
                      )}
                    >
                      {/* Now line */}
                      {isToday && nowPx >= 0 && nowPx <= TOTAL_HEIGHT && (
                        <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: nowPx }}>
                          <div className="w-[7px] h-[7px] rounded-full bg-accent-cyan shrink-0 -ml-[3.5px]" />
                          <div className="flex-1 h-[1.5px] bg-accent-cyan" />
                        </div>
                      )}

                      {/* Drop snap indicator */}
                      {isDropDay && dropTarget && isDragging && (
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
                        const rawDur      = resizingId === task.id ? resizeDur : (task.durationMinutes ?? DEFAULT_DUR);
                        const top         = taskTopPx(task.dueDate);
                        const height      = Math.max((rawDur / 60) * HOUR_HEIGHT - 2, 22);
                        const isDone      = task.status === 'done';
                        const isRecurring = !!(task.recurrence && task.recurrence !== 'none');
                        const accent      = WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa';
                        const cardKey     = task.id + task.dueDate;
                        const endDate     = new Date(d.getTime() + rawDur * 60_000);
                        const isShort     = height < 28;
                        const isMed       = height >= 28 && height < 52;
                        const darkText    = needsDarkText(accent);
                        const textColor   = isDone ? '#71717a' : darkText ? '#1a1a1a' : '#ffffff';
                        const subColor    = isDone ? '#a1a1aa' : darkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
                        const isActiveDrag = draggingTaskId === task.id && !resizingId;

                        return (
                          <div
                            key={cardKey}
                            className={cn(
                              'absolute rounded-lg overflow-hidden z-[5] group',
                              'transition-opacity duration-150',
                              isActiveDrag        ? 'opacity-25 cursor-grabbing' : 'cursor-grab hover:z-10 hover:brightness-105',
                              resizingId === task.id ? 'cursor-ns-resize z-[6]' : '',
                              isDone && !isActiveDrag && 'opacity-40',
                            )}
                            style={{
                              top,
                              height,
                              left:  `calc(${left  * 100}% + 2px)`,
                              width: `calc(${width * 100}% - 4px)`,
                              minHeight: 22,
                              backgroundColor: isDone ? '#e4e4e7' : accent,
                              boxShadow: isDone ? 'none' : `0 1px 3px ${accent}55`,
                              touchAction: 'none',
                            }}
                            onPointerDown={(e) => {
                              if (e.button !== 0 || resizeRef.current) return;
                              const colEl = dayColumnRefs.current[dayIdx];
                              const offsetY = colEl
                                ? Math.max(0, Math.min(e.clientY - colEl.getBoundingClientRect().top - top, height))
                                : 0;
                              dragRef.current = {
                                taskId: task.id,
                                task,
                                source: 'timeline',
                                startX: e.clientX,
                                startY: e.clientY,
                                pointerOffsetY: offsetY,
                                hasMoved: false,
                              };
                              setDraggingTaskId(task.id);
                            }}
                          >
                            {/* Task content */}
                            <div className={cn('flex flex-col min-w-0 px-2.5 pointer-events-none', isShort ? 'pt-1' : 'pt-1.5')}>
                              <p
                                className={cn('font-semibold leading-tight tracking-tight truncate', isShort ? 'text-[10px]' : 'text-[11px]', isDone && 'line-through')}
                                style={{ color: textColor }}
                              >
                                {isRecurring && <RefreshCw size={7} className="inline mr-[3px] mb-[1px] opacity-70" />}
                                {task.title}
                              </p>
                              {!isShort && !isMed && (
                                <p className="text-[9px] font-medium mt-1 leading-none truncate" style={{ color: subColor }}>
                                  {fmtHour(d.getHours(), d.getMinutes())} – {fmtHour(endDate.getHours(), endDate.getMinutes())}
                                </p>
                              )}
                              {isMed && (
                                <p className="text-[9px] font-medium mt-1 leading-none truncate" style={{ color: subColor }}>
                                  {fmtHour(d.getHours(), d.getMinutes())}
                                </p>
                              )}
                            </div>

                            {/* Resize handle */}
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
                                  dragRef.current = null;
                                  setDraggingTaskId(null);
                                  const startDur = task.durationMinutes ?? DEFAULT_DUR;
                                  resizeRef.current  = { taskId: task.id, startY: e.clientY, startDuration: startDur };
                                  resizeDurRef.current = startDur;
                                  setResizingId(task.id);
                                  setResizeDur(startDur);
                                }}
                              >
                                <div className={cn('w-8 h-[3px] rounded-full', darkText ? 'bg-zinc-900/25' : 'bg-white/35')} />
                              </div>
                            )}
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

      {/* ── Inbox / Task Pool Panel ─────────────────────────────────────── */}
      <div
        ref={inboxRef}
        className={cn(
          'hidden md:flex shrink-0 flex-col rounded-2xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-150 relative',
          inboxHov
            ? 'border-accent-cyan/60 ring-2 ring-accent-cyan/20 shadow-lg shadow-accent-cyan/10'
            : isDragging
            ? 'border-zinc-300 dark:border-zinc-600'
            : 'border-zinc-100 dark:border-zinc-800/80',
        )}
        style={{ width: 280 }}
      >
        {/* Drop overlay */}
        {inboxHov && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none rounded-2xl bg-accent-cyan/5">
            <div className="bg-accent-cyan/20 text-accent-cyan text-[11px] font-bold px-3 py-1.5 rounded-lg">
              Drop to unschedule
            </div>
          </div>
        )}

        {/* Panel header */}
        <div className={cn('px-4 pt-4 pb-3 shrink-0 border-b transition-colors', inboxHov ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60' : 'border-zinc-50 dark:border-zinc-800/60')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors', inboxHov ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800/80')}>
                <LayoutList size={12} className={cn('transition-colors', inboxHov ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400')} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">Task Pool</span>
            </div>
            {unscheduledTasks.length > 0 && (
              <span className="text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums">
                {unscheduledTasks.length}
              </span>
            )}
          </div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-1.5 leading-relaxed">
            {isDragging ? 'Drop here to unschedule · drag to calendar' : 'Drag to calendar to schedule · drag back to unschedule'}
          </p>
        </div>

        {/* Project filter chips — multi-select */}
        {unscheduledProjects.length > 0 && (
          <div className="px-3 py-2.5 shrink-0 border-b border-zinc-50 dark:border-zinc-800/40">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPanelProjectIds([])}
                className={cn('text-[9px] font-semibold px-2 py-1 rounded-full transition-all', panelProjectIds.length === 0 ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')}
              >All</button>
              {unscheduledProjects.map(p => {
                const active = panelProjectIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setPanelProjectIds(prev =>
                      active ? prev.filter(id => id !== p.id) : [...prev, p.id]
                    )}
                    className={cn('text-[9px] font-semibold px-2 py-1 rounded-full transition-all', active ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700')}
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
          {filteredUnscheduled.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-600">
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">All scheduled</p>
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 leading-relaxed">Tasks without a date<br />will appear here</p>
              </div>
            </div>
          ) : (
            filteredUnscheduled.map(task => {
              const proj    = projectMap.get(task.projectId ?? '');
              const overdue = isOverdue(task.dueDate, task.status, task.isUnscheduled);
              return (
                <div
                  key={task.id}
                  className={cn(
                    'group relative flex items-stretch gap-0 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-sm overflow-hidden select-none border',
                    overdue
                      ? 'bg-accent-orange/5 dark:bg-accent-orange/[0.06] border-accent-orange/20 hover:border-accent-orange/40'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700'
                  )}
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
                    setDraggingTaskId(task.id);
                  }}
                >
                  <div className="w-[3px] shrink-0" style={{ backgroundColor: overdue ? '#FF9900' : WORKSTREAM_ACCENT[task.workstream] ?? '#a1a1aa' }} />
                  <div className="flex-1 min-w-0 px-2.5 py-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">{task.title}</p>
                      <StatusIcon status={task.status} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {proj
                        ? <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 truncate">{proj.name}</p>
                        : <p className="text-[9px] font-medium text-zinc-300 dark:text-zinc-600 capitalize">{task.workstream}</p>
                      }
                      {overdue && <span className="text-[9px] font-bold text-accent-orange shrink-0">· overdue</span>}
                    </div>
                  </div>
                  <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                    <GripVertical size={11} className="text-zinc-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredUnscheduled.length > 0 && (
          <div className="px-3 py-2 border-t border-zinc-50 dark:border-zinc-800/40 shrink-0">
            <p className="text-[9px] text-zinc-300 dark:text-zinc-600 text-center">
              {filteredUnscheduled.length} task{filteredUnscheduled.length !== 1 ? 's' : ''} · drag to calendar to schedule
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
