import { getTasks, getProjects } from '@/lib/db';
import WeekPageClient from './_client';

export default async function WeekPage() {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);
  return <WeekPageClient initialTasks={tasks} initialProjects={projects} />;
}
