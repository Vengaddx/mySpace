export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'todo' | 'in_progress' | 'done' | 'deferred';
export type Category = 'personal' | 'work';
export type Workstream = 'aramco' | 'satorp' | 'pmo' | 'personal';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface Project {
  id: string;
  name: string;
  workstream: Workstream;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  workstream: Workstream;
  projectId?: string;
  priority: Priority;
  status: Status;
  dueDate: string; // ISO string
  completionDate?: string; // ISO string
  reminderAt?: string; // ISO string
  isWeekFocus: boolean;
  isMonthFocus: boolean;
  notes?: string;
  tags?: string[];
  durationMinutes?: number;    // block duration on calendar, default 60
  recurrence?: RecurrenceType; // recurring schedule
  isUnscheduled?: boolean;     // true when task has no assigned date/time yet
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyIntent {
  id: string;
  weekStart: string; // ISO string
  objectives: string;
  mustGetDone: string;
  watchouts: string;
}

export interface MonthlyFocus {
  id: string;
  month: string; // YYYY-MM
  focusAreas: string;
  majorCommitments: string;
  risks: string;
  personalGoals: string;
}

export interface StatsData {
  totalOpen: number;
  critical: number;
  dueToday: number;
  overdue: number;
}

export interface MonthlyGoal {
  id: string;
  month: string;        // YYYY-MM
  title: string;
  workstream: Workstream;
  progress: number;     // 0–100
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  emoji: string;
  month: string;        // YYYY-MM — which month this goal belongs to
  type: 'habit' | 'milestone';
  color: string;        // hex accent color
  checkins: string[];   // 'YYYY-MM-DD' — for habit daily check-ins
  target?: number;      // for milestone (e.g. 3)
  unit?: string;        // for milestone (e.g. 'kgs', 'books')
  current?: number;     // for milestone current value
  createdAt: string;
}

export type FilterChip = 'all' | 'aramco' | 'satorp' | 'pmo' | 'personal';
export type TaskView = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
