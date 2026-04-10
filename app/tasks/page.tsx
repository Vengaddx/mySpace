import { getTasks, getProjects } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { TasksClient } from '@/components/tasks/TasksClient';

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([getTasks(), getProjects()]);
  return <TasksClient initialTasks={tasks} initialProjects={projects} />;
}
