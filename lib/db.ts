/**
 * lib/db.ts — Server-side data access layer.
 * All functions use the service role Supabase client.
 * Import only in server components, route handlers, and server actions.
 */

import { supabase } from '@/lib/supabase';
import type { Task, Project, WeeklyIntent, MonthlyFocus, MonthlyGoal, Goal } from '@/types';
import type { Trip } from '@/lib/travel-data';

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
  if ('notes'       in t)          r.notes            = t.notes ?? null;
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
function rowToWeeklyIntent(r: any): WeeklyIntent {
  return {
    id: r.id,
    weekStart: r.week_start,
    objectives: r.objectives,
    mustGetDone: r.must_get_done,
    watchouts: r.watchouts,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMonthlyFocus(r: any): MonthlyFocus {
  return {
    id: r.id,
    month: r.month,
    focusAreas: r.focus_areas,
    majorCommitments: r.major_commitments,
    risks: r.risks,
    personalGoals: r.personal_goals,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMonthlyGoal(r: any): MonthlyGoal {
  return {
    id: r.id,
    month: r.month,
    title: r.title,
    workstream: r.workstream,
    progress: r.progress,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTrip(r: any): Trip {
  return {
    id: r.id,
    title: r.title,
    fromCity: r.from_city,
    toCity: r.to_city,
    fromCode: r.from_code,
    toCode: r.to_code,
    departureDate: r.departure_date,
    returnDate: r.return_date ?? undefined,
    status: r.status,
    tripType: r.trip_type,
    airline: r.airline ?? undefined,
    bookingReference: r.booking_reference ?? undefined,
    notes: r.notes ?? undefined,
    reminderAt: r.reminder_at ?? undefined,
    isRoundTrip: r.is_round_trip,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
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

// ── Weekly Intent ─────────────────────────────────────────────────────────────

export async function getWeeklyIntent(): Promise<WeeklyIntent | null> {
  const { data, error } = await supabase
    .from('weekly_intents').select('*').order('week_start', { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  return data.length ? rowToWeeklyIntent(data[0]) : null;
}

export async function upsertWeeklyIntent(intent: WeeklyIntent): Promise<WeeklyIntent> {
  const { data, error } = await supabase.from('weekly_intents').upsert({
    id: intent.id,
    week_start: intent.weekStart,
    objectives: intent.objectives,
    must_get_done: intent.mustGetDone,
    watchouts: intent.watchouts,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToWeeklyIntent(data);
}

// ── Monthly Focus ─────────────────────────────────────────────────────────────

export async function getMonthlyFocus(month?: string): Promise<MonthlyFocus | null> {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from('monthly_focus').select('*').eq('month', m).limit(1);
  if (error) throw new Error(error.message);
  return data.length ? rowToMonthlyFocus(data[0]) : null;
}

export async function upsertMonthlyFocus(focus: MonthlyFocus): Promise<MonthlyFocus> {
  const { data, error } = await supabase.from('monthly_focus').upsert({
    id: focus.id,
    month: focus.month,
    focus_areas: focus.focusAreas,
    major_commitments: focus.majorCommitments,
    risks: focus.risks,
    personal_goals: focus.personalGoals,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToMonthlyFocus(data);
}

// ── Monthly Goals ─────────────────────────────────────────────────────────────

export async function getMonthlyGoals(month?: string): Promise<MonthlyGoal[]> {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from('monthly_goals').select('*').eq('month', m).order('created_at');
  if (error) throw new Error(error.message);
  return data.map(rowToMonthlyGoal);
}

export async function updateMonthlyGoal(id: string, updates: Partial<MonthlyGoal>): Promise<MonthlyGoal> {
  const row: Record<string, unknown> = {};
  if (updates.progress !== undefined) row.progress = updates.progress;
  if ('notes' in updates) row.notes = updates.notes ?? null;
  const { data, error } = await supabase
    .from('monthly_goals').update(row).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToMonthlyGoal(data);
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

// ── Trips ─────────────────────────────────────────────────────────────────────

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips').select('*').order('departure_date');
  if (error) throw new Error(error.message);
  return data.map(rowToTrip);
}

export async function createTrip(trip: Trip): Promise<Trip> {
  const { data, error } = await supabase.from('trips').insert({
    id: trip.id,
    title: trip.title,
    from_city: trip.fromCity,
    to_city: trip.toCity,
    from_code: trip.fromCode,
    to_code: trip.toCode,
    departure_date: trip.departureDate,
    return_date: trip.returnDate ?? null,
    status: trip.status,
    trip_type: trip.tripType,
    airline: trip.airline ?? null,
    booking_reference: trip.bookingReference ?? null,
    notes: trip.notes ?? null,
    reminder_at: trip.reminderAt ?? null,
    is_round_trip: trip.isRoundTrip,
  }).select().single();
  if (error) throw new Error(error.message);
  return rowToTrip(data);
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
  const row: Record<string, unknown> = {};
  if (updates.title         !== undefined) row.title             = updates.title;
  if (updates.fromCity      !== undefined) row.from_city         = updates.fromCity;
  if (updates.toCity        !== undefined) row.to_city           = updates.toCity;
  if (updates.fromCode      !== undefined) row.from_code         = updates.fromCode;
  if (updates.toCode        !== undefined) row.to_code           = updates.toCode;
  if (updates.departureDate !== undefined) row.departure_date    = updates.departureDate;
  if ('returnDate'    in updates) row.return_date       = updates.returnDate ?? null;
  if (updates.status        !== undefined) row.status            = updates.status;
  if (updates.tripType      !== undefined) row.trip_type         = updates.tripType;
  if ('airline'       in updates) row.airline           = updates.airline ?? null;
  if ('bookingReference' in updates) row.booking_reference = updates.bookingReference ?? null;
  if ('notes'         in updates) row.notes             = updates.notes ?? null;
  if ('reminderAt'    in updates) row.reminder_at       = updates.reminderAt ?? null;
  if (updates.isRoundTrip   !== undefined) row.is_round_trip     = updates.isRoundTrip;
  const { data, error } = await supabase
    .from('trips').update(row).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return rowToTrip(data);
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
