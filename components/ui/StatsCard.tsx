import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number;
  subtext?: string;
  variant?: 'default' | 'critical';
  className?: string;
}

export function StatsCard({ label, value, subtext, variant = 'default', className }: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border px-5 py-4 transition-colors',
      variant === 'critical'
        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-white'
        : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900',
      className
    )}>
      <p className={cn(
        'text-[11px] font-semibold uppercase tracking-widest mb-2',
        variant === 'critical' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'
      )}>
        {label}
      </p>
      <p className={cn(
        'text-4xl font-bold tracking-tight',
        variant === 'critical' ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-50'
      )}>
        {value}
      </p>
      {subtext && (
        <p className={cn(
          'text-xs mt-1',
          variant === 'critical' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'
        )}>
          {subtext}
        </p>
      )}
    </div>
  );
}
