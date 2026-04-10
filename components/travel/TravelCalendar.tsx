'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Pencil, Plus } from 'lucide-react';
import { Trip, TRIP_STATUS_CONFIG, formatTravelDate, formatTravelDateShort } from '@/lib/travel-data';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TravelCalendarProps {
  trips: Trip[];
  today: string;
  onTripEdit: (trip: Trip) => void;
  onAddTrip: (date: string) => void;
}

interface EventEntry {
  trip: Trip;
  role: 'dep' | 'ret' | 'mid';
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function roleLabel(role: EventEntry['role']): string {
  if (role === 'dep') return 'Departure';
  if (role === 'ret') return 'Return';
  return 'In Transit';
}

export function TravelCalendar({ trips, today, onTripEdit, onAddTrip }: TravelCalendarProps) {
  const todayDate = new Date(today + 'T12:00:00');
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }
  function goToday() {
    setSelectedDate(null);
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  }

  // Build grid cells (full weeks)
  const cells = useMemo<Date[]>(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const total = Math.ceil((startPad + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) =>
      new Date(viewYear, viewMonth, 1 - startPad + i)
    );
  }, [viewYear, viewMonth]);

  // Build event map: dateStr → EventEntry[]
  const eventMap = useMemo<Record<string, EventEntry[]>>(() => {
    const map: Record<string, EventEntry[]> = {};

    function add(dateStr: string, entry: EventEntry) {
      if (!map[dateStr]) map[dateStr] = [];
      // avoid duplicate entries for the same trip on same day
      if (!map[dateStr].some((e) => e.trip.id === entry.trip.id && e.role === entry.role)) {
        map[dateStr].push(entry);
      }
    }

    trips.forEach((trip) => {
      if (trip.status === 'cancelled') return;
      add(trip.departureDate, { trip, role: 'dep' });
      if (trip.returnDate) {
        add(trip.returnDate, { trip, role: 'ret' });
        const cur = new Date(trip.departureDate + 'T12:00:00');
        cur.setDate(cur.getDate() + 1);
        while (toDateStr(cur) < trip.returnDate) {
          add(toDateStr(cur), { trip, role: 'mid' });
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    return map;
  }, [trips]);

  const isInCurrentMonth = (d: Date) =>
    d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  const isToday = (d: Date) => toDateStr(d) === today;

  function handleCellClick(ds: string, inMonth: boolean) {
    const events = eventMap[ds] ?? [];
    if (events.length > 0) {
      setSelectedDate(selectedDate === ds ? null : ds);
    } else if (inMonth && ds >= today) {
      onAddTrip(ds);
    }
  }

  const selectedEvents = selectedDate ? (eventMap[selectedDate] ?? []) : [];

  // Unique trips visible in the selected date detail
  const selectedTrips = useMemo<Array<{ trip: Trip; role: EventEntry['role'] }>>(() => {
    const seen = new Set<string>();
    return selectedEvents.filter((e) => {
      const key = e.trip.id + e.role;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedEvents]);

  return (
    <div className="rounded-[20px] overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111]">

      {/* ── Calendar Header ── */}
      <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[18px] font-semibold text-zinc-900 dark:text-white tracking-tight">
            {MONTH_NAMES[viewMonth]}
          </h2>
          <span className="text-[15px] text-zinc-400 dark:text-zinc-600 font-normal">
            {viewYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            Today
          </button>
          <div className="flex items-center">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronLeft size={15} strokeWidth={2} />
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ChevronRight size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Day Headers ── */}
      <div className="grid grid-cols-7 border-t border-b border-zinc-100 dark:border-zinc-800/80">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-2 text-center',
              i < 6 && 'border-r border-zinc-100 dark:border-zinc-800/80'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-semibold tracking-wide',
                i === 0 || i === 6
                  ? 'text-zinc-400 dark:text-zinc-600'
                  : 'text-zinc-400 dark:text-zinc-500'
              )}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* ── Day Grid ── */}
      <div className="grid grid-cols-7">
        {cells.map((date, idx) => {
          const ds = toDateStr(date);
          const inMonth = isInCurrentMonth(date);
          const today_ = isToday(date);
          const isSat = date.getDay() === 6;
          const isLastRow = idx >= cells.length - 7;
          const isLastCol = date.getDay() === 6;
          const isSelected = ds === selectedDate;

          const events = eventMap[ds] ?? [];
          const hasEvents = events.length > 0;
          const depEvents = events.filter((e) => e.role === 'dep');
          const retEvents = events.filter((e) => e.role === 'ret');
          const hasMid = events.some((e) => e.role === 'mid') && depEvents.length === 0 && retEvents.length === 0;
          const isFutureEmpty = inMonth && ds >= today && !hasEvents;
          const isClickable = hasEvents || isFutureEmpty;

          return (
            <div
              key={ds}
              onClick={() => handleCellClick(ds, inMonth)}
              className={cn(
                'relative flex flex-col pt-2 pb-1.5 px-1 min-h-[76px] sm:min-h-[88px]',
                'border-b border-r border-zinc-100 dark:border-zinc-800/60',
                isLastRow && 'border-b-0',
                isLastCol && 'border-r-0',
                !inMonth && 'bg-zinc-50/60 dark:bg-[#0d0d0d]',
                hasMid && inMonth && !isSelected && 'bg-zinc-50 dark:bg-zinc-900/40',
                isSelected && 'bg-zinc-100 dark:bg-zinc-800/60',
                isClickable && 'cursor-pointer',
                hasEvents && inMonth && 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                isFutureEmpty && 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 group',
              )}
            >
              {/* Day number */}
              <div className="flex justify-center mb-1.5">
                <span
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-[13px] leading-none select-none transition-all',
                    today_
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                      : !inMonth
                      ? 'text-zinc-300 dark:text-zinc-700 font-normal'
                      : isSat || date.getDay() === 0
                      ? 'text-zinc-400 dark:text-zinc-500 font-medium'
                      : 'text-zinc-700 dark:text-zinc-300 font-medium'
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Add hint on empty future days */}
              {isFutureEmpty && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Plus size={14} className="text-zinc-300 dark:text-zinc-600" strokeWidth={2} />
                </div>
              )}

              {/* Event chips */}
              <div className="flex flex-col gap-[3px] px-0.5">
                {depEvents.slice(0, 2).map((entry) => {
                  const isBooked = entry.trip.status === 'flight_booked';
                  const isPlanning = entry.trip.status === 'planning';
                  return (
                    <button
                      key={entry.trip.id + '-dep'}
                      onClick={(e) => { e.stopPropagation(); onTripEdit(entry.trip); }}
                      title={`Edit: ${entry.trip.title} — ${entry.trip.fromCode} → ${entry.trip.toCode}`}
                      className={cn(
                        'rounded-[4px] px-1 py-[2px] text-[9px] font-bold leading-none truncate text-left transition-opacity hover:opacity-70',
                        isBooked
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : isPlanning
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                          : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200'
                      )}
                    >
                      ↑ {entry.trip.fromCode}→{entry.trip.toCode}
                    </button>
                  );
                })}

                {retEvents.slice(0, 1).map((entry) => (
                  <button
                    key={entry.trip.id + '-ret'}
                    onClick={(e) => { e.stopPropagation(); onTripEdit(entry.trip); }}
                    title={`Edit: ${entry.trip.title} — Return`}
                    className="rounded-[4px] px-1 py-[2px] text-[9px] font-semibold leading-none truncate text-left transition-opacity hover:opacity-70 bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500"
                  >
                    ↓ {entry.trip.toCode}→{entry.trip.fromCode}
                  </button>
                ))}

                {/* In-transit dot indicator */}
                {hasMid && (
                  <div className="flex justify-center pt-0.5">
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected Day Detail Panel ── */}
      {selectedDate && selectedTrips.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-5 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold tracking-[0.15em] text-zinc-400 dark:text-zinc-500 uppercase">
              {formatDateLabel(selectedDate)}
            </p>
            <button
              onClick={() => setSelectedDate(null)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          <div className="space-y-2.5">
            {selectedTrips.map(({ trip, role }) => {
              const statusCfg = TRIP_STATUS_CONFIG[trip.status];
              return (
                <div
                  key={trip.id + role}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Role label */}
                    <span className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-600 uppercase shrink-0 w-16">
                      {roleLabel(role)}
                    </span>

                    {/* Route */}
                    <span className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none shrink-0">
                      {trip.fromCode}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700 text-sm">→</span>
                    <span className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none shrink-0">
                      {trip.toCode}
                    </span>

                    {/* Title + airline */}
                    <div className="min-w-0 hidden sm:block">
                      <p className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
                        {trip.title}
                      </p>
                      {trip.airline && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 truncate">
                          {trip.airline}
                          {trip.bookingReference && (
                            <span className="font-mono ml-1.5 opacity-70">{trip.bookingReference}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.14em]',
                        statusCfg.pillClass
                      )}
                    >
                      {statusCfg.label}
                    </span>
                    <button
                      onClick={() => onTripEdit(trip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                    >
                      <Pencil size={11} strokeWidth={2.5} />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state hint ── */}
      {!selectedDate && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-5 sm:px-6 py-3">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            Click a trip chip to edit · Click an empty future day to add a trip
          </p>
        </div>
      )}

    </div>
  );
}
