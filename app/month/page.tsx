import { getTasks, getProjects, getMonthlyGoals } from '@/lib/db';
import MonthPageClient from './_client';

export default async function MonthPage() {
  const [tasks, projects, goals] = await Promise.all([
    getTasks(),
    getProjects(),
    getMonthlyGoals(),
  ]);
  return <MonthPageClient initialTasks={tasks} initialProjects={projects} initialGoals={goals} />;
}
