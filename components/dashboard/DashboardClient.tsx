'use client';

import React, { useState, useMemo, useId } from 'react';
import { Task } from '@/types';
import { cn, isToday } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardClientProps {
  tasks: Task[];
}

// Brand accent colors
const WORKSTREAMS = [
  { key: 'aramco',   label: 'Aramco',   color: '#F2296B', track: 'rgba(242,41,107,0.20)'  },
  { key: 'satorp',   label: 'SATORP',   color: '#00C1FF', track: 'rgba(0,193,255,0.18)'   },
  { key: 'pmo',      label: 'PMO',      color: '#AEDD00', track: 'rgba(174,221,0,0.20)'   },
  { key: 'personal', label: 'Personal', color: '#C0C0C0', track: 'rgba(192,192,192,0.15)' },
] as const;

const DAY_LABELS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getProgress(tasks: Task[], workstream: string, day: Date): number {
  const dayTasks = tasks.filter(t => t.workstream === workstream && isSameDay(new Date(t.dueDate), day));
  if (dayTasks.length === 0) return 0;
  return dayTasks.filter(t => t.status === 'done').length / dayTasks.length;
}

function hasTasks(tasks: Task[], day: Date): boolean {
  return tasks.some(t => isSameDay(new Date(t.dueDate), day));
}

