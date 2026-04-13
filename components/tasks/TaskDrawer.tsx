'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Priority, Status, Workstream, Project, RecurrenceType } from '@/types';
import { cn } from '@/lib/utils';
import { X, Trash2, Plus, Check, ChevronDown, Save } from 'lucide-react';

// ── Notes / Next-steps data model ─────────────────────────────────────────────
interface Step { id: string; text: string; done: boolean }
interface NotesData { notes: string; steps: Step[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNotes(raw: string | Record<string, any> | undefined | null): NotesData {
  if (!raw) return { notes: '', steps: [] };
  // Supabase jsonb columns return objects directly
  if (typeof raw === 'object') {
    if ('__v2' in raw) return { notes: raw.notes ?? '', steps: raw.steps ?? [] };
    return { notes: '', steps: [] };
  }
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && '__v2' in p)
      return { notes: p.notes ?? '', steps: p.steps ?? [] };
  } catch { /* plain text — legacy data */ }
  return { notes: raw, steps: [] };
}

function serializeNotes(d: NotesData): string | undefined {
  if (!d.notes.trim() && d.steps.length === 0) return undefined;
  // Always use JSON format so storage works with both TEXT and JSONB columns
  return JSON.stringify({ __v2: true, notes: d.notes, steps: d.steps });
}

