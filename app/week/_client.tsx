'use client';

import React, { useState } from 'react';
import { Task, Project } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { WeekCalendarView } from '@/components/tasks/WeekCalendarView';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CalendarDays } from 'lucide-react';

function api(url: string, method: string, body?: unknown) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch((e) => console.error(`[db] ${method} ${url}:`, e));
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

  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
    api(`/api/tasks/${updated.id}`, 'PUT', updated);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    api(`/api/tasks/${id}`, 'PUT', updates);
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
        tasks={tasks}
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
