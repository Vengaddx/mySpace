import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-full transition-colors">
      <TopHeader />
      {/* Only this area scrolls — gives native app feel */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-20 lg:pb-0"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' } as React.CSSProperties}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
