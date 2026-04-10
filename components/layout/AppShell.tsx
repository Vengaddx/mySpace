import { TopHeader } from './TopHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen transition-colors">
      <TopHeader />
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
