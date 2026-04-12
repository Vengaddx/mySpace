import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Priority, Status, Workstream } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export function isOverdue(iso: string, status: Status, isUnscheduled?: boolean): boolean {
  if (status === 'done') return false;
  // Tasks with no manually set time (isUnscheduled or midnight placeholder) are not time-bound
  if (isUnscheduled) return false;
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return false;
  return d < new Date();
}

export function isUpcoming(iso: string): boolean {
  const d = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return d >= tomorrow && d <= weekFromNow;
}

export function priorityLabel(p: Priority): string {
  const map: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return map[p];
}

export function statusLabel(s: Status): string {
  const map: Record<Status, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', follow_up: 'Follow Up', send_mail: 'Send Mail' };
  return map[s];
}

export function workstreamLabel(w: Workstream): string {
  const map: Record<Workstream, string> = { aramco: 'Aramco', satorp: 'SATORP', pmo: 'PMO', personal: 'Personal' };
  return map[w];
}

export function getCurrentWeekRange(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function getCurrentMonthYear(): string {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
