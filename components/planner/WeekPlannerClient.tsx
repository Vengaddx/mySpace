'use client';

import React, { useState } from 'react';

function api(url: string, method: string, body?: unknown) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch((e) => console.error(`[db] ${method} ${url}:`, e));
}
import { Task, WeeklyIntent } from '@/types';
import { isOverdue, getCurrentWeekRange } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarDays, ChevronDown, Clock, Star, Pin, Plus } from 'lucide-react';

interface WeekPlannerClientProps {
  initialTasks: Task[];
  initialIntent: WeeklyIntent;
}

export function WeekPlannerClient({ initialTasks, initialIntent }: WeekPlannerClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [intent, setIntent] = useState<WeeklyIntent>(initialIntent);
  const [intentEditing, setIntentEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectingTask, setSelectingTask] = useState(false);

  const weekTasks = tasks.filter((t) => t.isWeekFocus && t.status !== 'done');
  const mustCloseTasks = tasks.filter((t) => t.isWeekFocus && t.priority === 'critical' && t.status !== 'done');
  const followUpTasks = tasks.filter((t) => t.isWeekFocus && isOverdue(t.dueDate, t.status));
  const personalWeekTasks = tasks.filter((t) => t.isWeekFocus && t.category === 'personal' && t.status !== 'done');
  const availableTasks = tasks.filter((t) => !t.isWeekFocus && t.status !== 'done');

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    api(`/api/tasks/${id}`, 'PUT', { status });
  };
  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api(`/api/tasks/${id}`, 'DELETE');
  };
  const handleToggleCritical = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const priority = task?.priority === 'critical' ? 'high' : 'critical';
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, priority } : t));
    api(`/api/tasks/${id}`, 'PUT', { priority });
  };
  const handlePinToWeek = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const isWeekFocus = !task?.isWeekFocus;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isWeekFocus } : t));
    api(`/api/tasks/${id}`, 'PUT', { isWeekFocus });
  };
  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    api(`/api/tasks/${updated.id}`, 'PUT', updated);
  };

  const taskCardProps = (task: Task) => ({
    task,
    onEdit: (t: Task) => { setSelectedTask(t); setDrawerOpen(true); },
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    onToggleCritical: handleToggleCritical,
    onClick: (t: Task) => { setSelectedTask(t); setDrawerOpen(true); },
  });

  const textareaCls = "w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 resize-none transition-colors leading-relaxed";

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getCurrentWeekRange()}</p>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Week Planner</h1>
        </div>
      </div>

      {/* Weekly Intent */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Weekly Intent</h2>
          {!intentEditing ? (
            <button onClick={() => setIntentEditing(true)} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Edit</button>
          ) : (
            <button onClick={() => setIntentEditing(false)} className="text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white px-3 py-1 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors">Save</button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <IntentField icon={<Star className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Key Objectives" value={intent.objectives} editing={intentEditing} textareaCls={textareaCls} onChange={(v) => setIntent({ ...intent, objectives: v })} />
          <IntentField icon={<ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Must Get Done" value={intent.mustGetDone} editing={intentEditing} textareaCls={textareaCls} onChange={(v) => setIntent({ ...intent, mustGetDone: v })} />
          <IntentField icon={<Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Watch Outs" value={intent.watchouts} editing={intentEditing} textareaCls={textareaCls} onChange={(v) => setIntent({ ...intent, watchouts: v })} />
        </div>
      </div>

      {/* Top Priorities */}
      <div className="mb-8">
        <SectionHeader
          title="Top Priorities This Week"
          subtitle={`${weekTasks.length} tasks pinned`}
          action={
            <button onClick={() => setSelectingTask(!selectingTask)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
              <Pin className="w-3 h-3" />Pin Task
            </button>
          }
        />
        {weekTasks.length === 0 ? (
          <EmptyState title="No tasks pinned for this week" description="Pin tasks from your task list to build your weekly focus."
            action={
              <button onClick={() => setSelectingTask(true)} className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <Plus className="w-3.5 h-3.5" />Pin a Task
              </button>
            }
          />
        ) : (
          <div className="space-y-2">{weekTasks.slice(0, 5).map((t) => <TaskCard key={t.id} {...taskCardProps(t)} />)}</div>
        )}
      </div>

      {/* Must Close */}
      {mustCloseTasks.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Must Close This Week" subtitle="Critical items requiring closure" />
          <div className="space-y-2">{mustCloseTasks.map((t) => <TaskCard key={t.id} {...taskCardProps(t)} />)}</div>
        </div>
      )}

      {/* Follow-up */}
      {followUpTasks.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Follow-up / Waiting" subtitle="Overdue items needing attention" />
          <div className="space-y-2">{followUpTasks.map((t) => <TaskCard key={t.id} {...taskCardProps(t)} />)}</div>
        </div>
      )}

      {/* Personal */}
      <div className="mb-8">
        <SectionHeader title="Personal This Week" />
        {personalWeekTasks.length === 0 ? (
          <EmptyState title="No personal tasks this week" description="Pin personal tasks to your week plan." />
        ) : (
          <div className="space-y-2">{personalWeekTasks.map((t) => <TaskCard key={t.id} {...taskCardProps(t)} compact />)}</div>
        )}
      </div>

      {/* Task selection panel */}
      {selectingTask && (
        <div className="mb-8">
          <SectionHeader title="Available Tasks" subtitle="Select tasks to pin to this week"
            action={<button onClick={() => setSelectingTask(false)} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Done</button>}
          />
          {availableTasks.length === 0 ? (
            <EmptyState title="All tasks are already pinned" />
          ) : (
            <div className="space-y-2">
              {availableTasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskCard task={task} compact />
                  <button
                    onClick={() => handlePinToWeek(task.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                  >
                    <Pin className="w-3 h-3" />Pin
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TaskDrawer task={selectedTask} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSave={handleSave} />
    </PageContainer>
  );
}

function IntentField({ icon, label, value, editing, textareaCls, onChange }: {
  icon: React.ReactNode; label: string; value: string;
  editing: boolean; textareaCls: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
      </div>
      {editing ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={textareaCls} />
      ) : (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">{value}</p>
      )}
    </div>
  );
}
