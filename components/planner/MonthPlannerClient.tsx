'use client';

import React, { useState } from 'react';
import { Task, MonthlyFocus } from '@/types';
import { getCurrentMonthYear, formatDateShort } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkstreamBadge, PriorityBadge } from '@/components/ui/Badge';
import { CalendarRange, Target, AlertTriangle, Briefcase, User, Pin, Calendar } from 'lucide-react';

interface MonthPlannerClientProps {
  initialTasks: Task[];
  initialFocus: MonthlyFocus;
}

export function MonthPlannerClient({ initialTasks, initialFocus }: MonthPlannerClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [focus, setFocus] = useState<MonthlyFocus>(initialFocus);
  const [editing, setEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectingTask, setSelectingTask] = useState(false);

  const monthTasks = tasks.filter((t) => t.isMonthFocus && t.status !== 'done');
  const upcomingDeadlines = tasks.filter((t) => t.status !== 'done').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 6);
  const availableTasks = tasks.filter((t) => !t.isMonthFocus && t.status !== 'done');

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };
  const handleDelete = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const handleToggleCritical = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, priority: t.priority === 'critical' ? 'high' : 'critical' } : t));
  };
  const handlePinToMonth = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isMonthFocus: !t.isMonthFocus } : t));
  };
  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
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
            <CalendarRange className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getCurrentMonthYear()}</p>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Month Planner</h1>
        </div>
      </div>

      {/* Monthly Focus Board */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Monthly Focus</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Edit</button>
          ) : (
            <button onClick={() => setEditing(false)} className="text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white px-3 py-1 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors">Save</button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FocusField icon={<Target className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Focus Areas" value={focus.focusAreas} editing={editing} textareaCls={textareaCls} onChange={(v) => setFocus({ ...focus, focusAreas: v })} />
          <FocusField icon={<Briefcase className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Major Commitments" value={focus.majorCommitments} editing={editing} textareaCls={textareaCls} onChange={(v) => setFocus({ ...focus, majorCommitments: v })} />
          <FocusField icon={<AlertTriangle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Risks / Things to Watch" value={focus.risks} editing={editing} textareaCls={textareaCls} onChange={(v) => setFocus({ ...focus, risks: v })} />
          <FocusField icon={<User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />} label="Personal Goals" value={focus.personalGoals} editing={editing} textareaCls={textareaCls} onChange={(v) => setFocus({ ...focus, personalGoals: v })} />
        </div>
      </div>

      {/* Month Tasks */}
      <div className="mb-8">
        <SectionHeader
          title="Key Tasks This Month"
          subtitle={`${monthTasks.length} tasks selected`}
          action={
            <button onClick={() => setSelectingTask(!selectingTask)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
              <Pin className="w-3 h-3" />Pin Task
            </button>
          }
        />
        {monthTasks.length === 0 ? (
          <EmptyState title="No tasks pinned for this month" description="Pin important tasks to keep them visible throughout the month." />
        ) : (
          <div className="space-y-2">{monthTasks.map((t) => <TaskCard key={t.id} {...taskCardProps(t)} />)}</div>
        )}
      </div>

      {/* Deadlines timeline */}
      <div className="mb-8">
        <SectionHeader title="Upcoming Deadlines" subtitle="Next items by due date" />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {upcomingDeadlines.length === 0 ? (
            <EmptyState title="No upcoming deadlines" />
          ) : (
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {upcomingDeadlines.map((task) => (
                <button
                  key={task.id}
                  onClick={() => { setSelectedTask(task); setDrawerOpen(true); }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="w-10 text-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 mx-auto mb-0.5" />
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block">{formatDateShort(task.dueDate)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <WorkstreamBadge workstream={task.workstream} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task selection panel */}
      {selectingTask && (
        <div className="mb-8">
          <SectionHeader title="Available Tasks" subtitle="Select tasks to pin to this month"
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
                    onClick={() => handlePinToMonth(task.id)}
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

function FocusField({ icon, label, value, editing, textareaCls, onChange }: {
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
