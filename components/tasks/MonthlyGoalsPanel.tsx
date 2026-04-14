'use client';

import React, { useState } from 'react';
import { MonthlyGoal, Workstream } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, X, Check } from 'lucide-react';

// ── Workstream config ──────────────────────────────────────────────────────
const WORKSTREAM_META: Record<Workstream, { label: string; color: string }> = {
  aramco:   { label: 'Aramco',   color: '#F2296B' },
  satorp:   { label: 'SATORP',   color: '#00C1FF' },
  pmo:      { label: 'PMO',      color: '#AEDD00' },
  personal: { label: 'Personal', color: '#F2296B' },
};

const WORKSTREAMS = Object.keys(WORKSTREAM_META) as Workstream[];

// Progress snaps: click cycles 0 → 25 → 50 → 75 → 100 → 0
const SNAPS = [0, 25, 50, 75, 100];

interface MonthlyGoalsPanelProps {
  goals: MonthlyGoal[];
  month: string; // YYYY-MM
  onChange: (goals: MonthlyGoal[]) => void;
}

export function MonthlyGoalsPanel({ goals, month, onChange }: MonthlyGoalsPanelProps) {
  const [adding, setAdding]   = useState(false);
  const [title, setTitle]     = useState('');
  const [ws, setWs]           = useState<Workstream>('aramco');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const monthGoals = goals.filter(g => g.month === month);

  // ── Mutations ──────────────────────────────────────────────────────────────
  function addGoal() {
    if (!title.trim()) return;
    const goal: MonthlyGoal = {
      id:          `g-${Date.now()}`,
      month,
      title:       title.trim(),
      workstream:  ws,
      progress:    0,
      createdAt:   new Date().toISOString(),
    };
    onChange([...goals, goal]);
    setTitle(''); setAdding(false);
  }

  function cycleProgress(id: string) {
    onChange(goals.map(g => {
      if (g.id !== id) return g;
      const nextIdx = (SNAPS.indexOf(g.progress) + 1) % SNAPS.length;
      return { ...g, progress: SNAPS[nextIdx] };
    }));
  }

  function deleteGoal(id: string) {
    onChange(goals.filter(g => g.id !== id));
  }

  function saveEdit(id: string) {
    if (!editTitle.trim()) { setEditingId(null); return; }
    onChange(goals.map(g => g.id === id ? { ...g, title: editTitle.trim() } : g));
    setEditingId(null);
  }

  // ── Month label ────────────────────────────────────────────────────────────
  const [yr, mo] = month.split('-').map(Number);
  const monthLabel = new Date(yr, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const done  = monthGoals.filter(g => g.progress === 100).length;
  const total = monthGoals.length;
  const overallPct = total === 0 ? 0 : Math.round(monthGoals.reduce((s, g) => s + g.progress, 0) / total);

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            {monthLabel}
          </p>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-0.5">
            Monthly Goals
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-[11px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
              {done}/{total} done · {overallPct}%
            </span>
          )}
          <button
            onClick={() => { setAdding(true); setTitle(''); setWs('aramco'); }}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 space-y-2.5 bg-zinc-50/60 dark:bg-zinc-900/40">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGoal(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Goal title…"
            className="w-full text-sm text-zinc-900 dark:text-zinc-100 bg-transparent placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none"
          />
          <div className="flex items-center justify-between">
            {/* Workstream selector */}
            <div className="flex items-center gap-1.5">
              {WORKSTREAMS.map(w => (
                <button
                  key={w}
                  onClick={() => setWs(w)}
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all',
                    ws === w
                      ? 'text-zinc-900 dark:text-zinc-950'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                  )}
                  style={ws === w ? { backgroundColor: WORKSTREAM_META[w].color } : undefined}
                >
                  {WORKSTREAM_META[w].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdding(false)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                disabled={!title.trim()}
                className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 disabled:opacity-30 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal list */}
      {monthGoals.length === 0 && !adding ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No goals for this month yet</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {monthGoals.map(goal => {
            const meta    = WORKSTREAM_META[goal.workstream];
            const isDone  = goal.progress === 100;

            return (
              <div
                key={goal.id}
                className="group flex items-center gap-3 px-5 py-3.5"
              >
                {/* Left accent bar */}
                <div
                  className="w-[3px] self-stretch rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === goal.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(goal.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(goal.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="w-full text-sm text-zinc-900 dark:text-zinc-100 bg-transparent outline-none"
                    />
                  ) : (
                    <p
                      onDoubleClick={() => { setEditingId(goal.id); setEditTitle(goal.title); }}
                      className={cn(
                        'text-sm leading-snug cursor-default select-none',
                        isDone
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-800 dark:text-zinc-100'
                      )}
                    >
                      {goal.title}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-2">
                    {/* Segmented bar — 5 segments */}
                    <button
                      onClick={() => cycleProgress(goal.id)}
                      title={`${goal.progress}% — click to advance`}
                      className="flex items-center gap-[3px] flex-1"
                    >
                      {SNAPS.slice(0, -1).map((snap, i) => (
                        <div
                          key={i}
                          className={cn('flex-1 h-[3px] rounded-full transition-all duration-300',
                            goal.progress <= snap && 'bg-zinc-100 dark:bg-zinc-800'
                          )}
                          style={goal.progress > snap ? { backgroundColor: meta.color } : undefined}
                        />
                      ))}
                    </button>
                    <span
                      className="text-[10px] font-semibold tabular-nums w-8 text-right shrink-0"
                      style={{ color: isDone ? meta.color : undefined }}
                    >
                      {isDone
                        ? <Check size={12} className="inline" style={{ color: meta.color }} />
                        : `${goal.progress}%`
                      }
                    </span>
                  </div>

                  {/* Workstream label */}
                  <p className="text-[9px] font-semibold uppercase tracking-wider mt-1" style={{ color: meta.color, opacity: 0.7 }}>
                    {meta.label}
                  </p>
                </div>

                {/* Delete — visible on hover */}
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
