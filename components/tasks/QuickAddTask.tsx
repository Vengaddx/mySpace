'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, Workstream, Project } from '@/types';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddTaskProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (task: Partial<Task>) => void;
  projects?: Project[];
  defaultWorkstream?: Workstream;
  defaultProjectId?: string;
  /** Pre-fill date + time from a timeline click (ISO string) */
  prefillDate?: string;
}

const PRIORITY_OPTS: { value: Priority; label: string; activeCls: string }[] = [
  { value: 'low',      label: 'Low',      activeCls: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900' },
  { value: 'medium',   label: 'Med',      activeCls: 'bg-accent-cyan/25 text-zinc-900 dark:text-zinc-50 ring-1 ring-accent-cyan/40' },
  { value: 'high',     label: 'High',     activeCls: 'bg-accent-lime/25 text-zinc-900 dark:text-zinc-50 ring-1 ring-accent-lime/40' },
  { value: 'critical', label: 'Critical', activeCls: 'bg-accent-orange/25 text-zinc-900 dark:text-zinc-50 ring-1 ring-accent-orange/40' },
];

const WORKSTREAM_OPTS: { value: Workstream; label: string }[] = [
  { value: 'aramco',   label: 'Aramco' },
  { value: 'satorp',   label: 'SATORP' },
  { value: 'pmo',      label: 'PMO' },
  { value: 'personal', label: 'Personal' },
];

function toLocalDateString(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toLocalTimeString(iso: string) {
  const d = new Date(iso);
  const h = d.getHours(); const m = d.getMinutes();
  if (h === 0 && m === 0) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function formatDisplayDate(dateStr: string) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function QuickAddTask({
  open, onClose, onAdd, projects = [], defaultWorkstream, defaultProjectId, prefillDate,
}: QuickAddTaskProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  const [title,      setTitle]      = useState('');
  const [workstream, setWorkstream] = useState<Workstream>(defaultWorkstream ?? 'aramco');
  const [priority,   setPriority]   = useState<Priority>('medium');
  const [dueDate,    setDueDate]    = useState('');
  const [time,       setTime]       = useState('');
  const [projectId,  setProjectId]  = useState('');
  const [showMore,   setShowMore]   = useState(false);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setWorkstream(defaultWorkstream ?? 'aramco');
      setProjectId(defaultProjectId ?? '');
      setTitle('');
      setPriority('medium');
      setShowMore(false);

      if (prefillDate) {
        setDueDate(toLocalDateString(prefillDate));
        setTime(toLocalTimeString(prefillDate));
      } else {
        setDueDate('');
        setTime('');
      }

      // Delay focus so animation doesn't fight autofocus
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [open, defaultWorkstream, defaultProjectId, prefillDate]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const workstreamProjects = projects.filter(p => p.workstream === workstream);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isUnscheduled = !dueDate && !time;
    const base = new Date();
    if (dueDate) {
      const [y, mo, d] = dueDate.split('-').map(Number);
      base.setFullYear(y, mo - 1, d);
    }
    if (time) {
      const [h, m] = time.split(':').map(Number);
      base.setHours(h, m, 0, 0);
    }

    onAdd?.({
      title: title.trim(),
      workstream,
      projectId: projectId || defaultProjectId || undefined,
      priority,
      category: workstream === 'personal' ? 'personal' : 'work',
      dueDate: base.toISOString(),
      isUnscheduled,
      status: 'todo',
      isWeekFocus: false,
      isMonthFocus: false,
      durationMinutes: time ? 60 : undefined,
    });
    setTitle('');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] z-[60]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[70] sm:w-[500px] w-full">
        <div
          className="bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl shadow-2xl dark:shadow-black/60 border border-zinc-100 dark:border-zinc-800"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>

          <form onSubmit={handleSubmit} className="px-5 pt-4 pb-1 space-y-4">
            {/* ── Title ──────────────────────────────────────────────── */}
            <input
              ref={titleRef}
              type="text"
              autoComplete="off"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-[15px] font-medium text-zinc-900 dark:text-zinc-50 bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            />

            {/* ── Inline meta row: Date · Time · Priority ─────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date chip */}
              <label className={cn(
                'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium cursor-pointer transition-colors',
                dueDate
                  ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 dark:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-600'
              )}>
                <Calendar size={11} className="shrink-0" />
                <span>{dueDate ? formatDisplayDate(dueDate) : 'Date'}</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>

              {/* Time chip */}
              <label className={cn(
                'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium cursor-pointer transition-colors',
                time
                  ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  : 'border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-400 dark:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-600'
              )}>
                <Clock size={11} className="shrink-0" />
                <span>{time || 'Time'}</span>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>

              {/* Priority pills */}
              <div className="flex items-center gap-1 ml-auto">
                {PRIORITY_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                      priority === opt.value
                        ? opt.activeCls
                        : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Workstream pills ────────────────────────────────────── */}
            <div className="flex items-center gap-1.5">
              {WORKSTREAM_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setWorkstream(opt.value); setProjectId(''); }}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                    workstream === opt.value
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}

              {/* Project (shown when workstream has projects) */}
              {workstreamProjects.length > 0 && (
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="ml-auto text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 outline-none hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors max-w-[140px]"
                >
                  <option value="">No project</option>
                  {workstreamProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

            {/* ── Actions ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-30 transition-all"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
