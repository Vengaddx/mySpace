'use client';

import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { WeekCalendarView } from '@/components/tasks/WeekCalendarView';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CalendarDays } from 'lucide-react';

async function api(url: string, method: string, body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`[db] ${method} ${url} → ${res.status}: ${err}`);
  }
}

interface WeekPageClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
}

export default function WeekPageClient({ initialTasks, initialProjects }: WeekPageClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleSave = async (updated: Task) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
    try {
      await api(`/api/tasks/${updated.id}`, 'PUT', updated);
    } catch (e) {
      console.error(e);
      setTasks(prev);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    try {
      await api(`/api/tasks/${id}`, 'PUT', updates);
    } catch (e) {
      console.error(e);
      setTasks(prev);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Calendar</p>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Week</h1>
        </div>
      </div>

      <WeekCalendarView
        tasks={tasks.filter(t => !t.isUnscheduled)}
        unscheduledTasks={tasks.filter(t => t.isUnscheduled && t.status !== 'done')}
        projects={initialProjects}
        onEditTask={handleEditTask}
        onUpdateTask={handleUpdateTask}
      />

      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        projects={initialProjects}
      />
    </PageContainer>
  );
}
