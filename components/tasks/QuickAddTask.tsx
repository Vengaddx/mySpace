'use client';

import React, { useState, useEffect } from 'react';
import { Task, Priority, Workstream, Project, RecurrenceType } from '@/types';
import { X, Plus, Star, Zap, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddTaskProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (task: Partial<Task>) => void;
  projects?: Project[];
  defaultWorkstream?: Workstream;
  defaultProjectId?: string;
}

export function QuickAddTask({
  open,
  onClose,
  onAdd,
  projects = [],
  defaultWorkstream,
  defaultProjectId,
}: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const [workstream, setWorkstream] = useState<Workstream>(defaultWorkstream ?? 'aramco');
  const [priority, setPriority] = useState<Priority>('medium');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [isWeekFocus, setIsWeekFocus] = useState(false);
  const [isMonthFocus, setIsMonthFocus] = useState(false);

  // Sync defaults when dialog opens
  useEffect(() => {
    if (open) {
      setWorkstream(defaultWorkstream ?? 'aramco');
      setProjectId(defaultProjectId ?? '');
      setTitle('');
      setDueDate('');
      setStartTime('');
      setEndTime('');
      setRecurrence('none');
      setPriority('medium');
      setIsWeekFocus(false);
      setIsMonthFocus(false);
    }
  }, [open, defaultWorkstream, defaultProjectId]);

  // Projects filtered to current workstream
  const workstreamProjects = projects.filter((p) => p.workstream === workstream);

  // Reset project when workstream changes
  const handleWorkstreamChange = (ws: Workstream) => {
    setWorkstream(ws);
    setProjectId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isUnscheduled = !dueDate && !startTime;

    // Build dueDate with time
    const base = new Date();
    if (dueDate) {
      const [y, mo, d] = dueDate.split('-').map(Number);
      base.setFullYear(y, mo - 1, d);
    }
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number);
      base.setHours(h, m, 0, 0);
    }

    // Duration from start → end times
    let durationMinutes: number | undefined;
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) durationMinutes = diff;
    }

    onAdd?.({
      title: title.trim(),
      workstream,
      projectId: projectId || undefined,
      priority,
      category: workstream === 'personal' ? 'personal' : 'work',
      dueDate: base.toISOString(),
      isUnscheduled,
      status: 'todo',
      isWeekFocus,
      isMonthFocus,
      durationMinutes,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
    });
    setTitle('');
    setDueDate('');
    setStartTime('');
    setEndTime('');
    setRecurrence('none');
    onClose();
  };

  if (!open) return null;

  const selectCls =
    'w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-[500px] w-full">
        <div className="bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl shadow-2xl dark:shadow-black/60 border border-zinc-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Add Task</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <input
              autoFocus
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-colors"
            />

            {/* Workstream + Project row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Workstream
                </label>
                <select
                  value={workstream}
                  onChange={(e) => handleWorkstreamChange(e.target.value as Workstream)}
                  className={selectCls}
                >
                  <option value="aramco">Aramco</option>
                  <option value="satorp">SATORP</option>
                  <option value="pmo">PMO</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">No project</option>
                  {workstreamProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority + Due Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={selectCls}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                  Due Date
                  {!dueDate && !startTime && (
                    <span className="normal-case font-medium tracking-normal text-zinc-300 dark:text-zinc-600">· goes to Inbox</span>
                  )}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={selectCls}
                />
              </div>
            </div>

            {/* Time + Recurrence row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock size={10} />
                  Time
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // Auto-set end time to +1 hour if not already set
                      if (!endTime && e.target.value) {
                        const [h, m] = e.target.value.split(':').map(Number);
                        const end = new Date(); end.setHours(h + 1, m, 0, 0);
                        setEndTime(`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`);
                      }
                    }}
                    className={cn(selectCls, 'flex-1 min-w-0 px-2')}
                  />
                  <span className="text-[10px] text-zinc-400 shrink-0">–</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn(selectCls, 'flex-1 min-w-0 px-2')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <RefreshCw size={10} />
                  Repeat
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className={selectCls}
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekdays">Every weekday</option>
                  <option value="weekly">Every week</option>
                </select>
              </div>
            </div>

            {/* Focus toggles */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsWeekFocus(!isWeekFocus)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all flex-1 justify-center',
                  isWeekFocus
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                )}
              >
                <Star size={12} className={isWeekFocus ? 'fill-current' : ''} />
                Week Highlight
              </button>
              <button
                type="button"
                onClick={() => setIsMonthFocus(!isMonthFocus)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all flex-1 justify-center',
                  isMonthFocus
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                )}
              >
                <Zap size={12} className={isMonthFocus ? 'fill-current' : ''} />
                Month Focus
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
