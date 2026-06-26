'use client';

import { useState, useMemo } from 'react';
import { Plus, MapPin, List, CalendarDays } from 'lucide-react';
import { Trip, getNextTrip } from '@/lib/travel-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api-client';
import { TravelSummaryStrip } from './TravelSummaryStrip';
import { TravelHeroCard, TravelHeroEmpty } from './TravelHeroCard';
import { TripCard } from './TripCard';
import { TravelCalendar } from './TravelCalendar';
import { AddTripDialog } from './AddTripDialog';

const TODAY = new Date().toISOString().slice(0, 10);

type View = 'list' | 'calendar';

interface TravelClientProps { initialTrips: Trip[] }

export function TravelClient({ initialTrips }: TravelClientProps) {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [view, setView] = useState<View>('list');

  const nextTrip = useMemo(() => getNextTrip(trips, TODAY), [trips]);

  const upcoming = useMemo(
    () =>
      trips
        .filter(
          (t) =>
            t.status !== 'completed' &&
            t.status !== 'cancelled' &&
            t.departureDate >= TODAY
        )
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate)),
    [trips]
  );

  const past = useMemo(
    () =>
      trips
        .filter(
          (t) =>
            t.status === 'completed' ||
            t.status === 'cancelled' ||
            t.departureDate < TODAY
        )
        .sort((a, b) => b.departureDate.localeCompare(a.departureDate)),
    [trips]
  );

  function openAddDialog(date?: string) {
    setEditTrip(null);
    setPrefillDate(date);
    setDialogOpen(true);
  }

  function openEditDialog(trip: Trip) {
    setEditTrip(trip);
    setPrefillDate(undefined);
    setDialogOpen(true);
  }

  function handleSave(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editTrip) {
      const prev = editTrip;
      const updated: Trip = { ...editTrip, ...data, updatedAt: new Date().toISOString() };
      setTrips((ts) => ts.map((t) => t.id === editTrip.id ? updated : t));
      api(`/api/trips/${editTrip.id}`, 'PUT', data, () => {
        setTrips((ts) => ts.map((t) => t.id === prev.id ? prev : t));
        toast('Failed to save trip', 'error');
      });
    } else {
      const newTrip: Trip = {
        ...data,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTrips((prev) => [...prev, newTrip]);
      api('/api/trips', 'POST', newTrip, () => {
        setTrips((prev) => prev.filter((t) => t.id !== newTrip.id));
        toast('Failed to create trip', 'error');
      });
    }
  }

  function handleDelete(id: string) {
    const removed = trips.find((t) => t.id === id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    api(`/api/trips/${id}`, 'DELETE', undefined, () => {
      if (removed) setTrips((prev) => [...prev, removed]);
      toast('Failed to delete trip', 'error');
    });
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Travel
            </h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Track trips, bookings, and annual travel plans
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl p-1 flex-1 sm:flex-none">
              <button
                onClick={() => setView('list')}
                className={cn(
                  'flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150',
                  view === 'list'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                <List size={13} strokeWidth={2.5} />
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={cn(
                  'flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150',
                  view === 'calendar'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                <CalendarDays size={13} strokeWidth={2.5} />
                Calendar
              </button>
            </div>

            <button
              onClick={() => openAddDialog()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] sm:text-[13px] font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Add Trip</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* ── Summary strip (always visible) ── */}
        <div className="mb-7">
          <TravelSummaryStrip trips={trips} today={TODAY} />
        </div>

        {/* ── List View ── */}
        {view === 'list' && (
          <>
            {/* Next trip hero */}
            <div className="mb-8">
              <SectionLabel>Next Trip</SectionLabel>
              {nextTrip ? (
                <TravelHeroCard trip={nextTrip} />
              ) : (
                <TravelHeroEmpty />
              )}
            </div>

            {/* Upcoming (after featured next trip) */}
            {upcoming.length > 1 && (
              <div className="mb-8">
                <SectionLabel>Upcoming</SectionLabel>
                <div className="space-y-2.5">
                  {upcoming.slice(1).map((trip) => (
                    <TripCard key={trip.id} trip={trip} onEdit={openEditDialog} />
                  ))}
                </div>
              </div>
            )}

            {/* Past trips */}
            {past.length > 0 && (
              <div>
                <SectionLabel>Past Trips</SectionLabel>
                <div className="space-y-2.5">
                  {past.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onEdit={openEditDialog} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {trips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <MapPin size={28} className="text-zinc-300 dark:text-zinc-700" />
                <p className="text-zinc-400 dark:text-zinc-600 text-sm">
                  No trips yet. Add your first trip.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Calendar View ── */}
        {view === 'calendar' && (
          <TravelCalendar
            trips={trips}
            today={TODAY}
            onTripEdit={openEditDialog}
            onAddTrip={openAddDialog}
          />
        )}

      </div>

      <AddTripDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editTrip={editTrip}
        prefillDate={prefillDate}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 dark:text-zinc-600 uppercase mb-3">
      {children}
    </p>
  );
}
