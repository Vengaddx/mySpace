'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import {
  RoadmapGoal, LifeArea, LifeAreaId, GoalStatus,
  GOAL_STATUS_CONFIG, LIFE_AREAS, getLifeArea,
} from '@/lib/roadmap-data';
import { cn } from '@/lib/utils';

// ─── Timeline constants ───────────────────────────────────────────────────────

type Zoom = 'year' | 'quarter' | 'month';

const PX: Record<Zoom, number> = { year: 18, quarter: 36, month: 72 };
const TOTAL_MONTHS = 60;
const YEARS = [2026, 2027, 2028, 2029, 2030];
const QS    = ['Q1', 'Q2', 'Q3', 'Q4'];
const MS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NAME_COL = 196;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mFrom(d: Date) {
  return (d.getFullYear() - 2026) * 12 + d.getMonth();
}

function addM(iso: string, n: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return new Date(
    Math.max(new Date('2026-01-01').getTime(),
    Math.min(new Date('2030-12-31').getTime(), d.getTime()))
  ).toISOString().slice(0, 10);
}

function bar(goal: RoadmapGoal, px: number) {
  const s = Math.max(0, mFrom(new Date(goal.startDate)));
  const e = Math.min(TOTAL_MONTHS, mFrom(new Date(goal.targetDate)));
  return { left: s * px, width: Math.max(px * 0.75, (e - s) * px) };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DragType = 'move' | 'resize-left' | 'resize-right';
interface Drag {
  goalId: string; type: DragType;
  startX: number; origStart: string; origTarget: string;
}
type Sheet = { mode: 'add' } | { mode: 'edit'; goal: RoadmapGoal } | null;
const ALL_STATUSES: GoalStatus[] = ['planned','active','on_track','delayed','completed','parked'];

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { initialGoals: RoadmapGoal[]; lifeAreas: LifeArea[] }

export function RoadmapClient({ initialGoals }: Props) {
  const [goals, setGoals] = useState<RoadmapGoal[]>(initialGoals);
  const [zoom,  setZoom]  = useState<Zoom>('quarter');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [drag,  setDrag]  = useState<Drag | null>(null);

  const dragRef  = useRef<Drag | null>(null);
  const pxRef    = useRef(PX.quarter);
  const scrollEl = useRef<HTMLDivElement>(null);

  const px         = PX[zoom];
  const totalW     = TOTAL_MONTHS * px;
  const todayLeft  = Math.max(0, mFrom(new Date())) * px;

  // Keep refs in sync
  pxRef.current  = px;
  dragRef.current = drag;

  // ── Global drag listeners (mounted once) ──────────────────────────────────
  useEffect(() => {
    function moveDrag(clientX: number) {
      const d = dragRef.current;
      if (!d) return;
      const dm = Math.round((clientX - d.startX) / pxRef.current);
      if (dm === 0) return;
      setGoals(prev => prev.map(g => {
        if (g.id !== d.goalId) return g;
        if (d.type === 'move') {
          return { ...g, startDate: addM(d.origStart, dm), targetDate: addM(d.origTarget, dm) };
        }
        if (d.type === 'resize-right') {
          const t = addM(d.origTarget, dm);
          return t > g.startDate ? { ...g, targetDate: t } : g;
        }
        if (d.type === 'resize-left') {
          const s = addM(d.origStart, dm);
          return s < g.targetDate ? { ...g, startDate: s } : g;
        }
        return g;
      }));
    }
    const onMM  = (e: MouseEvent)      => moveDrag(e.clientX);
    const onMU  = ()                    => { dragRef.current = null; setDrag(null); };
    const onTM  = (e: TouchEvent)       => { e.preventDefault(); moveDrag(e.touches[0].clientX); };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup',   onMU);
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend',  onMU);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup',   onMU);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend',  onMU);
    };
  }, []);

  // Scroll to today on first render
  useEffect(() => {
    if (scrollEl.current) {
      scrollEl.current.scrollLeft = Math.max(0, todayLeft - 140);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginDrag(e: React.MouseEvent | React.TouchEvent, goal: RoadmapGoal, type: DragType) {
    e.preventDefault();
    e.stopPropagation();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const d: Drag = { goalId: goal.id, type, startX: cx, origStart: goal.startDate, origTarget: goal.targetDate };
    dragRef.current = d;
    setDrag(d);
  }

  function handleSave(data: Omit<RoadmapGoal, 'id' | 'createdAt'>) {
    if (sheet?.mode === 'edit') {
      setGoals(p => p.map(g => g.id === sheet.goal.id ? { ...g, ...data } : g));
    } else {
      setGoals(p => [...p, { ...data, id: String(Date.now()), createdAt: new Date().toISOString() }]);
    }
    setSheet(null);
  }

  function handleDelete(id: string) {
    setGoals(p => p.filter(g => g.id !== id));
    setSheet(null);
  }

  const isDragging = !!drag;

  return (
    <div
      className="pb-10"
      style={{ userSelect: isDragging ? 'none' : undefined } as React.CSSProperties}
    >
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mb-1.5">
            Life Planning
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-white leading-none">
            Roadmap
          </h1>
        </div>
        <button
          onClick={() => setSheet({ mode: 'add' })}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={13} strokeWidth={2} />
          New
        </button>
      </div>

      {/* ── Zoom controls ── */}
      <div className="flex items-center gap-0.5 mb-5">
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-0.5">
          {(['year', 'quarter', 'month'] as Zoom[]).map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
                zoom === z
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <div ref={scrollEl} className="overflow-x-auto no-scrollbar">
          <table
            className="border-collapse"
            style={{ width: NAME_COL + totalW, tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: NAME_COL }} />
              <col style={{ width: totalW }} />
            </colgroup>

            <thead>
              {/* Year row */}
              <tr>
                <th
                  className="sticky left-0 z-20 bg-white dark:bg-zinc-950 text-left px-4 border-b border-zinc-100 dark:border-zinc-800"
                  style={{ height: 34 }}
                >
                  <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-zinc-400 dark:text-zinc-600">
                    Goal
                  </span>
                </th>
                <th className="relative p-0 border-b border-zinc-100 dark:border-zinc-800" style={{ height: 34 }}>
                  {YEARS.map(y => (
                    <div
                      key={y}
                      className="absolute top-0 h-full flex items-center pl-3 border-r border-zinc-100 dark:border-zinc-800/50"
                      style={{ left: (y - 2026) * 12 * px, width: 12 * px }}
                    >
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{y}</span>
                    </div>
                  ))}
                </th>
              </tr>

              {/* Quarter / Month sub-row */}
              {zoom !== 'year' && (
                <tr>
                  <th className="sticky left-0 z-20 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800" style={{ height: 22 }} />
                  <th className="relative p-0 border-b border-zinc-100 dark:border-zinc-800" style={{ height: 22 }}>
                    {zoom === 'quarter'
                      ? YEARS.flatMap(y => QS.map((q, qi) => (
                          <div
                            key={`${y}${q}`}
                            className="absolute top-0 h-full flex items-center pl-2 border-r border-zinc-100 dark:border-zinc-800/40"
                            style={{ left: ((y - 2026) * 12 + qi * 3) * px, width: 3 * px }}
                          >
                            <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-600">{q}</span>
                          </div>
                        )))
                      : YEARS.flatMap(y => MS.map((m, mi) => (
                          <div
                            key={`${y}${mi}`}
                            className="absolute top-0 h-full flex items-center pl-1.5 border-r border-zinc-100 dark:border-zinc-800/30"
                            style={{ left: ((y - 2026) * 12 + mi) * px, width: px }}
                          >
                            <span className="text-[8px] font-medium text-zinc-400 dark:text-zinc-600">{m}</span>
                          </div>
                        )))
                    }
                  </th>
                </tr>
              )}
            </thead>

            <tbody>
              {goals.map(goal => {
                const area  = getLifeArea(goal.lifeAreaId);
                const { left, width } = bar(goal, px);
                const isThisDrag = drag?.goalId === goal.id;

                return (
                  <tr
                    key={goal.id}
                    className="group border-b border-zinc-50 dark:border-zinc-800/40 last:border-0"
                  >
                    {/* Name cell — click to edit */}
                    <td
                      className="sticky left-0 z-10 bg-white dark:bg-zinc-950 group-hover:bg-zinc-50/80 dark:group-hover:bg-zinc-900/60 cursor-pointer transition-colors px-4"
                      style={{ height: 44 }}
                      onClick={() => !isDragging && setSheet({ mode: 'edit', goal })}
                    >
                      <div className="flex items-center gap-2.5 h-full">
                        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: area.color }} />
                        <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate leading-none">
                          {goal.title}
                        </span>
                      </div>
                    </td>

                    {/* Timeline bar cell */}
                    <td className="relative p-0 bg-white dark:bg-zinc-950 group-hover:bg-zinc-50/80 dark:group-hover:bg-zinc-900/60 transition-colors" style={{ height: 44 }}>
                      {/* Grid lines */}
                      {YEARS.map(y => (
                        <div
                          key={y}
                          className="absolute top-0 h-full w-px bg-zinc-100 dark:bg-zinc-800/40 pointer-events-none"
                          style={{ left: (y - 2026 + 1) * 12 * px - 1 }}
                        />
                      ))}

                      {/* Today line */}
                      <div
                        className="absolute top-0 h-full w-px pointer-events-none z-10"
                        style={{ left: todayLeft, backgroundColor: 'rgba(239,68,68,0.35)' }}
                      />

                      {/* Goal bar */}
                      <div
                        className={cn(
                          'absolute top-[9px] h-[26px] rounded-md select-none',
                          isThisDrag ? 'z-20' : 'z-10',
                          isDragging && !isThisDrag ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
                        )}
                        style={{ left: left + 2, width: Math.max(width - 4, 6) }}
                        onMouseDown={e => beginDrag(e, goal, 'move')}
                        onTouchStart={e => beginDrag(e, goal, 'move')}
                      >
                        {/* Track */}
                        <div
                          className="absolute inset-0 rounded-md"
                          style={{ backgroundColor: area.color, opacity: 0.13 }}
                        />
                        {/* Progress fill */}
                        <div
                          className="absolute top-0 left-0 h-full rounded-md"
                          style={{ backgroundColor: area.color, opacity: 0.55, width: `${goal.progress}%` }}
                        />
                        {/* Solid left edge (always shown, marks start) */}
                        <div
                          className="absolute top-1 bottom-1 left-0 w-[3px] rounded-sm"
                          style={{ backgroundColor: area.color, opacity: 0.8 }}
                        />

                        {/* Left resize handle */}
                        <div
                          className="absolute left-0 top-0 h-full w-3 cursor-ew-resize z-20"
                          onMouseDown={e => beginDrag(e, goal, 'resize-left')}
                          onTouchStart={e => beginDrag(e, goal, 'resize-left')}
                        />
                        {/* Right resize handle */}
                        <div
                          className="absolute right-0 top-0 h-full w-3 cursor-ew-resize z-20"
                          onMouseDown={e => beginDrag(e, goal, 'resize-right')}
                          onTouchStart={e => beginDrag(e, goal, 'resize-right')}
                        />

                        {/* Progress % label */}
                        {goal.progress > 0 && width > 48 && (
                          <span
                            className="absolute inset-0 flex items-center pl-2.5 text-[9px] font-semibold pointer-events-none select-none"
                            style={{ color: area.color, opacity: 0.9 }}
                          >
                            {goal.progress}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[13px] text-zinc-400 dark:text-zinc-600 mb-2">No goals yet.</p>
            <button
              onClick={() => setSheet({ mode: 'add' })}
              className="text-[13px] font-medium text-zinc-900 dark:text-white underline underline-offset-2"
            >
              Add your first goal
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      {goals.length > 0 && (
        <div className="mt-3 flex items-center gap-4 px-1 flex-wrap">
          {LIFE_AREAS.filter(a => goals.some(g => g.lifeAreaId === a.id)).map(area => (
            <div key={area.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
              <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{area.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Goal sheet */}
      {sheet && (
        <GoalSheet
          mode={sheet.mode}
          goal={sheet.mode === 'edit' ? sheet.goal : undefined}
          onSave={handleSave}
          onDelete={sheet.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

// ─── Goal Sheet ───────────────────────────────────────────────────────────────

interface SheetProps {
  mode: 'add' | 'edit';
  goal?: RoadmapGoal;
  onSave: (data: Omit<RoadmapGoal, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

function GoalSheet({ mode, goal, onSave, onDelete, onClose }: SheetProps) {
  const [title,   setTitle]   = useState(goal?.title      ?? '');
  const [areaId,  setAreaId]  = useState<LifeAreaId>(goal?.lifeAreaId ?? 'health');
  const [start,   setStart]   = useState(goal?.startDate  ?? '2026-01-01');
  const [target,  setTarget]  = useState(goal?.targetDate ?? '2026-12-31');
  const [status,  setStatus]  = useState<GoalStatus>(goal?.status ?? 'planned');
  const [progress,setProgress]= useState(goal?.progress   ?? 0);
  const [notes,   setNotes]   = useState(goal?.notes      ?? '');

  const area = getLifeArea(areaId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), lifeAreaId: areaId, startDate: start, targetDate: target, status, progress, notes });
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel — bottom sheet on mobile, centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:w-[400px] bg-white dark:bg-zinc-900 sm:rounded-2xl rounded-t-2xl border-t border-zinc-100 dark:border-zinc-800 sm:border shadow-2xl overflow-hidden">

          {/* Drag handle (mobile only) */}
          <div className="flex justify-center pt-2.5 sm:hidden">
            <div className="w-7 h-[3px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
            <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-white">
              {mode === 'add' ? 'New Goal' : 'Edit Goal'}
            </h2>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable form body */}
          <form onSubmit={submit} className="overflow-y-auto max-h-[calc(90dvh-60px)] sm:max-h-none">
            <div className="px-5 py-4 space-y-4">

              {/* Title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Goal title"
                autoFocus
                className={cn(F.input, 'text-[14px] font-medium')}
              />

              {/* Life area chips */}
              <div>
                <Label>Area</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LIFE_AREAS.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAreaId(a.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-100',
                        areaId === a.id
                          ? 'border-transparent'
                          : 'border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700'
                      )}
                      style={areaId === a.id ? { backgroundColor: `${a.color}15`, borderColor: `${a.color}40`, color: a.color } : {}}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label>Start</Label>
                  <input type="date" value={start} min="2026-01-01" max="2030-12-31"
                    onChange={e => setStart(e.target.value)} className={F.input} />
                </div>
                <div>
                  <Label>Target</Label>
                  <input type="date" value={target} min="2026-01-01" max="2030-12-31"
                    onChange={e => setTarget(e.target.value)} className={F.input} />
                </div>
              </div>

              {/* Status + Progress on same row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label>Status</Label>
                  <select value={status} onChange={e => setStatus(e.target.value as GoalStatus)} className={F.input}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{GOAL_STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="mb-0">Progress</Label>
                    <span className="text-[11px] font-semibold text-zinc-900 dark:text-white">{progress}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={progress}
                    onChange={e => setProgress(Number(e.target.value))}
                    className="w-full h-[3px] rounded-full appearance-none cursor-pointer mt-[9px]"
                    style={{
                      background: `linear-gradient(to right, ${area.color} 0%, ${area.color} ${progress}%, ${progress > 0 ? '#e4e4e7' : '#e4e4e7'} ${progress}%, #e4e4e7 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Why this matters..."
                  rows={2}
                  className={cn(F.input, 'resize-none')}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-5 pb-5 pt-1">
              {mode === 'edit' && onDelete && (
                <button type="button" onClick={() => onDelete(goal!.id)}
                  className="px-3 py-2 rounded-lg text-[12px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                  Delete
                </button>
              )}
              <div className="flex-1 flex gap-2 justify-end">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[12px] font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!title.trim()}
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40">
                  {mode === 'add' ? 'Add' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] font-medium tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500 mb-1.5', className)}>
      {children}
    </p>
  );
}

const F = {
  input: cn(
    'w-full rounded-lg border border-zinc-200 dark:border-zinc-700/80',
    'bg-zinc-50 dark:bg-zinc-800/50',
    'px-3 py-2 text-[13px] text-zinc-900 dark:text-zinc-100',
    'placeholder:text-zinc-300 dark:placeholder:text-zinc-600',
    'focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600',
    'transition-all duration-100'
  ),
};
