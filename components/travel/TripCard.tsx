'use client';

import {
  Trip,
  TRIP_STATUS_CONFIG,
  TRIP_TYPE_LABELS,
  formatTravelDateShort,
  formatTravelDate,
} from '@/lib/travel-data';
import { cn } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  featured?: boolean;
}

export function TripCard({ trip, onEdit, featured }: TripCardProps) {
  const statusCfg = TRIP_STATUS_CONFIG[trip.status];
  const isCompleted = trip.status === 'completed';
  const isCancelled = trip.status === 'cancelled';
  const dimmed = isCompleted || isCancelled;

  return (
    <button
      onClick={() => onEdit?.(trip)}
      className={cn(
        'w-full text-left rounded-2xl border transition-all duration-200',
        'group focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400',
        dimmed
          ? 'bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700/60'
          : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
        featured && 'ring-1 ring-zinc-300 dark:ring-zinc-700'
      )}
    >
      <div className="p-5 sm:p-6">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Route */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[28px] sm:text-[32px] font-bold tracking-tight leading-none',
                dimmed
                  ? 'text-zinc-400 dark:text-zinc-600'
                  : 'text-zinc-900 dark:text-white'
              )}
            >
              {trip.fromCode}
            </span>
            <span
              className={cn(
                'text-base font-light',
                dimmed ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-400 dark:text-zinc-600'
              )}
            >
              →
            </span>
            <span
              className={cn(
                'text-[28px] sm:text-[32px] font-bold tracking-tight leading-none',
                dimmed
                  ? 'text-zinc-400 dark:text-zinc-600'
                  : 'text-zinc-900 dark:text-white'
              )}
            >
              {trip.toCode}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.14em] shrink-0',
              statusCfg.pillClass
            )}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Trip title and type */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              'text-[13px] font-medium',
              dimmed
                ? 'text-zinc-400 dark:text-zinc-600'
                : 'text-zinc-600 dark:text-zinc-400'
            )}
          >
            {trip.title}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-600 uppercase">
            {TRIP_TYPE_LABELS[trip.tripType]}
          </span>
        </div>

        {/* Date row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-600">
              DEP
            </span>
            <span
              className={cn(
                'text-[13px] font-semibold',
                dimmed
                  ? 'text-zinc-400 dark:text-zinc-600'
                  : 'text-zinc-700 dark:text-zinc-300'
              )}
            >
              {formatTravelDateShort(trip.departureDate)}
            </span>
          </div>

          {trip.returnDate && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-600">
                RTN
              </span>
              <span
                className={cn(
                  'text-[13px] font-semibold',
                  dimmed
                    ? 'text-zinc-400 dark:text-zinc-600'
                    : 'text-zinc-700 dark:text-zinc-300'
                )}
              >
                {formatTravelDateShort(trip.returnDate)}
              </span>
            </div>
          )}

          {trip.airline && (
            <>
              <span className="text-zinc-200 dark:text-zinc-800 text-xs">·</span>
              <span
                className={cn(
                  'text-[12px]',
                  dimmed
                    ? 'text-zinc-400 dark:text-zinc-600'
                    : 'text-zinc-500 dark:text-zinc-500'
                )}
              >
                {trip.airline}
                {trip.bookingReference && (
                  <span className="font-mono ml-1.5 text-[11px] opacity-70">
                    {trip.bookingReference}
                  </span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Notes */}
        {trip.notes && (
          <p
            className={cn(
              'mt-3 text-[12px] leading-relaxed line-clamp-1',
              dimmed
                ? 'text-zinc-400 dark:text-zinc-700'
                : 'text-zinc-400 dark:text-zinc-600'
            )}
          >
            {trip.notes}
          </p>
        )}
      </div>
    </button>
  );
}
