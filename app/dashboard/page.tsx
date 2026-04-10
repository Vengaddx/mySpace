import { mockTasks } from '@/lib/mock-data';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1
          className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', letterSpacing: '-0.02em' }}
        >
          Activity
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Monthly task completion by workstream</p>
      </div>
      <DashboardClient tasks={mockTasks} />
    </PageContainer>
  );
}
