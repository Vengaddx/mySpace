'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Trip, TripStatus, TripType } from '@/lib/travel-data';
import { cn } from '@/lib/utils';

interface AddTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editTrip?: Trip | null;
  prefillDate?: string;
}

const STATUSES: { value: TripStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'flight_booked', label: 'Flight Booked' },
  { value: 'ticket_pending', label: 'Ticket Pending' },
  { value: 'visa_pending', label: 'Visa Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: 'india', label: 'India' },
  { value: 'family_visit', label: 'Family Visit' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal' },
];

const inputCls =
  'w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all';

const labelCls =
  'block text-[10px] font-semibold tracking-[0.14em] text-zinc-500 dark:text-zinc-500 uppercase mb-1.5';

export function AddTripDialog({
  open,
  onOpenChange,
  onSave,
  editTrip,
  prefillDate,
}: AddTripDialogProps) {
  const [form, setForm] = useState<{
    title: string;
    fromCity: string;
    toCity: string;
    fromCode: string;
    toCode: string;
    departureDate: string;
    returnDate: string;
    status: TripStatus;
    tripType: TripType;
    airline: string;
    bookingReference: string;
    notes: string;
    isRoundTrip: boolean;
  }>({
    title: editTrip?.title ?? '',
    fromCity: editTrip?.fromCity ?? '',
    toCity: editTrip?.toCity ?? '',
    fromCode: editTrip?.fromCode ?? '',
    toCode: editTrip?.toCode ?? '',
    departureDate: editTrip?.departureDate ?? '',
    returnDate: editTrip?.returnDate ?? '',
    status: editTrip?.status ?? 'planning',
    tripType: editTrip?.tripType ?? 'india',
    airline: editTrip?.airline ?? '',
    bookingReference: editTrip?.bookingReference ?? '',
    notes: editTrip?.notes ?? '',
    isRoundTrip: editTrip?.isRoundTrip ?? true,
  });

  // Reset form whenever dialog opens (handles both add and edit)
  useEffect(() => {
    if (open) {
      setForm({
        title: editTrip?.title ?? '',
        fromCity: editTrip?.fromCity ?? '',
        toCity: editTrip?.toCity ?? '',
        fromCode: editTrip?.fromCode ?? '',
        toCode: editTrip?.toCode ?? '',
        departureDate: editTrip?.departureDate ?? prefillDate ?? '',
        returnDate: editTrip?.returnDate ?? '',
        status: editTrip?.status ?? 'planning',
        tripType: editTrip?.tripType ?? 'india',
        airline: editTrip?.airline ?? '',
        bookingReference: editTrip?.bookingReference ?? '',
        notes: editTrip?.notes ?? '',
        isRoundTrip: editTrip?.isRoundTrip ?? true,
      });
    }
  }, [open]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.title || !form.fromCode || !form.toCode || !form.departureDate) return;
    onSave({
      title: form.title,
      fromCity: form.fromCity,
      toCity: form.toCity,
      fromCode: form.fromCode.toUpperCase(),
      toCode: form.toCode.toUpperCase(),
      departureDate: form.departureDate,
      returnDate: form.returnDate || undefined,
      status: form.status,
      tripType: form.tripType,
      airline: form.airline || undefined,
      bookingReference: form.bookingReference || undefined,
      notes: form.notes || undefined,
      isRoundTrip: form.isRoundTrip,
    });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

        <Dialog.Content
          className={cn(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-lg max-h-[90vh] overflow-y-auto',
            'bg-white dark:bg-zinc-950 rounded-[20px] border border-zinc-200 dark:border-zinc-800',
            'shadow-2xl focus:outline-none'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                {editTrip ? 'Edit Trip' : 'New Trip'}
              </Dialog.Title>
              <Dialog.Description className="text-[12px] text-zinc-500 dark:text-zinc-600 mt-0.5">
                Add your travel details below.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className={labelCls}>Trip Title</label>
              <input
                className={inputCls}
                placeholder="e.g. Annual India Trip"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>

            {/* Route row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>From Code</label>
                <input
                  className={cn(inputCls, 'font-mono uppercase tracking-wider')}
                  placeholder="DMM"
                  maxLength={4}
                  value={form.fromCode}
                  onChange={(e) => set('fromCode', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>To Code</label>
                <input
                  className={cn(inputCls, 'font-mono uppercase tracking-wider')}
                  placeholder="MAA"
                  maxLength={4}
                  value={form.toCode}
                  onChange={(e) => set('toCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>From City</label>
                <input
                  className={inputCls}
                  placeholder="Dammam"
                  value={form.fromCity}
                  onChange={(e) => set('fromCity', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>To City</label>
                <input
                  className={inputCls}
                  placeholder="Chennai"
                  value={form.toCity}
                  onChange={(e) => set('toCity', e.target.value)}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Departure Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.departureDate}
                  onChange={(e) => set('departureDate', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Return Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.returnDate}
                  onChange={(e) => set('returnDate', e.target.value)}
                />
              </div>
            </div>

            {/* Status + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as TripStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Trip Type</label>
                <select
                  className={inputCls}
                  value={form.tripType}
                  onChange={(e) => set('tripType', e.target.value as TripType)}
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Airline + Booking ref */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Airline</label>
                <input
                  className={inputCls}
                  placeholder="Air Arabia"
                  value={form.airline}
                  onChange={(e) => set('airline', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Booking Reference</label>
                <input
                  className={cn(inputCls, 'font-mono uppercase tracking-wider')}
                  placeholder="AR7X9K"
                  value={form.bookingReference}
                  onChange={(e) => set('bookingReference', e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                className={cn(inputCls, 'resize-none')}
                rows={2}
                placeholder="Any notes about this trip..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>

            {/* Round trip toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                role="checkbox"
                aria-checked={form.isRoundTrip}
                onClick={() => set('isRoundTrip', !form.isRoundTrip)}
                className={cn(
                  'w-4 h-4 rounded border transition-all flex items-center justify-center',
                  form.isRoundTrip
                    ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                )}
              >
                {form.isRoundTrip && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke={
                        typeof window !== 'undefined' &&
                        document.documentElement.classList.contains('dark')
                          ? '#000'
                          : '#fff'
                      }
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-[13px] text-zinc-600 dark:text-zinc-400 select-none">
                Round trip
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-[13px] font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
            >
              {editTrip ? 'Save Changes' : 'Add Trip'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
