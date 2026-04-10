import { mockTasks, mockProjects } from '@/lib/mock-data';
import { TasksClient } from '@/components/tasks/TasksClient';
import { AppShell } from '@/components/layout/AppShell';

export default function TasksPage() {
  return (
    <AppShell>
      <TasksClient initialTasks={mockTasks} initialProjects={mockProjects} />
    </AppShell>
  );
}
