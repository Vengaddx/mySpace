import { getGoals } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { PageContainer } from '@/components/layout/PageContainer';
import { GoalsClient } from '@/components/goals/GoalsClient';

export default async function GoalsPage() {
  const goals = await getGoals();
  return (
    <PageContainer>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Goals</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Track habits and milestones</p>
      </div>
      <GoalsClient initialGoals={goals} />
    </PageContainer>
  );
}
