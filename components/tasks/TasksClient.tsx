'use client';

import React, { useState, useMemo } from 'react';
import { Task, Project, Priority, Status, Workstream } from '@/types';
import { cn, isOverdue, sortTasksLogically } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import { TaskDrawer } from '@/components/tasks/TaskDrawer';
import { QuickAddTask } from '@/components/tasks/QuickAddTask';
import { WorkstreamTabs } from '@/components/tasks/WorkstreamTabs';
import { TaskTable } from '@/components/tasks/TaskTable';
import { ProjectSideNav } from '@/components/tasks/ProjectSideNav';
import { TaskViewSwitcher, FocusView } from '@/components/tasks/TaskViewSwitcher';
import { MailView } from '@/components/tasks/MailView';
import { FollowUpView } from '@/components/tasks/FollowUpView';
import { WeekCalendarView } from '@/components/tasks/WeekCalendarView';
import { TodayView } from '@/components/tasks/TodayView';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';

function api(url: string, method: string, body?: unknown) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).catch((e) => console.error(`[db] ${method} ${url}:`, e));
}


interface TasksClientProps {
  initialTasks: Task[];
  initialProjects: Project[];
}

const WORKSTREAM_KEY_MAP: Record<string, Task['workstream'] | undefined> = {
  All: undefined,
  Aramco: 'aramco',
  SATORP: 'satorp',
  PMO: 'pmo',
  Personal: 'personal',
};

