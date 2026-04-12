import { cn } from '@/lib/utils';
import { Priority, Status, Workstream } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium', className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    low:      'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
    medium:   'bg-accent-cyan/15 text-zinc-800 dark:text-zinc-100 ring-1 ring-accent-cyan/40',
    high:     'bg-accent-lime/20 text-zinc-800 dark:text-zinc-100 ring-1 ring-accent-lime/50',
    critical: 'bg-accent-orange/20 text-zinc-900 dark:text-zinc-100 ring-1 ring-accent-orange/50',
  };
  const labels: Record<Priority, string> = {
    low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
  };
  return <Badge className={styles[priority]}>{labels[priority]}</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    todo: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
    in_progress: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900',
    done: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
    follow_up: 'bg-accent-orange/15 text-zinc-700 dark:text-zinc-300 ring-1 ring-accent-orange/30',
    send_mail: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300/50',
  };
  const labels: Record<Status, string> = {
    todo: 'To Do', in_progress: 'In Progress', done: 'Done', follow_up: 'Follow Up', send_mail: 'Send Mail',
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}

export function WorkstreamBadge({ workstream }: { workstream: Workstream }) {
  const styles: Record<Workstream, string> = {
    aramco:   'bg-accent-orange/15 text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-orange/35',
    satorp:   'bg-accent-cyan/15   text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-cyan/35',
    pmo:      'bg-accent-lime/15   text-zinc-800 dark:text-zinc-200 ring-1 ring-accent-lime/40',
    personal: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  };
  const labels: Record<Workstream, string> = {
    aramco: 'Aramco', satorp: 'SATORP', pmo: 'PMO', personal: 'Personal',
  };
  return <Badge className={styles[workstream]}>{labels[workstream]}</Badge>;
}
