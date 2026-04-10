'use client';

import React, { useState } from 'react';
import { mockTasks, mockProjects } from '@/lib/mock-data';
import { Task } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { WeekCalendarView } from '@/components/tasks/WeekCalendarView';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CalendarDays } from 'lucide-react';

export default function WeekPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
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
          projects={mockProjects}
          onEditTask={handleEditTask}
          onUpdateTask={(id, updates) =>
            setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
          }
        />

        <TaskDrawer
          task={selectedTask}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSave}
          projects={mockProjects}
        />
      </PageContainer>
  );
}
