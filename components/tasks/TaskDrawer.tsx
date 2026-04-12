'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority, Status, Workstream, Project, RecurrenceType } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { X, Calendar, Clock, Star, Zap, StickyNote, FolderOpen, Bell, RefreshCw, ChevronDown, Trash2, Plus, Check, ListChecks } from 'lucide-react';
import { PriorityBadge, StatusBadge, WorkstreamBadge } from '@/components/ui/Badge';

// ── Notes / Next-steps data model ──────────────────────────────────────────
// Stored as JSON in the task.notes field; plain-text notes are preserved as-is.
interface Step { id: string; text: string; done: boolean }
interface NotesData { notes: string; steps: Step[] }

function parseNotes(raw: string | undefined): NotesData {
  if (!raw) return { notes: '', steps: [] };
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && '__v2' in p) {
      return { notes: p.notes ?? '', steps: p.steps ?? [] };
    }
  } catch { /* not JSON — treat as plain text */ }
  return { notes: raw, steps: [] };
}

function serializeNotes(d: NotesData): string | undefined {
  if (!d.notes.trim() && d.steps.length === 0) return undefined;
  if (d.steps.length === 0) return d.notes || undefined;
  return JSON.stringify({ __v2: true, notes: d.notes, steps: d.steps });
}

// ── Date/time helpers ──────────────────────────────────────────────────────
function getLocalDateValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getLocalTimeValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function applyDatePart(iso: string, dateVal: string): string {
  const d = new Date(iso);
  const [y, mo, day] = dateVal.split('-').map(Number);
  d.setFullYear(y, mo - 1, day);
  return d.toISOString();
}
function applyTimePart(iso: string, timeVal: string): string {
  const d = new Date(iso);
  const [h, m] = timeVal.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 || h === 12 ? 12 : h % 12;
  return `${h12}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''} ${ampm}`;
}
function getEndTimeValue(iso: string, durationMinutes: number): string {
  const d = new Date(new Date(iso).getTime() + durationMinutes * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatEndTime(iso: string, durationMinutes: number): string {
  const end = new Date(new Date(iso).getTime() + durationMinutes * 60_000);
  return formatTime(end.toISOString());
}
function durationFromEndTime(startIso: string, endTimeVal: string): number {
  const [h, m] = endTimeVal.split(':').map(Number);
  const end = new Date(startIso); end.setHours(h, m, 0, 0);
  return Math.max(15, Math.round((end.getTime() - new Date(startIso).getTime()) / 60_000));
}
// ── Time slot helpers ─────────────────────────────────────────────────────
function buildTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 || h === 12 ? 12 : h % 12;
      const label = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
      slots.push({ value, label });
    }
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector('[data-selected="true"]');
    active?.scrollIntoView({ block: 'center' });
  }, [open]);

  const slot = TIME_SLOTS.find((s) => s.value === value);
  const label = slot?.label ?? value;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-36 max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg"
        >
          {TIME_SLOTS.map((s) => (
            <button
              key={s.value}
              data-selected={s.value === value}
              type="button"
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                s.value === value
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none',     label: 'Does not repeat' },
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
  { value: 'weekly',   label: 'Every week (same day)' },
];
const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  none: 'Does not repeat', daily: 'Every day',
  weekdays: 'Every weekday', weekly: 'Every week',
};

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave?: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects?: Project[];
}

