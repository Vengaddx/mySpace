import { getGoals } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { PageContainer } from '@/components/layout/PageContainer';
import { GoalsClient } from '@/components/goals/GoalsClient';

export default async function GoalsPage() {
  const goals = await getGoals();
  return (
    <PageContainer>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">
          Personal
        </p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Goals</h1>
      </div>
      <GoalsClient initialGoals={goals} />
    </PageContainer>
  );
}
