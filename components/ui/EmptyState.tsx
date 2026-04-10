import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        {icon ?? <CheckCircle2 className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
