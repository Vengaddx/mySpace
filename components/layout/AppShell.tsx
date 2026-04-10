import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen transition-colors">
      <TopHeader />
      <main className="pt-14 pb-28 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
