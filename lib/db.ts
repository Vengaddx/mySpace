/**
 * lib/db.ts — Server-side data access layer.
 * All functions use the service role Supabase client.
 * Import only in server components, route handlers, and server actions.
 */

import 'server-only';

import { supabase } from '@/lib/supabase';
import type { Task, Project, Goal } from '@/types';

// ── Type mappers: DB row (snake_case) → TypeScript type (camelCase) ───────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    workstream: r.workstream,
    projectId: r.project_id ?? undefined,
    priority: r.priority,
    status: r.status,
    dueDate: r.due_date,
    completionDate: r.completion_date ?? undefined,
    reminderAt: r.reminder_at ?? undefined,
    isWeekFocus: r.is_week_focus,
    isMonthFocus: r.is_month_focus,
    notes: r.notes ?? undefined,
    tags: r.tags ?? undefined,
    durationMinutes: r.duration_minutes,
    recurrence: r.recurrence,
    isUnscheduled: r.is_unscheduled,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function taskToRow(t: Partial<Task>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (t.title       !== undefined) r.title            = t.title;
  if (t.category    !== undefined) r.category         = t.category;
  if (t.workstream  !== undefined) r.workstream       = t.workstream;
  if ('projectId'   in t)          r.project_id       = t.projectId ?? null;
  if (t.priority    !== undefined) r.priority         = t.priority;
  if (t.status      !== undefined) r.status           = t.status;
  if (t.dueDate     !== undefined) r.due_date         = t.dueDate;
  if ('completionDate' in t)       r.completion_date  = t.completionDate ?? null;
  if ('reminderAt'  in t)          r.reminder_at      = t.reminderAt ?? null;
  if (t.isWeekFocus  !== undefined) r.is_week_focus   = t.isWeekFocus;
  if (t.isMonthFocus !== undefined) r.is_month_focus  = t.isMonthFocus;
  if ('notes'       in t) {
    const n = t.notes;
    if (typeof n === 'string' && n) {
      try { r.notes = JSON.parse(n); } catch { r.notes = n; }
    } else {
      r.notes = n ?? null;
    }
  }
  if ('tags'        in t)          r.tags             = t.tags ?? null;
  if (t.durationMinutes !== undefined) r.duration_minutes = t.durationMinutes;
  if (t.recurrence  !== undefined) r.recurrence       = t.recurrence;
  if (t.isUnscheduled !== undefined) r.is_unscheduled = t.isUnscheduled;
  return r;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(r: any): Project {
  return { id: r.id, name: r.name, workstream: r.workstream, createdAt: r.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGoal(r: any): Goal {
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    month: r.month,
    type: r.type,
    color: r.color,
    checkins: r.checkins ?? [],
    target: r.target ?? undefined,
    unit: r.unit ?? undefined,
    current: r.current ?? undefined,
    createdAt: r.created_at,
  };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').order('due_date');
  if (error) throw new Error(error.message);
  return data.map(rowToTask);
}

export async function createTask(task: Task): Promise<Task> {
  const row = taskToRow(task);
  row.id = task.id;
  const { data, error } = await supabase.from('tasks').insert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToTask(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks').update(taskToRow(updates)).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Deletes tasks completed more than `days` ago. Falls back to `updated_at`
 * for legacy rows completed before completion_date was tracked.
 */
export async function deleteStaleCompletedTasks(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('status', 'done')
    .or(`completion_date.lt.${cutoff},and(completion_date.is.null,updated_at.lt.${cutoff})`)
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('name');
  if (error) throw new Error(error.message);
  return data.map(rowToProject);
}

export async function createProject(project: Project): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert({
    id: project.id,
    name: project.name,
    workstream: project.workstream,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToProject(data);
}

export async function updateProject(id: string, name: string): Promise<Project> {
  const { data, error } = await supabase.from('projects').update({ name }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToProject(data);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoals(month?: string): Promise<Goal[]> {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from('goals').select('*').eq('month', m).order('created_at');
  if (error) throw new Error(error.message);
  return data.map(rowToGoal);
}

export async function createGoal(goal: Goal): Promise<Goal> {
  const { data, error } = await supabase.from('goals').insert({
    id: goal.id,
    title: goal.title,
    emoji: goal.emoji,
    month: goal.month,
    type: goal.type,
    color: goal.color,
    checkins: goal.checkins,
    target: goal.target ?? null,
    unit: goal.unit ?? null,
    current: goal.current ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToGoal(data);
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  const row: Record<string, unknown> = {};
  if (updates.title    !== undefined) row.title    = updates.title;
  if (updates.checkins !== undefined) row.checkins = updates.checkins;
  if ('current'  in updates) row.current  = updates.current ?? null;
  if ('target'   in updates) row.target   = updates.target ?? null;
  if ('unit'     in updates) row.unit     = updates.unit ?? null;
  const { data, error } = await supabase
    .from('goals').update(row).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToGoal(data);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