// ── Premium Activity Rings ────────────────────────────────────────────────────
function ActivityRings({ progresses, size }: { progresses: number[]; size: number }) {
  const uid = useId().replace(/:/g, '');   // unique per instance, colon-safe
  const sw      = size * 0.09;             // stroke width
  const gap     = size * 0.03;             // gap between rings
  const center  = size / 2;
  const outerR  = center - sw / 2 - size * 0.01;
  const radii   = WORKSTREAMS.map((_, i) => outerR - i * (sw + gap));
  const glurRad = sw * 0.55;              // glow blur radius

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Per-ring colored glow filters */}
        {WORKSTREAMS.map((ws, i) => (
          <filter
            key={i}
            id={`${uid}glow${i}`}
            x="-50%" y="-50%" width="200%" height="200%"
            colorInterpolationFilters="sRGB"
          >
            {/* Blur the shape */}
            <feGaussianBlur in="SourceAlpha" stdDeviation={glurRad} result="blur" />
            {/* Flood with ring color */}
            <feFlood floodColor={ws.color} floodOpacity="0.7" result="color" />
            {/* Clip color to blurred shape */}
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            {/* Merge glow behind original */}
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}

        {/* Tip drop-shadow filter (simulates ring raising above track) */}
        <filter id={`${uid}tip`} x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow
            dx="0" dy={sw * 0.28}
            stdDeviation={sw * 0.35}
            floodColor="rgba(0,0,0,0.55)"
          />
        </filter>
      </defs>

      {WORKSTREAMS.map((ws, i) => {
        const r = radii[i];
        if (r <= 0) return null;

        const circ    = 2 * Math.PI * r;
        const progress = Math.min(progresses[i] ?? 0, 1);
        const offset  = circ * (1 - progress);

        // Position of the progress-arc tip in SVG coordinate space
        // (SVG circles start at 3 o'clock = angle 0, clockwise)
        const tipAngle = progress * 2 * Math.PI;
        const tipX = center + r * Math.cos(tipAngle);
        const tipY = center + r * Math.sin(tipAngle);

        return (
          <g key={ws.key}>
            {/* Background track — dark tinted ring */}
            <circle
              cx={center} cy={center} r={r}
              fill="none"
              stroke={ws.track}
              strokeWidth={sw}
            />

            {progress > 0 && (
              <>
                {/* Progress arc with colored glow */}
                <circle
                  cx={center} cy={center} r={r}
                  fill="none"
                  stroke={ws.color}
                  strokeWidth={sw}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  filter={`url(#${uid}glow${i})`}
                />

                {/* Tip cap circle — creates the 3-D raised-end shadow */}
                {progress > 0.03 && progress < 0.98 && (
                  <circle
                    cx={tipX} cy={tipY}
                    r={sw / 2}
                    fill={ws.color}
                    filter={`url(#${uid}tip)`}
                  />
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const grid: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) grid.push(cells.slice(i, i + 7));
  return grid;
}

export function DashboardClient({ tasks }: DashboardClientProps) {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date>(now);

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goForward = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedDayTasks = useMemo(() =>
    tasks.filter(t => isSameDay(new Date(t.dueDate), selectedDay)),
    [tasks, selectedDay]
  );

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthTasks = useMemo(() =>
    tasks.filter(t => {
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    }), [tasks, year, month]);

  const monthDone = monthTasks.filter(t => t.status === 'done').length;

  return (
    <div className="flex gap-6 items-start">

      {/* ── Calendar ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 min-w-[150px] text-center" style={{ letterSpacing: '-0.02em' }}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={goForward} className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight size={14} />
            </button>
            {!isCurrentMonth && (
              <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-1">
                Today
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{monthDone}</span> / {monthTasks.length} completed
          </span>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm">
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((week, wi) => (
            <div key={wi} className={cn('grid grid-cols-7', wi < grid.length - 1 && 'border-b border-zinc-100 dark:border-zinc-800/60')}>
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className={cn('min-h-[100px]', di < 6 && 'border-r border-zinc-100 dark:border-zinc-800/60')} />;
                }

                const todayFlag  = isToday(day.toISOString());
                const isSelected = isSameDay(day, selectedDay);
                const hasActivity = hasTasks(tasks, day);
                const progresses = WORKSTREAMS.map(ws => getProgress(tasks, ws.key, day));

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'min-h-[100px] p-2 flex flex-col items-center gap-1.5 transition-all',
                      di < 6 && 'border-r border-zinc-100 dark:border-zinc-800/60',
                      isSelected
                        ? 'bg-zinc-100/90 dark:bg-zinc-800/60'
                        : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      todayFlag
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                        : isSelected
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-400 dark:text-zinc-500'
                    )}>
                      {day.getDate()}
                    </span>

                    {hasActivity ? (
                      <ActivityRings progresses={progresses} size={58} />
                    ) : (
                      <div className="flex-1" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 flex-wrap">
          {WORKSTREAMS.map(ws => (
            <div key={ws.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ws.color }} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{ws.label}</span>
            </div>
          ))}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">· fill = % tasks completed</span>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 sticky top-20">

        <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">

          {/* Date + rings */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-0.5">
              {selectedDay.toLocaleDateString('en-GB', { weekday: 'long' })}
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6" style={{ letterSpacing: '-0.03em' }}>
              {selectedDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="flex justify-center mb-6">
              <ActivityRings
                progresses={WORKSTREAMS.map(ws => getProgress(tasks, ws.key, selectedDay))}
                size={148}
              />
            </div>

            {/* Progress rows */}
            <div className="space-y-3">
              {WORKSTREAMS.map(ws => {
                const dayTasks = selectedDayTasks.filter(t => t.workstream === ws.key);
                const done     = dayTasks.filter(t => t.status === 'done').length;
                const progress = dayTasks.length > 0 ? done / dayTasks.length : 0;
                return (
                  <div key={ws.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{ws.label}</span>
                      <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                        {dayTasks.length === 0 ? '—' : `${done} / ${dayTasks.length}`}
                      </span>
                    </div>
                    <div className="h-[2px] rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress * 100}%`, background: ws.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task list */}
          {selectedDayTasks.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800/80">
              {WORKSTREAMS.map((ws, wi) => {
                const wsTasks = selectedDayTasks.filter(t => t.workstream === ws.key);
                if (wsTasks.length === 0) return null;
                return (
                  <div
                    key={ws.key}
                    className={cn('px-5 py-3.5', wi > 0 && 'border-t border-zinc-100 dark:border-zinc-800/60')}
                  >
                    <p
                      className="text-[9px] font-bold uppercase tracking-[0.14em] mb-2.5"
                      style={{ color: ws.color }}
                    >
                      {ws.label}
                    </p>
                    <div className="space-y-2">
                      {wsTasks.map(t => (
                        <p
                          key={t.id}
                          className={cn(
                            'text-[12px] leading-snug pl-3 border-l-[2px]',
                            t.status === 'done'
                              ? 'line-through text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
                              : 'text-zinc-700 dark:text-zinc-200'
                          )}
                          style={t.status !== 'done' ? { borderColor: ws.color } : undefined}
                        >
                          {t.title}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedDayTasks.length === 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-5 py-6 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">No tasks for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
