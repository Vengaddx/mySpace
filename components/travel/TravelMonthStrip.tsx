'use client';

import { Trip, TRIP_STATUS_CONFIG } from '@/lib/travel-data';
import { cn } from '@/lib/utils';

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

interface TravelMonthStripProps {
  trips: Trip[];
  today: string;
}

export function TravelMonthStrip({ trips, today }: TravelMonthStripProps) {
  const year = new Date(today).getFullYear();
  const currentMonth = new Date(today).getMonth(); // 0-indexed

  // Build a map: month index → trips in that month
  const tripsByMonth: Record<number, Trip[]> = {};
  trips.forEach((trip) => {
    const depDate = new Date(trip.departureDate + 'T00:00:00');
    if (depDate.getFullYear() === year) {
      const m = depDate.getMonth();
      if (!tripsByMonth[m]) tripsByMonth[m] = [];
      tripsByMonth[m].push(trip);
    }
  });

  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 dark:text-zinc-600 mb-3 uppercase">
        {year} Travel Overview
      </p>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {MONTHS.map((month, idx) => {
          const monthTrips = tripsByMonth[idx] ?? [];
          const hasTrip = monthTrips.length > 0;
          const isPast = idx < currentMonth;
          const isCurrent = idx === currentMonth;

          // Determine the most prominent status for dot color
          const hasBooked = monthTrips.some((t) => t.status === 'flight_booked');
          const hasPlanning = monthTrips.some((t) => t.status === 'planning' || t.status === 'ticket_pending');

          return (
            <div
              key={month}
              className={cn(
                'rounded-xl p-2 flex flex-col items-center gap-1.5 transition-all',
                isCurrent
                  ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                  : hasTrip
                  ? 'bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800'
                  : 'bg-transparent border border-transparent'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold tracking-wider',
                  isCurrent
                    ? 'text-zinc-700 dark:text-zinc-200'
                    : isPast && !hasTrip
                    ? 'text-zinc-300 dark:text-zinc-700'
                    : hasTrip
                    ? 'text-zinc-600 dark:text-zinc-400'
                    : 'text-zinc-300 dark:text-zinc-700'
                )}
              >
                {month}
              </span>

              {hasTrip ? (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {monthTrips.slice(0, 3).map((t) => {
                    const dotCls = TRIP_STATUS_CONFIG[t.status].dotClass;
                    return (
                      <span
                        key={t.id}
                        className={cn('w-1.5 h-1.5 rounded-full', dotCls)}
                        title={t.title}
                      />
                    );
                  })}
                </div>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
