import { Project, Task, Workstream } from '@/types';
import { isOverdue, workstreamLabel } from '@/lib/utils';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface WorkstreamAnalytics {
  workstream: Workstream;
  label: string;
  color: string;
  total: number;
  completed: number;
  open: number;
  overdue: number;
  rate: number;
}

export interface SummaryMetric {
  label: string;
  value: number | string;
  detail: string;
  accent?: 'default' | 'critical' | 'positive';
}

export const WORKSTREAM_ORDER: Workstream[] = ['aramco', 'satorp', 'pmo', 'personal'];

export const WORKSTREAM_COLORS: Record<Workstream, string> = {
  aramco: '#ff4d6d',
  satorp: '#34d17b',
  pmo: '#d7ea4f',
  personal: '#37cfff',
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
}

function endOfWeek(date: Date) {
  const next = endOfDay(startOfWeek(date));
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getDashboardRange(period: DashboardPeriod, now = new Date()): DateRange {
  if (period === 'today') {
    return { start: startOfDay(now), end: endOfDay(now) };
  }

  if (period === 'week') {
    return { start: startOfWeek(now), end: endOfWeek(now) };
  }

  return { start: startOfMonth(now), end: endOfMonth(now) };
}

export function isWithinRange(iso: string, range: DateRange) {
  const date = new Date(iso);
  return date >= range.start && date <= range.end;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getCompletionDate(task: Task) {
  return task.completionDate ?? (task.status === 'done' ? task.updatedAt : undefined);
}

export function getWorkstreamAnalytics(tasks: Task[]): WorkstreamAnalytics[] {
  return WORKSTREAM_ORDER.map((workstream) => {
    const workstreamTasks = tasks.filter((task) => task.workstream === workstream);
    const completed = workstreamTasks.filter((task) => task.status === 'done').length;
    const overdue = workstreamTasks.filter((task) => isOverdue(task.dueDate, task.status)).length;
    const total = workstreamTasks.length;
    const open = total - completed;

    return {
      workstream,
      label: workstreamLabel(workstream),
      color: WORKSTREAM_COLORS[workstream],
      total,
      completed,
      open,
      overdue,
      rate: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}

export function getSummaryMetrics(tasks: Task[]): SummaryMetric[] {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'done').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const overdue = tasks.filter((task) => isOverdue(task.dueDate, task.status)).length;
  const criticalOpen = tasks.filter(
    (task) => task.priority === 'critical' && task.status !== 'done'
  ).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return [
    {
      label: 'Total planned',
      value: total,
      detail: 'Tasks scheduled in this view',
    },
    {
      label: 'Completed',
      value: completed,
      detail: `${Math.max(total - completed, 0)} still open`,
      accent: 'positive',
    },
    {
      label: 'In progress',
      value: inProgress,
      detail: 'Active execution right now',
    },
    {
      label: 'Overdue',
      value: overdue,
      detail: 'Needs catch-up attention',
      accent: overdue > 0 ? 'critical' : 'default',
    },
    {
      label: 'Critical open',
      value: criticalOpen,
      detail: 'Priority items not closed',
      accent: criticalOpen > 0 ? 'critical' : 'default',
    },
    {
      label: 'Completion rate',
      value: `${completionRate}%`,
      detail: 'Closed versus planned',
      accent: completionRate >= 70 ? 'positive' : 'default',
    },
  ];
}

export function getProjectLoad(tasks: Task[], projects: Project[]) {
  return projects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const open = projectTasks.filter((task) => task.status !== 'done').length;
      const overdue = projectTasks.filter((task) => isOverdue(task.dueDate, task.status)).length;
      const completed = projectTasks.filter((task) => task.status === 'done').length;
      const critical = projectTasks.filter(
        (task) => task.priority === 'critical' && task.status !== 'done'
      ).length;

      return {
        ...project,
        total: projectTasks.length,
        open,
        overdue,
        completed,
        critical,
        loadScore: open * 2 + overdue * 3 + critical * 4,
      };
    })
    .filter((project) => project.total > 0)
    .sort((a, b) => b.loadScore - a.loadScore || b.open - a.open)
    .slice(0, 6);
}

export function getTrendPoints(tasks: Task[], days = 7, now = new Date()) {
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const completed = tasks.filter((task) => {
      const completionDate = getCompletionDate(task);
      return completionDate ? isSameDay(new Date(completionDate), date) : false;
    }).length;

    const planned = tasks.filter((task) => isSameDay(new Date(task.dueDate), date)).length;
    const overdue = tasks.filter(
      (task) => isSameDay(new Date(task.dueDate), date) && isOverdue(task.dueDate, task.status)
    ).length;

    return {
      date,
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: date.getDate(),
      completed,
      planned,
      overdue,
    };
  });
}

export function getMonthActivity(tasks: Task[], monthDate = new Date()) {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const monthEnd = endOfMonth(monthDate);
  const gridEnd = endOfWeek(monthEnd);
  const days: Array<{
    date: Date;
    isCurrentMonth: boolean;
    planned: number;
    completed: number;
    overdue: number;
    intensity: number;
  }> = [];

  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const date = new Date(cursor);
    const planned = tasks.filter((task) => isSameDay(new Date(task.dueDate), date)).length;
    const completed = tasks.filter((task) => {
      const completionDate = getCompletionDate(task);
      return completionDate ? isSameDay(new Date(completionDate), date) : false;
    }).length;
    const overdue = tasks.filter(
      (task) => isSameDay(new Date(task.dueDate), date) && isOverdue(task.dueDate, task.status)
    ).length;

    days.push({
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      planned,
      completed,
      overdue,
      intensity: Math.min(4, completed + planned + overdue),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
