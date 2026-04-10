'use client';

import {
  Trip,
  TRIP_STATUS_CONFIG,
  TRIP_TYPE_LABELS,
  formatTravelDate,
  formatTravelDateShort,
} from '@/lib/travel-data';
import { cn } from '@/lib/utils';

interface TravelHeroCardProps {
  trip: Trip;
}

export function TravelHeroCard({ trip }: TravelHeroCardProps) {
  const statusCfg = TRIP_STATUS_CONFIG[trip.status];

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-7 sm:p-10">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top row: status + type */}
      <div className="relative flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              statusCfg.dotClass
            )}
          />
          <span
            className={cn(
              'inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-[0.15em]',
              statusCfg.heroPillClass
            )}
          >
            {statusCfg.label}
          </span>
        </div>

        <span className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mt-1">
          {TRIP_TYPE_LABELS[trip.tripType]}
        </span>
      </div>

      {/* Route — hero element */}
      <div className="relative mb-2">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-[52px] sm:text-[68px] font-bold tracking-tight leading-none text-white">
            {trip.fromCode}
          </span>

          <div className="flex-1 flex items-center gap-0 min-w-0">
            <div className="flex-1 h-px bg-zinc-700" />
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[10px] border-l-zinc-600 shrink-0" />
          </div>

          <span className="text-[52px] sm:text-[68px] font-bold tracking-tight leading-none text-white">
            {trip.toCode}
          </span>
        </div>

        {/* City names */}
        <div className="flex items-start justify-between mt-2">
          <span className="text-[13px] text-zinc-500 tracking-wide">
            {trip.fromCity}
          </span>
          <span className="text-[13px] text-zinc-500 tracking-wide text-right">
            {trip.toCity}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="relative border-t border-zinc-800 my-7" />

      {/* Dates */}
      <div className="relative grid grid-cols-2 gap-6 mb-7">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-600 mb-1.5">
            DEPARTURE
          </p>
          <p className="text-[22px] sm:text-[26px] font-bold tracking-tight text-white leading-none">
            {formatTravelDate(trip.departureDate)}
          </p>
        </div>

        {trip.returnDate && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-600 mb-1.5">
              RETURN
            </p>
            <p className="text-[22px] sm:text-[26px] font-bold tracking-tight text-white leading-none">
              {formatTravelDate(trip.returnDate)}
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative border-t border-zinc-800/60 my-6" />

      {/* Bottom meta */}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          {trip.airline && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-zinc-600 mb-0.5">
                AIRLINE
              </p>
              <p className="text-[14px] font-semibold text-zinc-300">
                {trip.airline}
              </p>
            </div>
          )}
          {trip.bookingReference && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-zinc-600 mb-0.5">
                BOOKING REF
              </p>
              <p className="text-[14px] font-mono font-semibold text-zinc-300 tracking-wider">
                {trip.bookingReference}
              </p>
            </div>
          )}
        </div>

        {trip.notes && (
          <p className="text-[13px] text-zinc-500 max-w-xs text-right leading-relaxed">
            {trip.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// Placeholder when no upcoming trip
export function TravelHeroEmpty() {
  return (
    <div className="rounded-[24px] bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-10 flex flex-col items-center justify-center gap-3 min-h-[240px] text-center">
      <span className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">
        No Upcoming Trips
      </span>
      <p className="text-zinc-700 text-sm">
        Add your first trip to see it here.
      </p>
    </div>
  );
}
