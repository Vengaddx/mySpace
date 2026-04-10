'use client';

import React, { useState } from 'react';
import { mockGoalsList } from '@/lib/mock-data';
import { Goal } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { GoalsClient } from '@/components/goals/GoalsClient';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoalsList);

  return (
    <AppShell>
      <PageContainer>
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500 mb-1">
            Personal
          </p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Goals
          </h1>
        </div>

        <GoalsClient initialGoals={goals} />
      </PageContainer>
    </AppShell>
  );
}