// ── Date/time helpers ─────────────────────────────────────────────────────────
function getLocalDateValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getLocalTimeValue(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function applyDatePart(iso: string, dateVal: string) {
  const d = new Date(iso);
  const [y,mo,day] = dateVal.split('-').map(Number);
  d.setFullYear(y, mo-1, day);
  return d.toISOString();
}
function applyTimePart(iso: string, timeVal: string) {
  const d = new Date(iso);
  const [h,m] = timeVal.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function getEndTimeValue(iso: string, dur: number) {
  const d = new Date(new Date(iso).getTime() + dur * 60_000);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function durationFromEndTime(startIso: string, endVal: string) {
  const [h,m] = endVal.split(':').map(Number);
  const end = new Date(startIso); end.setHours(h, m, 0, 0);
  return Math.max(15, Math.round((end.getTime() - new Date(startIso).getTime()) / 60_000));
}

// ── Time slot picker ──────────────────────────────────────────────────────────
const TIME_SLOTS = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0,15,30,45]) {
      const value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h === 0 || h === 12 ? 12 : h % 12;
      slots.push({ value, label: `${h12}:${String(m).padStart(2,'0')} ${ampm}` });
    }
  }
  return slots;
})();

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref     = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
  }, [open]);

  const label = TIME_SLOTS.find(s => s.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1 text-[13px] text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 focus:outline-none hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
      </button>
      {open && (
        <div ref={listRef} className="absolute z-50 mt-1 w-36 max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl">
          {TIME_SLOTS.map(s => (
            <button key={s.value} data-selected={s.value === value} type="button"
              onClick={() => { onChange(s.value); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm transition-colors',
                s.value === value
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              )}
            >{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: Status; label: string; active: string; inactive: string }[] = [
  { value: 'todo',        label: 'To Do',       active: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900',        inactive: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'in_progress', label: 'In Progress',  active: 'bg-accent-cyan/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-cyan/60', inactive: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'done',        label: 'Done',         active: 'bg-accent-green/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-green/50', inactive: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'follow_up',   label: 'Follow Up',    active: 'bg-accent-orange/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-orange/50', inactive: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'send_mail',   label: 'Send Mail',    active: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300/60 dark:ring-violet-500/40', inactive: 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; active: string; inactive: string }[] = [
  { value: 'low',      label: 'Low',      active: 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900',           inactive: 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'medium',   label: 'Medium',   active: 'bg-accent-cyan/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-cyan/60',  inactive: 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'high',     label: 'High',     active: 'bg-accent-green/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-green/50', inactive: 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { value: 'critical', label: 'Critical', active: 'bg-accent-orange/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-orange/50', inactive: 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none',     label: 'Does not repeat' },
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly',   label: 'Every week' },
];

const WORKSTREAM_OPTIONS: { value: Workstream; label: string }[] = [
  { value: 'aramco',   label: 'Aramco' },
  { value: 'satorp',   label: 'SATORP' },
  { value: 'pmo',      label: 'PMO' },
  { value: 'personal', label: 'Personal' },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave?: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects?: Project[];
}

export function TaskDrawer({ task, open, onClose, onSave, onDelete, projects = [] }: TaskDrawerProps) {
  const [form,        setForm]        = useState<Task | null>(null);
  const [notesData,   setNotesData]   = useState<NotesData>({ notes: '', steps: [] });
  const [newStepText, setNewStepText] = useState('');
  const [isMobile,    setIsMobile]    = useState(false);
  const [saved,       setSaved]       = useState(false);
  const touchStartY = useRef<number | null>(null);
  const notesRef    = useRef<HTMLTextAreaElement>(null);
  const titleRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setForm({ ...task });
      setNotesData(parseNotes(task.notes));
      setNewStepText('');
    }
  }, [task]);

  // Auto-grow textareas
  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [notesData.notes]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [form?.title]);

  const handleSave = () => {
    if (!form) return;
    let dataToSave = notesData;
    if (newStepText.trim()) {
      const pending: Step = { id: crypto.randomUUID(), text: newStepText.trim(), done: false };
      dataToSave = { ...notesData, steps: [...notesData.steps, pending] };
      setNotesData(dataToSave);
      setNewStepText('');
    }
    onSave?.({ ...form, notes: serializeNotes(dataToSave) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // Steps — checkboxes save immediately; text edits batched on Save
  const toggleStep = (id: string) => {
    const updated = { ...notesData, steps: notesData.steps.map(s => s.id === id ? { ...s, done: !s.done } : s) };
    setNotesData(updated);
    if (form) onSave?.({ ...form, notes: serializeNotes(updated) });
  };

  const addStep = () => {
    const text = newStepText.trim();
    if (!text) return;
    setNotesData(d => ({ ...d, steps: [...d.steps, { id: crypto.randomUUID(), text, done: false }] }));
    setNewStepText('');
  };

  const removeStep  = (id: string) => setNotesData(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }));
  const updateStep  = (id: string, text: string) => setNotesData(d => ({ ...d, steps: d.steps.map(s => s.id === id ? { ...s, text } : s) }));

  const workstreamProjects = projects.filter(p => p.workstream === form?.workstream);

  if (!form) return null;

  return (
    <AnimatePresence>
      {open && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-[2px] z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.85 }}
            onTouchStart={isMobile ? e => { touchStartY.current = e.touches[0].clientY; } : undefined}
            onTouchEnd={isMobile ? e => {
              if (touchStartY.current === null) return;
              if (e.changedTouches[0].clientY - touchStartY.current > 72) onClose();
              touchStartY.current = null;
            } : undefined}
            className={cn(
              'fixed z-[70] bg-white dark:bg-zinc-950 shadow-2xl dark:shadow-black/70 flex flex-col',
              isMobile ? 'bottom-0 left-0 right-0 rounded-t-[28px] max-h-[92svh]' : 'inset-y-0 right-0 w-[480px]'
            )}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div className="flex justify-center pt-3 shrink-0" onClick={onClose}>
                <div className="w-10 h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
              </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="shrink-0 px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">

              {/* Action bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <WorkstreamPill workstream={form.workstream} />
                </div>
                <div className="flex items-center gap-1">
                  {onDelete && (
                    <button
                      onClick={() => { onDelete(task.id); onClose(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-[15px] h-[15px]" />
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                      saved
                        ? 'bg-accent-green/20 text-zinc-700 dark:text-zinc-200 ring-1 ring-accent-green/50'
                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100'
                    )}
                  >
                    {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <textarea
                ref={titleRef}
                rows={1}
                className="w-full text-[18px] font-bold text-zinc-900 dark:text-zinc-50 bg-transparent resize-none outline-none leading-snug placeholder:text-zinc-300 dark:placeholder:text-zinc-700 overflow-hidden"
                value={form.title}
                placeholder="Task title…"
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* ── Scrollable content ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              <div className="px-5 py-5 space-y-6 pb-10">

                {/* Status */}
                <Section label="Status">
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm({ ...form, status: opt.value })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                          form.status === opt.value ? opt.active : opt.inactive
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Priority */}
                <Section label="Priority">
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm({ ...form, priority: opt.value })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                          form.priority === opt.value ? opt.active : opt.inactive
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Workstream + Project */}
                <div className="grid grid-cols-2 gap-4">
                  <Section label="Workstream">
                    <SelectInput
                      value={form.workstream}
                      options={WORKSTREAM_OPTIONS}
                      onChange={v => setForm({ ...form, workstream: v as Workstream, projectId: undefined })}
                    />
                  </Section>
                  <Section label="Project">
                    <SelectInput
                      value={form.projectId ?? ''}
                      options={[{ value: '', label: 'No project' }, ...workstreamProjects.map(p => ({ value: p.id, label: p.name }))]}
                      onChange={v => setForm({ ...form, projectId: v || undefined })}
                    />
                  </Section>
                </div>

                {/* Date + Reminder */}
                <div className="grid grid-cols-2 gap-4">
                  <Section label="Date">
                    <input
                      type="date"
                      value={getLocalDateValue(form.dueDate)}
                      onChange={e => setForm({ ...form, dueDate: applyDatePart(form.dueDate, e.target.value) })}
                      className="w-full text-[13px] text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 outline-none hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 dark:focus:border-zinc-500 transition-colors"
                    />
                  </Section>
                  <Section label="Reminder">
                    <input
                      type="date"
                      value={form.reminderAt?.split('T')[0] ?? ''}
                      onChange={e => setForm({ ...form, reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full text-[13px] text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 outline-none hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 dark:focus:border-zinc-500 transition-colors"
                    />
                  </Section>
                </div>

                {/* Time + Recurrence */}
                <div className="grid grid-cols-2 gap-4">
                  <Section label="Time">
                    <div className="flex items-center gap-1.5">
                      <TimeSelect
                        value={getLocalTimeValue(form.dueDate)}
                        onChange={v => setForm({ ...form, dueDate: applyTimePart(form.dueDate, v) })}
                      />
                      <span className="text-[11px] text-zinc-400 shrink-0">–</span>
                      <TimeSelect
                        value={getEndTimeValue(form.dueDate, form.durationMinutes ?? 60)}
                        onChange={v => setForm({ ...form, durationMinutes: durationFromEndTime(form.dueDate, v) })}
                      />
                    </div>
                  </Section>
                  <Section label="Recurrence">
                    <SelectInput
                      value={form.recurrence ?? 'none'}
                      options={RECURRENCE_OPTIONS}
                      onChange={v => setForm({ ...form, recurrence: v as RecurrenceType })}
                    />
                  </Section>
                </div>

                {/* Divider */}
                <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

                {/* Notes */}
                <Section label="Notes">
                  <textarea
                    ref={notesRef}
                    rows={3}
                    className="w-full text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none overflow-hidden transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                    placeholder="Add notes…"
                    value={notesData.notes}
                    onChange={e => setNotesData(d => ({ ...d, notes: e.target.value }))}
                  />
                </Section>

                {/* Next Steps */}
                <Section label="Next Steps">
                  <div className="space-y-2">
                    {notesData.steps.map(step => (
                      <div key={step.id} className="flex items-start gap-2.5 group">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleStep(step.id)}
                          className={cn(
                            'mt-0.5 w-[16px] h-[16px] rounded flex items-center justify-center shrink-0 border transition-all',
                            step.done
                              ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                              : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400'
                          )}
                        >
                          {step.done && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />}
                        </button>

                        {/* Editable text */}
                        <input
                          className={cn(
                            'flex-1 text-sm bg-transparent outline-none border-b border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 transition-colors',
                            step.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300'
                          )}
                          value={step.text}
                          onChange={e => updateStep(step.id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                          placeholder="Step description…"
                        />

                        {/* Remove */}
                        <button
                          onClick={() => removeStep(step.id)}
                          className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-700 hover:text-red-400 dark:hover:text-red-500 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add step row */}
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button
                        onClick={addStep}
                        className="w-[16px] h-[16px] rounded border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 hover:border-zinc-500 dark:hover:border-zinc-500 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-600" />
                      </button>
                      <input
                        className="flex-1 text-sm bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none border-b border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 transition-colors"
                        placeholder="Add a next step…"
                        value={newStepText}
                        onChange={e => setNewStepText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                      />
                    </div>
                  </div>
                </Section>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-600">{label}</p>
      {children}
    </div>
  );
}

function SelectInput({ value, options, onChange }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-[13px] text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 outline-none hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 dark:focus:border-zinc-500 transition-colors"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function WorkstreamPill({ workstream }: { workstream: Workstream }) {
  const styles: Record<Workstream, string> = {
    aramco:   'bg-accent-green/15 text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-green/30',
    satorp:   'bg-accent-cyan/15  text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-cyan/30',
    pmo:      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    personal: 'bg-accent-orange/15 text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-orange/30',
  };
  const labels: Record<Workstream, string> = { aramco: 'Aramco', satorp: 'SATORP', pmo: 'PMO', personal: 'Personal' };
  return (
    <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg', styles[workstream])}>
      {labels[workstream]}
    </span>
  );
}