export function TasksClient({ initialTasks, initialProjects }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const [selectedWorkstream, setSelectedWorkstream] = useState('All');
  const [customTabs, setCustomTabs] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [taskView, setTaskView] = useState<FocusView>('tasks');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const workstreamKey = WORKSTREAM_KEY_MAP[selectedWorkstream] as Workstream | undefined;
  const isAllWorkstream = workstreamKey === undefined;

  const workstreamProjects = useMemo(() => {
    if (!workstreamKey) return [];
    return projects.filter((p) => p.workstream === workstreamKey);
  }, [projects, workstreamKey]);

  const workstreamTasks = useMemo(() => {
    if (!workstreamKey) return tasks;
    return tasks.filter((t) => t.workstream === workstreamKey);
  }, [tasks, workstreamKey]);

  // Shared filter base (all views): project + search + priority + status
  const filteredTasks = useMemo(() => {
    let result = workstreamTasks;
    if (selectedProjectId !== null) result = result.filter((t) => t.projectId === selectedProjectId);
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority);
    if (filterStatus !== 'all') result = result.filter((t) => t.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [workstreamTasks, selectedProjectId, filterPriority, filterStatus, search]);

  // Active list — excludes mail and follow-up (they have dedicated tabs)
  const tableTasks = useMemo(
    () => sortTasksLogically(filteredTasks.filter((t) => t.status !== 'send_mail' && t.status !== 'follow_up')),
    [filteredTasks]
  );

  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status, t.isUnscheduled)).length;
  const mailCount     = filteredTasks.filter((t) => t.status === 'send_mail').length;
  const followUpCount = filteredTasks.filter((t) => t.status === 'follow_up').length;
  const activeFilterCount = (filterPriority !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const selectedProject = selectedProjectId
    ? workstreamProjects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleWorkstreamChange = (tab: string) => {
    setSelectedWorkstream(tab);
    setSelectedProjectId(null);
    setSearch('');
    setFilterPriority('all');
    setFilterStatus('all');
    setFiltersOpen(false);
  };

  const handleAddProject = (name: string) => {
    if (!workstreamKey) return;
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      workstream: workstreamKey,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    api('/api/projects', 'POST', newProject);
  };

  const handleRenameProject = (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    api(`/api/projects/${id}`, 'PUT', { name });
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
    api(`/api/projects/${id}`, 'DELETE');
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
    api(`/api/tasks/${id}`, 'PUT', { status });
  };
  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) setDrawerOpen(false);
    api(`/api/tasks/${id}`, 'DELETE');
  };
  const handleToggleCritical = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: t.priority === 'critical' ? 'high' : 'critical' } : t
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task) api(`/api/tasks/${id}`, 'PUT', { priority: task.priority === 'critical' ? 'high' : 'critical' });
  };
  const handleToggleWeekFocus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isWeekFocus: !t.isWeekFocus, updatedAt: new Date().toISOString() } : t
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task) api(`/api/tasks/${id}`, 'PUT', { isWeekFocus: !task.isWeekFocus });
  };
  const handleToggleMonthFocus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isMonthFocus: !t.isMonthFocus, updatedAt: new Date().toISOString() } : t
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task) api(`/api/tasks/${id}`, 'PUT', { isMonthFocus: !task.isMonthFocus });
  };
  const handleSave = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    // Do NOT call setSelectedTask here — changing the task prop triggers TaskDrawer's
    // useEffect([task]) which resets notesData, wiping notes the user just saved.
    api(`/api/tasks/${updated.id}`, 'PUT', updated);
  };
  const handleAdd = (partial: Partial<Task>) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: partial.title || '',
      category: partial.category || 'work',
      workstream: partial.workstream || (workstreamKey ?? 'aramco'),
      projectId: partial.projectId,
      priority: partial.priority || 'medium',
      status: 'todo',
      dueDate: partial.dueDate || new Date().toISOString(),
      isUnscheduled: partial.isUnscheduled ?? false,
      isWeekFocus: false,
      isMonthFocus: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    api('/api/tasks', 'POST', newTask);
  };

  const openDrawer = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  // ── Panel heading ─────────────────────────────────────────────────────────────
  const panelTitle = isAllWorkstream
    ? 'All Tasks'
    : selectedProject
    ? selectedProject.name
    : `All ${selectedWorkstream} tasks`;

  const panelCount = tableTasks.length;

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Tasks</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            {openCount} open{overdueCount > 0 && ` · ${overdueCount} overdue`}
          </p>
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-semibold px-4 py-2 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      <>
      {/* ── Workstream Tabs ── */}
      <div className="mb-5">
        <WorkstreamTabs
          selected={selectedWorkstream}
          onSelect={handleWorkstreamChange}
          customTabs={customTabs}
          onAddTab={(name) => setCustomTabs((prev) => [...prev, name])}
          onRemoveTab={(name) => setCustomTabs((prev) => prev.filter((t) => t !== name))}
        />
      </div>

      {/* ── Split Layout ── */}
      <div className={cn('flex gap-5', !isAllWorkstream && 'items-start')}>

        {/* LEFT: Project Side Nav — only shown for a specific workstream */}
        {!isAllWorkstream && (
          <div className="hidden sm:flex flex-col w-48 lg:w-52 shrink-0">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-3 sticky top-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-2 mb-2">
                Projects
              </p>
              <ProjectSideNav
                projects={workstreamProjects}
                tasks={workstreamTasks}
                selectedProjectId={selectedProjectId}
                workstream={workstreamKey!}
                onSelect={(id) => {
                  setSelectedProjectId(id);
                  setSearch('');
                }}
                onAddProject={handleAddProject}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
              />
            </div>
          </div>
        )}

        {/* RIGHT: Task panel */}
        <div className="flex-1 min-w-0">
          {/* Panel header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {panelTitle}
              </h2>
              {taskView === 'tasks' && panelCount > 0 && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                  {panelCount} task{panelCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* View switcher + search + filter */}
            <div className="flex items-center gap-2">
              <TaskViewSwitcher view={taskView} onChange={setTaskView} mailCount={mailCount} followUpCount={followUpCount} />

              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors pl-8 pr-6 py-2 rounded-xl w-36 sm:w-44"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-colors shrink-0',
                  hasActiveFilters
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                )}
              >
                <SlidersHorizontal size={12} />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-4">
              <FilterSelect
                label="Priority"
                value={filterPriority}
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                onChange={(v) => setFilterPriority(v as Priority | 'all')}
              />
              <FilterSelect
                label="Status"
                value={filterStatus}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'done', label: 'Done' },
                  { value: 'follow_up', label: 'Follow Up' },
                  { value: 'send_mail', label: 'Send Mail' },
                ]}
                onChange={(v) => setFilterStatus(v as Status | 'all')}
              />
            </div>
          )}

          {/* Mobile project chips (when a specific workstream selected) */}
          {!isAllWorkstream && (
            <div className="sm:hidden flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
              <button
                onClick={() => setSelectedProjectId(null)}
                className={cn(
                  'shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-xl border transition-colors',
                  selectedProjectId === null
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                )}
              >
                All
              </button>
              {workstreamProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={cn(
                    'shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-xl border transition-colors whitespace-nowrap',
                    selectedProjectId === p.id
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                      : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Main content area */}
          {taskView === 'tasks' && (
            tableTasks.length === 0 ? (
              <EmptyPanel
                message={
                  search
                    ? `No tasks matching "${search}"`
                    : selectedProject
                    ? `No open tasks in ${selectedProject.name}`
                    : 'No tasks here yet'
                }
                onAdd={() => setQuickAddOpen(true)}
              />
            ) : (
              <TaskTable
                tasks={tableTasks}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onToggleCritical={handleToggleCritical}
                onToggleWeekFocus={handleToggleWeekFocus}
                onToggleMonthFocus={handleToggleMonthFocus}
                onEdit={openDrawer}
              />
            )
          )}

          {taskView === 'week' && (
            <WeekCalendarView
              tasks={filteredTasks.filter((t) => !t.isUnscheduled && t.status !== 'send_mail' && t.status !== 'follow_up' && !isOverdue(t.dueDate, t.status, t.isUnscheduled))}
              projects={projects}
              onEditTask={openDrawer}
              onUpdateTask={(id, updates) => {
                setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
                api(`/api/tasks/${id}`, 'PUT', updates);
              }}
              unscheduledTasks={filteredTasks.filter(t =>
                t.status !== 'done' && t.status !== 'send_mail' && t.status !== 'follow_up' &&
                ((t.isUnscheduled ?? false) || isOverdue(t.dueDate, t.status, t.isUnscheduled))
              )}
            />
          )}

          {taskView === 'today' && (
            <TodayView
              tasks={filteredTasks.filter((t) => t.status !== 'send_mail' && t.status !== 'follow_up')}
              projects={projects}
              onEditTask={openDrawer}
              onUpdateTask={(id, updates) => {
                setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
                api(`/api/tasks/${id}`, 'PUT', updates);
              }}
            />
          )}

          {taskView === 'follow_up' && (
            <FollowUpView
              tasks={filteredTasks}
              projects={projects}
              onMarkDone={(id) => handleStatusChange(id, 'done')}
              onEdit={openDrawer}
              onAddTask={() => setQuickAddOpen(true)}
            />
          )}

          {taskView === 'mail' && (
            <MailView
              tasks={filteredTasks}
              projects={projects}
              onMarkSent={(id) => handleStatusChange(id, 'done')}
              onEdit={openDrawer}
              onAddMailTask={() => setQuickAddOpen(true)}
            />
          )}

        </div>
      </div>
      </>

      {/* ── Drawers & Modals ── */}
      <TaskDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        projects={projects}
      />
      <QuickAddTask
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAdd={handleAdd}
        projects={projects}
        defaultWorkstream={workstreamKey}
        defaultProjectId={selectedProjectId ?? undefined}
      />
    </PageContainer>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyPanel({ message, onAdd }: { message: string; onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 px-6 py-12 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-zinc-400 dark:text-zinc-500">{message}</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <Plus size={12} />
        New Task
      </button>
    </div>
  );
}

// ── Filter select ──────────────────────────────────────────────────────────────

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
