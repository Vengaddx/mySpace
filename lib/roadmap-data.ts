// ─── Types ───────────────────────────────────────────────────────────────────

export type GoalStatus = 'planned' | 'active' | 'on_track' | 'delayed' | 'completed' | 'parked';
export type LifeAreaId =
  | 'health'
  | 'career'
  | 'wealth'
  | 'learning'
  | 'relationships'
  | 'travel'
  | 'systems';

export interface LifeArea {
  id: LifeAreaId;
  name: string;
  color: string; // hex accent
}

export interface RoadmapGoal {
  id: string;
  title: string;
  lifeAreaId: LifeAreaId;
  startDate: string;  // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  status: GoalStatus;
  progress: number;   // 0–100
  notes: string;
  createdAt: string;
}

// ─── Life Areas ──────────────────────────────────────────────────────────────

export const LIFE_AREAS: LifeArea[] = [
  { id: 'health',        name: 'Health',        color: '#f43f5e' },
  { id: 'career',        name: 'Career',        color: '#3b82f6' },
  { id: 'wealth',        name: 'Wealth',        color: '#10b981' },
  { id: 'learning',      name: 'Learning',      color: '#8b5cf6' },
  { id: 'relationships', name: 'Relationships', color: '#ec4899' },
  { id: 'travel',        name: 'Travel',        color: '#f59e0b' },
  { id: 'systems',       name: 'Systems',       color: '#6b7280' },
];

export function getLifeArea(id: LifeAreaId): LifeArea {
  return LIFE_AREAS.find((a) => a.id === id)!;
}

// ─── Status config ────────────────────────────────────────────────────────────

export const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; className: string }> = {
  planned:   { label: 'Planned',   className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  active:    { label: 'Active',    className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' },
  on_track:  { label: 'On Track',  className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' },
  delayed:   { label: 'Delayed',   className: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' },
  completed: { label: 'Completed', className: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' },
  parked:    { label: 'Parked',    className: 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600' },
};

// ─── Mock goals ───────────────────────────────────────────────────────────────

export const MOCK_GOALS: RoadmapGoal[] = [
  {
    id: 'g1',
    title: 'Get fit and reduce belly fat',
    lifeAreaId: 'health',
    startDate: '2026-02-01',
    targetDate: '2026-09-30',
    status: 'active',
    progress: 22,
    notes: 'Gym 4x/week. Focus on consistency before intensity.',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'g2',
    title: 'Complete AI/ML course',
    lifeAreaId: 'learning',
    startDate: '2026-01-15',
    targetDate: '2026-08-31',
    status: 'on_track',
    progress: 41,
    notes: 'Coursera ML Specialization. 41% done. Aim for 1 module/week.',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'g3',
    title: 'Ship two personal apps',
    lifeAreaId: 'career',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    status: 'active',
    progress: 35,
    notes: 'mySpace is the first. Second app concept TBD by Q3.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g4',
    title: 'Build emergency fund (3 months)',
    lifeAreaId: 'wealth',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    status: 'on_track',
    progress: 55,
    notes: 'Automate 20% savings monthly. Currently at 1.1 months.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g5',
    title: 'Take two meaningful trips',
    lifeAreaId: 'travel',
    startDate: '2026-05-01',
    targetDate: '2026-12-15',
    status: 'planned',
    progress: 5,
    notes: 'India family trip (July) + Europe solo (November). Need to book flights.',
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'g6',
    title: 'Transition into AI-first career',
    lifeAreaId: 'career',
    startDate: '2026-06-01',
    targetDate: '2027-12-31',
    status: 'active',
    progress: 18,
    notes: 'Courses → projects → role or venture. 2-year arc.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g7',
    title: 'Build toward financial independence',
    lifeAreaId: 'wealth',
    startDate: '2027-01-01',
    targetDate: '2030-12-31',
    status: 'planned',
    progress: 0,
    notes: 'Emergency fund → investing → passive income → FI.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g8',
    title: 'Return to India with clarity',
    lifeAreaId: 'relationships',
    startDate: '2028-01-01',
    targetDate: '2029-12-31',
    status: 'planned',
    progress: 0,
    notes: 'Not circumstance, but choice. Need remote income or strong local opportunity.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g9',
    title: 'Health as a lifestyle (not a goal)',
    lifeAreaId: 'health',
    startDate: '2026-10-01',
    targetDate: '2028-12-31',
    status: 'planned',
    progress: 0,
    notes: 'Maintain routine for 1 full year, then health becomes identity.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g10',
    title: 'Experience 10 meaningful places',
    lifeAreaId: 'travel',
    startDate: '2026-07-01',
    targetDate: '2030-06-30',
    status: 'planned',
    progress: 5,
    notes: 'Depth over quantity. 2 per year average.',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// ─── Timeline constants ───────────────────────────────────────────────────────

export const TIMELINE_START = new Date('2026-01-01');
export const TIMELINE_END   = new Date('2030-12-31');
export const TIMELINE_MONTHS = 60; // 5 years

export const MONTH_PX = 40; // pixels per month
export const TIMELINE_WIDTH = TIMELINE_MONTHS * MONTH_PX; // 2400px

/** Months elapsed from TIMELINE_START to a given date */
export function monthsFrom(date: Date): number {
  return (
    (date.getFullYear() - TIMELINE_START.getFullYear()) * 12 +
    (date.getMonth() - TIMELINE_START.getMonth())
  );
}

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
