import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
