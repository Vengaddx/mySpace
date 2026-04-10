'use client';

import { Trip, formatTravelDateShort, getNextTrip } from '@/lib/travel-data';
import { cn } from '@/lib/utils';

interface TravelSummaryStripProps {
  trips: Trip[];
  today: string;
}

export function TravelSummaryStrip({ trips, today }: TravelSummaryStripProps) {
  const total = trips.length;
  const booked = trips.filter((t) => t.status === 'flight_booked').length;
  const planning = trips.filter((t) => t.status === 'planning').length;
  const completed = trips.filter((t) => t.status === 'completed').length;
  const nextTrip = getNextTrip(trips, today);

  const stats = [
    { label: 'TRIPS THIS YEAR', value: String(total) },
    { label: 'FLIGHT BOOKED', value: String(booked), highlight: booked > 0 },
    { label: 'PLANNING', value: String(planning) },
    { label: 'COMPLETED', value: String(completed) },
    {
      label: 'NEXT DEPARTURE',
      value: nextTrip ? formatTravelDateShort(nextTrip.departureDate) : '—',
      wide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cn(
            'rounded-xl border px-4 py-3 flex flex-col gap-1',
            s.highlight
              ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100'
              : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
          )}
        >
          <span
            className={cn(
              'text-[10px] font-semibold tracking-widest',
              s.highlight
                ? 'text-zinc-400 dark:text-zinc-600'
                : 'text-zinc-400 dark:text-zinc-600'
            )}
          >
            {s.label}
          </span>
          <span
            className={cn(
              'text-2xl font-bold tracking-tight leading-none',
              s.highlight
                ? 'text-white dark:text-zinc-900'
                : 'text-zinc-900 dark:text-white'
            )}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
