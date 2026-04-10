'use client';

import React, { useState, useMemo } from 'react';
import { Task, Project, MonthlyGoal } from '@/types';
import { PageContainer } from '@/components/layout/PageContainer';
import { MonthCalendarView } from '@/components/tasks/MonthCalendarView';
import { MonthlyGoalsPanel } from '@/components/tasks/MonthlyGoalsPanel';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { CalendarRange } from 'lucide-react';

function api(url: string, method: string, body?: unknown) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch((e) => console.error(`[db] ${method} ${url}:`, e));
}

interface MonthPageClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
  initialGoals: MonthlyGoal[];
}

export default function MonthPageClient({ initialTasks, initialProjects, initialGoals }: MonthPageClientProps) {
  const [tasks, setTasks]   = useState<Task[]>(initialTasks);
  const [goals, setGoals]   = useState<MonthlyGoal[]>(initialGoals);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  const now = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const handleEditTask = (task: Task) => { setSelectedTask(task); setDrawerOpen(true); };

  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    api(`/api/tasks/${updated.id}`, 'PUT', updated);
  };

  const handleGoalsChange = (updated: MonthlyGoal[]) => {
    setGoals(updated);
    updated.forEach((g) => {
      const prev = goals.find((og) => og.id === g.id);
      if (prev && prev.progress !== g.progress) {
        api(`/api/monthly-goals/${g.id}`, 'PUT', { progress: g.progress });
      }
    });
  };

  return (
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
        <div className="flex-1 min-w-0">
          <MonthCalendarView
            tasks={tasks}
            projects={initialProjects}
            onEditTask={handleEditTask}
            onMonthChange={setCalMonth}
          />
        </div>
        <div className="w-72 shrink-0 sticky top-20">
          <MonthlyGoalsPanel
            goals={goals}
            month={calMonth}
            onChange={handleGoalsChange}
          />
        </div>
      </div>

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
