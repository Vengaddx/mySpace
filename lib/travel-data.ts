export type TripStatus =
  | 'planning'
  | 'flight_booked'
  | 'ticket_pending'
  | 'visa_pending'
  | 'completed'
  | 'cancelled';

export type TripType =
  | 'india'
  | 'family_visit'
  | 'vacation'
  | 'business'
  | 'personal';

export interface Trip {
  id: string;
  title: string;
  fromCity: string;
  toCity: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  returnDate?: string;
  status: TripStatus;
  tripType: TripType;
  airline?: string;
  bookingReference?: string;
  notes?: string;
  reminderAt?: string;
  isRoundTrip: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TRIP_STATUS_CONFIG: Record<
  TripStatus,
  { label: string; pillClass: string; heroPillClass: string; dotClass: string }
> = {
  flight_booked: {
    label: 'FLIGHT BOOKED',
    pillClass:
      'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 ring-0',
    heroPillClass:
      'bg-white text-zinc-950',
    dotClass: 'bg-white',
  },
  planning: {
    label: 'PLANNING',
    pillClass:
      'bg-transparent border border-zinc-700 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400',
    heroPillClass:
      'bg-zinc-800/60 text-zinc-300 border border-zinc-700',
    dotClass: 'bg-zinc-500',
  },
  ticket_pending: {
    label: 'TICKET PENDING',
    pillClass:
      'bg-zinc-800 dark:bg-zinc-800 text-zinc-300 border border-zinc-700',
    heroPillClass:
      'bg-zinc-700/80 text-zinc-200 border border-zinc-600',
    dotClass: 'bg-zinc-400',
  },
  visa_pending: {
    label: 'VISA PENDING',
    pillClass:
      'bg-zinc-800 dark:bg-zinc-800 text-zinc-300 border border-zinc-700',
    heroPillClass:
      'bg-zinc-700/80 text-zinc-200 border border-zinc-600',
    dotClass: 'bg-zinc-400',
  },
  completed: {
    label: 'COMPLETED',
    pillClass:
      'bg-transparent text-zinc-500 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800',
    heroPillClass:
      'bg-transparent text-zinc-500 border border-zinc-700',
    dotClass: 'bg-zinc-600',
  },
  cancelled: {
    label: 'CANCELLED',
    pillClass:
      'bg-transparent text-zinc-400 dark:text-zinc-700 border border-zinc-200 dark:border-zinc-800',
    heroPillClass:
      'bg-transparent text-zinc-600 border border-zinc-800',
    dotClass: 'bg-zinc-700',
  },
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  india: 'India',
  family_visit: 'Family Visit',
  vacation: 'Vacation',
  business: 'Business',
  personal: 'Personal',
};

export const mockTrips: Trip[] = [
  {
    id: '1',
    title: 'Annual India Trip',
    fromCity: 'Dammam',
    toCity: 'Chennai',
    fromCode: 'DMM',
    toCode: 'MAA',
    departureDate: '2026-05-12',
    returnDate: '2026-05-28',
    status: 'flight_booked',
    tripType: 'india',
    airline: 'Air Arabia',
    bookingReference: 'AR7X9K',
    notes: 'Annual family visit. School holidays.',
    isRoundTrip: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
  },
  {
    id: '2',
    title: 'Eid Family Visit',
    fromCity: 'Dammam',
    toCity: 'Chennai',
    fromCode: 'DMM',
    toCode: 'MAA',
    departureDate: '2026-03-28',
    returnDate: '2026-04-06',
    status: 'completed',
    tripType: 'family_visit',
    airline: 'IndiGo',
    bookingReference: 'IG4M2P',
    notes: 'Eid holidays. 9 days.',
    isRoundTrip: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-04-06T20:00:00Z',
  },
  {
    id: '3',
    title: 'Europe Vacation',
    fromCity: 'Dammam',
    toCity: 'Paris',
    fromCode: 'DMM',
    toCode: 'CDG',
    departureDate: '2026-08-15',
    returnDate: '2026-08-28',
    status: 'planning',
    tripType: 'vacation',
    notes: 'Summer Europe trip — Paris + Amsterdam.',
    isRoundTrip: true,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: '4',
    title: 'Dubai Conference',
    fromCity: 'Dammam',
    toCity: 'Dubai',
    fromCode: 'DMM',
    toCode: 'DXB',
    departureDate: '2026-06-08',
    returnDate: '2026-06-10',
    status: 'ticket_pending',
    tripType: 'business',
    notes: 'Tech conference. 2 nights.',
    isRoundTrip: true,
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-25T10:00:00Z',
  },
  {
    id: '5',
    title: 'Winter India Trip',
    fromCity: 'Dammam',
    toCity: 'Chennai',
    fromCode: 'DMM',
    toCode: 'MAA',
    departureDate: '2026-12-20',
    returnDate: '2027-01-08',
    status: 'planning',
    tripType: 'india',
    notes: 'Christmas and New Year at home.',
    isRoundTrip: true,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

// Format date as "12 MAY 2026"
export function formatTravelDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

// Format date as "12 MAY"
export function formatTravelDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toUpperCase();
}

// Format month as "MAY"
export function formatMonth(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
}

export function getUpcomingTrips(trips: Trip[], today: string): Trip[] {
  return trips
    .filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        t.departureDate >= today
    )
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

export function getNextTrip(trips: Trip[], today: string): Trip | null {
  return getUpcomingTrips(trips, today)[0] ?? null;
}
