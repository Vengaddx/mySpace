'use client';

import React, { useState, useMemo, useId } from 'react';
import { Goal } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const PALETTE = ['#F2296B', '#00C1FF', '#AEDD00', '#FF9900', '#a78bfa', '#34d399'];
const DAY_ABR = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDS(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getMonthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: last.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
// ── Activity Rings (Apple Fitness style) ──────────────────────────────────────
function GoalRings({ progresses, colors, size }: { progresses: number[]; colors: string[]; size: number }) {
  const uid    = useId().replace(/:/g, '');
  const sw     = size * 0.10;
  const gap    = size * 0.028;
  const center = size / 2;
  const outerR = center - sw / 2 - size * 0.015;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {colors.map((color, i) => (
          <filter key={i} id={`${uid}g${i}`} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation={sw * 0.5} result="blur" />
            <feFlood floodColor={color} floodOpacity="0.65" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {colors.map((color, i) => {
        const r        = outerR - i * (sw + gap);
        if (r <= 0) return null;
        const circ     = 2 * Math.PI * r;
        const progress = Math.min(progresses[i] ?? 0, 1);
        const offset   = circ * (1 - progress);
        return (
          <g key={i}>
            {/* Track */}
            <circle cx={center} cy={center} r={r} fill="none"
              stroke={color} strokeWidth={sw} strokeOpacity={0.12} />
            {/* Arc */}
            {progress > 0 && (
              <circle cx={center} cy={center} r={r} fill="none"
                stroke={color} strokeWidth={sw}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                filter={`url(#${uid}g${i})`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface GoalsClientProps { initialGoals: Goal[] }

export function GoalsClient({ initialGoals }: GoalsClientProps) {
  const today = useMemo(() => new Date(), []);

  const [goals,   setGoals]   = useState<Goal[]>(initialGoals);
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [adding,  setAdding]  = useState(false);

  const [nTitle,  setNTitle]  = useState('');
  const [nColor,  setNColor]  = useState(PALETTE[0]);
  const [nType,   setNType]   = useState<'habit' | 'milestone'>('habit');
  const [nTarget, setNTarget] = useState('');
  const [nUnit,   setNUnit]   = useState('');

  const monthStr   = `${year}-${String(month + 1).padStart(2, '0')}`;
  const allGoals   = goals.filter(g => g.month === monthStr);
  const habits     = allGoals.filter(g => g.type === 'habit');
  const milestones = allGoals.filter(g => g.type === 'milestone');

  function toggle(goalId: string, ds: string) {
    setGoals(p => p.map(g => {
      if (g.id !== goalId) return g;
      return { ...g, checkins: g.checkins.includes(ds) ? g.checkins.filter(c => c !== ds) : [...g.checkins, ds] };
    }));
  }
  function setCurrent(goalId: string, val: number) {
    setGoals(p => p.map(g => g.id === goalId ? { ...g, current: Math.max(0, val) } : g));
  }
  function remove(id: string) { setGoals(p => p.filter(g => g.id !== id)); }

  function addGoal() {
    if (!nTitle.trim()) return;
    setGoals(p => [...p, {
      id: `goal-${Date.now()}`, month: monthStr,
      title: nTitle.trim(), emoji: '', color: nColor, type: nType, checkins: [],
      target:  nType === 'milestone' ? (Number(nTarget) || undefined) : undefined,
      unit:    nType === 'milestone' ? (nUnit.trim() || undefined) : undefined,
      current: nType === 'milestone' ? 0 : undefined,
      createdAt: new Date().toISOString(),
    }]);
    setAdding(false); setNTitle(''); setNColor(PALETTE[0]); setNType('habit'); setNTarget(''); setNUnit('');
  }

  function goMonthBack()    { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function goMonthForward() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  const isCurMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="max-w-4xl mx-auto space-y-3">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5">
          <NavBtn onClick={goMonthBack}><ChevronLeft size={13}/></NavBtn>
          <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 min-w-[140px] text-center select-none">
            {MONTHS[month]} {year}
          </span>
          <NavBtn onClick={goMonthForward}><ChevronRight size={13}/></NavBtn>
          {!isCurMonth && (
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-1"
            >Today</button>
          )}
        </div>

        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <Plus size={13}/> Add goal
        </button>
      </div>

      {/* ── Month rings calendar ─────────────────────────────────────────────── */}
      <MonthRingsView
        habits={habits}
        milestones={milestones}
        year={year} month={month} today={today}
        onToggle={toggle}
        onSetCurrent={setCurrent}
        onRemove={remove}
      />

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {allGoals.length === 0 && !adding && (
        <div className="py-24 text-center">
          <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">No goals this month</p>
          <p className="text-xs text-zinc-300 dark:text-zinc-700 mt-1">Tap "Add goal" to get started</p>
        </div>
      )}

      {/* ── Add form ─────────────────────────────────────────────────────────── */}
      {adding && (
        <AddForm
          title={nTitle} setTitle={setNTitle}
          color={nColor} setColor={setNColor}
          type={nType}   setType={setNType}
          target={nTarget} setTarget={setNTarget}
          unit={nUnit}   setUnit={setNUnit}
          onSave={addGoal} onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

// ── Month rings calendar view ─────────────────────────────────────────────────
function MonthRingsView({ habits, milestones, year, month, today, onToggle, onSetCurrent, onRemove }: {
  habits: Goal[]; milestones: Goal[];
  year: number; month: number; today: Date;
  onToggle: (id: string, ds: string) => void;
  onSetCurrent: (id: string, val: number) => void;
  onRemove: (id: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const cells    = useMemo(() => getMonthCells(year, month), [year, month]);
  const todayDS  = toDS(today);
  const selDS    = toDS(selectedDay);
  const colors   = habits.map(g => g.color);
  const selProgresses = habits.map(g => g.checkins.includes(selDS) ? 1 : 0);
  const monthStr = `${year}-${String(month+1).padStart(2,'0')}`;

  // legend: how many days each habit was done this month
  const habitCounts = habits.map(g => g.checkins.filter(c => c.startsWith(monthStr)).length);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">

      {/* ── Calendar grid ─────────────────────────────────────────────────────── */}
      <div className="w-full md:flex-1 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-zinc-50 dark:border-zinc-800/60 px-2 py-2">
          {DAY_ABR.map((l, i) => (
            <p key={i} className="text-center text-[9px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-700">{l}</p>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square" />;
            const ds         = toDS(day);
            const isToday    = ds === todayDS;
            const isSelected = ds === selDS;
            const future     = day > today;
            const progresses = habits.map(g => g.checkins.includes(ds) ? 1 : 0);
            const anyDone    = progresses.some(p => p > 0);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-150',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800/80'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
                )}
              >
                <span className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  isToday
                    ? 'text-zinc-900 dark:text-zinc-50 font-bold'
                    : isSelected
                    ? 'text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-400 dark:text-zinc-600',
                )}>
                  {day.getDate()}
                </span>

                {habits.length > 0 && (
                  <GoalRings
                    progresses={future ? habits.map(() => 0) : progresses}
                    colors={colors}
                    size={38}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend strip */}
        {habits.length > 0 && (
          <div className="border-t border-zinc-50 dark:border-zinc-800/60 px-4 py-3 flex items-center gap-4 flex-wrap">
            {habits.map((g, i) => (
              <div key={g.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{g.title}</span>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: g.color }}>
                  {habitCounts[i]}/{daysInMonth}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Selected day panel ────────────────────────────────────────────────── */}
      <div className="w-full md:w-56 md:shrink-0 md:sticky md:top-20">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">

          {/* Date header */}
          <div className="px-5 pt-4 pb-3 border-b border-zinc-50 dark:border-zinc-800/60">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              {selectedDay.toLocaleDateString('en-GB', { weekday: 'long' })}
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-0.5">
              {selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Large rings + checklist — row on mobile, stacked on sidebar */}
          {habits.length > 0 && (
            <div className="flex md:flex-col">
              <div className="flex justify-center py-4 px-4 md:py-5">
                <GoalRings progresses={selProgresses} colors={colors} size={100} />
              </div>
            </div>
          )}

          {/* Habit checklist */}
          {habits.length > 0 && (
            <div className="border-t border-zinc-50 dark:border-zinc-800/60 divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {habits.map(goal => {
                const checked = goal.checkins.includes(selDS);
                const future  = selectedDay > today;
                return (
                  <div key={goal.id} className="group flex items-center gap-3 px-4 py-3">
                    <div className="w-[3px] h-4 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                    <p className={cn('text-[12px] font-semibold flex-1 truncate',
                      checked ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600')}>
                      {goal.title}
                    </p>
                    <button
                      disabled={future}
                      onClick={() => !future && onToggle(goal.id, selDS)}
                      className={cn(
                        'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all shrink-0',
                        checked ? 'border-transparent' : 'border-zinc-200 dark:border-zinc-700',
                        future && 'opacity-30 cursor-default',
                      )}
                      style={{
                        backgroundColor: checked ? goal.color : undefined,
                        borderColor: !checked && !future ? goal.color : undefined,
                      }}
                    >
                      {checked && <Check size={9} strokeWidth={3} className="text-white" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {habits.length === 0 && (
            <div className="px-5 py-6 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Add a habit goal to track daily</p>
            </div>
          )}
        </div>

        {/* Milestones (compact, below panel) */}
        {milestones.length > 0 && (
          <div className="mt-3 w-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-50 dark:border-zinc-800/60">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">Milestones</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
              {milestones.map(goal => {
                const current = goal.current ?? 0;
                const target  = goal.target  ?? 100;
                const pct     = Math.min(100, Math.round((current / target) * 100));
                return (
                  <div key={goal.id} className="group px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-[3px] h-3.5 rounded-full" style={{ backgroundColor: goal.color }} />
                        <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{goal.title}</p>
                      </div>
                      <button onClick={() => onRemove(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 dark:text-zinc-700 hover:text-zinc-500"><X size={11}/></button>
                    </div>
                    <div className="h-[2px] bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">{current} / {target} {goal.unit}</span>
                      <div className="flex gap-1">
                        <button onClick={() => onSetCurrent(goal.id, current - 1)} className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-bold flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">−</button>
                        <button onClick={() => onSetCurrent(goal.id, current + 1)} className="w-5 h-5 rounded-full text-white text-sm font-bold flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: goal.color }}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      {children}
    </button>
  );
}

function AddForm({ title, setTitle, color, setColor, type, setType, target, setTarget, unit, setUnit, onSave, onCancel }: {
  title: string; setTitle: (v: string) => void;
  color: string; setColor: (v: string) => void;
  type: 'habit' | 'milestone'; setType: (v: 'habit' | 'milestone') => void;
  target: string; setTarget: (v: string) => void;
  unit: string;   setUnit:   (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const inputCls = "flex-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700";
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        placeholder="Goal name…"
        className="w-full text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 bg-transparent outline-none" />

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 w-10 shrink-0">Color</span>
          <div className="flex gap-2">
            {PALETTE.map(c => (
              <button key={c} onClick={() => setColor(c)} className="w-4 h-4 rounded-full transition-transform duration-150"
                style={{ backgroundColor: c, transform: color === c ? 'scale(1.35)' : 'scale(1)', boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 w-10 shrink-0">Type</span>
          <div className="flex gap-1.5">
            {(['habit', 'milestone'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all capitalize',
                  type === t
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400'
                )}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {type === 'milestone' && (
        <div className="flex gap-2">
          <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target (e.g. 3)" type="number" className={inputCls} />
          <input value={unit}   onChange={e => setUnit(e.target.value)}   placeholder="Unit (e.g. kgs)"               className={inputCls} />
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
        <button onClick={onCancel} className="text-[13px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Cancel</button>
        <button onClick={onSave} disabled={!title.trim()}
          className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-30 transition-opacity"
          style={{ backgroundColor: color }}>
          Add
        </button>
      </div>
    </div>
  );
}
