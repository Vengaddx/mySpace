import { mockTasks, mockProjects } from '@/lib/mock-data';
import { TasksClient } from '@/components/tasks/TasksClient';

export default function TasksPage() {
  return <TasksClient initialTasks={mockTasks} initialProjects={mockProjects} />;
}