export function TaskDrawer({ task, open, onClose, onSave, onDelete, projects = [] }: TaskDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Task | null>(null);
  const [notesData, setNotesData] = useState<NotesData>({ notes: '', steps: [] });
  const [newStepText, setNewStepText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const touchStartY  = useRef<number | null>(null);
  const notesRef     = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (task) {
      setForm({ ...task });
      setNotesData(parseNotes(task.notes));
      setNewStepText('');
      setEditing(false);
    }
  }, [task]);

  // Auto-grow the notes textarea
  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [notesData.notes, editing]);

  const handleSave = () => {
    if (form) {
      onSave?.({ ...form, notes: serializeNotes(notesData) });
      setEditing(false);
    }
  };

  const handleCancel = () => {
    if (task) setNotesData(parseNotes(task.notes));
    setNewStepText('');
    setEditing(false);
  };

  // Toggle a step done/undone — works in both view and edit mode, saves immediately
  const toggleStep = (id: string) => {
    const updated = { ...notesData, steps: notesData.steps.map(s => s.id === id ? { ...s, done: !s.done } : s) };
    setNotesData(updated);
    if (task && form) onSave?.({ ...form, notes: serializeNotes(updated) });
  };

  const addStep = () => {
    const text = newStepText.trim();
    if (!text) return;
    setNotesData(d => ({ ...d, steps: [...d.steps, { id: crypto.randomUUID(), text, done: false }] }));
    setNewStepText('');
  };

  const removeStep = (id: string) => {
    setNotesData(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }));
  };

  const updateStepText = (id: string, text: string) => {
    setNotesData(d => ({ ...d, steps: d.steps.map(s => s.id === id ? { ...s, text } : s) }));
  };

  const workstreamProjects = projects.filter((p) => p.workstream === (editing ? form?.workstream : task?.workstream));
  const taskProject = projects.find((p) => p.id === task?.projectId);

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
      {children}
    </div>
  );

  return (
    <AnimatePresence>
      {open && task && form && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 dark:bg-black/55 backdrop-blur-[3px] z-[60]"
            onClick={onClose}
          />

          {/* Sheet / Drawer */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            onTouchStart={isMobile ? (e) => { touchStartY.current = e.touches[0].clientY; } : undefined}
            onTouchEnd={isMobile ? (e) => {
              if (touchStartY.current === null) return;
              const dy = e.changedTouches[0].clientY - touchStartY.current;
              if (dy > 72) onClose();
              touchStartY.current = null;
            } : undefined}
            className={cn(
              'fixed z-[70] bg-white dark:bg-zinc-950 shadow-2xl dark:shadow-black/60 flex flex-col',
              isMobile
                ? 'bottom-0 left-0 right-0 rounded-t-[28px] max-h-[92svh]'
                : 'inset-y-0 right-0 w-[460px]'
            )}
          >
            {/* Drag handle — mobile only */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-0 shrink-0" onClick={onClose}>
                <div className="w-10 h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <WorkstreamBadge workstream={task.workstream} />
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {editing && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="text-xs font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
                    >
                      Save
                    </button>
                  </>
                )}
                {onDelete && task && (
                  <button
                    onClick={() => { onDelete(task.id); onClose(); }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 pl-2 pr-2.5 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="text-xs font-medium sm:hidden">Close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-10 space-y-6" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {/* Title */}
          <div>
            {editing ? (
              <input
                className="w-full text-lg font-semibold text-zinc-900 dark:text-zinc-50 bg-transparent border-b border-zinc-200 dark:border-zinc-700 pb-1 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            ) : (
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">{task.title}</h2>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              {editing ? (
                <SelectField
                  value={form.status}
                  options={[
                    { value: 'todo', label: 'To Do' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'done', label: 'Done' },
                    { value: 'deferred', label: 'Deferred' },
                  ]}
                  onChange={(v) => setForm({ ...form, status: v as Status })}
                />
              ) : (
                <StatusBadge status={task.status} />
              )}
            </Field>

            <Field label="Priority">
              {editing ? (
                <SelectField
                  value={form.priority}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                  onChange={(v) => setForm({ ...form, priority: v as Priority })}
                />
              ) : (
                <PriorityBadge priority={task.priority} />
              )}
            </Field>

            <Field label="Workstream">
              {editing ? (
                <SelectField
                  value={form.workstream}
                  options={[
                    { value: 'aramco', label: 'Aramco' },
                    { value: 'satorp', label: 'SATORP' },
                    { value: 'pmo', label: 'PMO' },
                    { value: 'personal', label: 'Personal' },
                  ]}
                  onChange={(v) => setForm({ ...form, workstream: v as Workstream, projectId: undefined })}
                />
              ) : (
                <WorkstreamBadge workstream={task.workstream} />
              )}
            </Field>

            <Field label="Project">
              {editing ? (
                <SelectField
                  value={form.projectId ?? ''}
                  options={[
                    { value: '', label: 'No project' },
                    ...workstreamProjects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  onChange={(v) => setForm({ ...form, projectId: v || undefined })}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>{taskProject?.name ?? 'No project'}</span>
                </div>
              )}
            </Field>
          </div>

          {/* Date row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              {editing ? (
                <input
                  type="date"
                  className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 w-full transition-colors"
                  value={getLocalDateValue(form.dueDate)}
                  onChange={(e) => setForm({ ...form, dueDate: applyDatePart(form.dueDate, e.target.value) })}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  {formatDate(task.dueDate)}
                </div>
              )}
            </Field>

            <Field label="Reminder">
              {editing ? (
                <input
                  type="date"
                  className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 w-full transition-colors"
                  value={form.reminderAt?.split('T')[0] ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                  }
                />
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <Bell className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  {task.reminderAt ? formatDate(task.reminderAt) : <span className="text-zinc-400 dark:text-zinc-500">—</span>}
                </div>
              )}
            </Field>
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Time">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <TimeSelect
                    value={getLocalTimeValue(form.dueDate)}
                    onChange={(v) => setForm({ ...form, dueDate: applyTimePart(form.dueDate, v) })}
                  />
                  <span className="text-xs text-zinc-400 shrink-0">–</span>
                  <TimeSelect
                    value={getEndTimeValue(form.dueDate, form.durationMinutes ?? 60)}
                    onChange={(v) => setForm({ ...form, durationMinutes: durationFromEndTime(form.dueDate, v) })}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>{formatTime(task.dueDate)}</span>
                  <span className="text-zinc-400 dark:text-zinc-600">–</span>
                  <span>{formatEndTime(task.dueDate, task.durationMinutes ?? 60)}</span>
                </div>
              )}
            </Field>

            <Field label="Recurrence">
              {editing ? (
                <SelectField
                  value={form.recurrence ?? 'none'}
                  options={RECURRENCE_OPTIONS}
                  onChange={(v) => setForm({ ...form, recurrence: v as RecurrenceType })}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span className={cn(!task.recurrence || task.recurrence === 'none' ? 'text-zinc-400 dark:text-zinc-500' : '')}>
                    {RECURRENCE_LABEL[task.recurrence ?? 'none']}
                  </span>
                </div>
              )}
            </Field>
          </div>

          {/* Focus toggles */}
          <div className="flex gap-3">
            <ToggleField
              icon={<Star className="w-3.5 h-3.5" />}
              label="Week Focus"
              value={editing ? form.isWeekFocus : task.isWeekFocus}
              onChange={editing ? (v) => setForm({ ...form, isWeekFocus: v }) : undefined}
            />
            <ToggleField
              icon={<Zap className="w-3.5 h-3.5" />}
              label="Month Focus"
              value={editing ? form.isMonthFocus : task.isMonthFocus}
              onChange={editing ? (v) => setForm({ ...form, isMonthFocus: v }) : undefined}
            />
          </div>

          {/* Notes */}
          <Field label="Notes">
            {editing ? (
              <textarea
                ref={notesRef}
                className="w-full text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 resize-none transition-colors overflow-hidden"
                rows={3}
                placeholder="Add notes…"
                value={notesData.notes}
                onChange={(e) => setNotesData(d => ({ ...d, notes: e.target.value }))}
              />
            ) : (
              <div className="flex items-start gap-2">
                <StickyNote className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0" />
                {notesData.notes ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                    {notesData.notes}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-300 dark:text-zinc-600 italic">No notes added.</p>
                )}
              </div>
            )}
          </Field>

          {/* Next Steps */}
          <Field label="Next Steps">
            <div className="space-y-1.5">

              {/* Existing steps */}
              {notesData.steps.length === 0 && !editing && (
                <p className="text-sm text-zinc-300 dark:text-zinc-600 italic flex items-center gap-2">
                  <ListChecks className="w-3.5 h-3.5 shrink-0" />
                  No next steps yet.
                </p>
              )}

              {notesData.steps.map((step) => (
                <div key={step.id} className="flex items-start gap-2.5 group">
                  {/* Checkbox — always interactive */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all',
                      step.done
                        ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400'
                    )}
                  >
                    {step.done && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />}
                  </button>

                  {/* Text — editable in edit mode, read-only otherwise */}
                  {editing ? (
                    <input
                      className="flex-1 text-sm bg-transparent text-zinc-700 dark:text-zinc-300 outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors py-0"
                      value={step.text}
                      onChange={(e) => updateStepText(step.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                      placeholder="Step description…"
                    />
                  ) : (
                    <span className={cn(
                      'flex-1 text-sm leading-snug',
                      step.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300'
                    )}>
                      {step.text}
                    </span>
                  )}

                  {/* Delete — edit mode only */}
                  {editing && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-500 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add new step — edit mode only */}
              {editing && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={addStep}
                    className="w-4 h-4 rounded border border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0 hover:border-zinc-500 dark:hover:border-zinc-400 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500" />
                  </button>
                  <input
                    className="flex-1 text-sm bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors"
                    placeholder="Add a next step…"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                  />
                </div>
              )}
            </div>
          </Field>
        </div>
      </motion.div>
    </>
  )}
    </AnimatePresence>
  );
}

function SelectField({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors w-full"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ToggleField({
  icon, label, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
        value
          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
          : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500',
        !onChange && 'cursor-default'
      )}
      onClick={() => onChange?.(!value)}
    >
      {icon}
      {label}
    </button>
  );
}
