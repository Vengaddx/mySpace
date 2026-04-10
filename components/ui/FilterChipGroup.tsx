'use client';

import { cn } from '@/lib/utils';
import { FilterChip } from '@/types';

const chips: { value: FilterChip; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'aramco', label: 'Aramco' },
  { value: 'satorp', label: 'SATORP' },
  { value: 'pmo', label: 'PMO' },
  { value: 'personal', label: 'Personal' },
];

interface FilterChipGroupProps {
  value: FilterChip;
  onChange: (v: FilterChip) => void;
  className?: string;
}

export function FilterChipGroup({ value, onChange, className }: FilterChipGroupProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {chips.map((chip) => (
        <button
          key={chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            value === chip.value
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
