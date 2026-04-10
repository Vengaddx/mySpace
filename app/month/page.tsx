'use client';

import React, { useState, useMemo } from 'react';
import { mockTasks, mockProjects, mockGoals } from '@/lib/mock-data';
import { Task, MonthlyGoal } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { MonthCalendarView } from '@/components/tasks/MonthCalendarView';
import { MonthlyGoalsPanel } from '@/components/tasks/MonthlyGoalsPanel';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CalendarRange } from 'lucide-react';

export default function MonthPage() {
  const [tasks, setTasks]   = useState<Task[]>(mockTasks);
  const [goals, setGoals]   = useState<MonthlyGoal[]>(mockGoals);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  // Track which month the calendar is showing so goals stay in sync.
  // Default to the current month.
  const now = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleSave = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarRange className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Calendar</p>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Month</h1>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Calendar — takes remaining space */}
          <div className="flex-1 min-w-0">
            <MonthCalendarView
              tasks={tasks}
              projects={mockProjects}
              onEditTask={handleEditTask}
              onMonthChange={setCalMonth}
            />
          </div>

          {/* Goals panel — fixed width sidebar */}
          <div className="w-72 shrink-0 sticky top-20">
            <MonthlyGoalsPanel
              goals={goals}
              month={calMonth}
              onChange={setGoals}
            />
          </div>
        </div>

        <TaskDrawer
          task={selectedTask}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSave}
          projects={mockProjects}
        />
      </PageContainer>
    </AppShell>
  );
}
