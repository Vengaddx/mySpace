import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-full transition-colors" style={{ height: '100dvh' }}>
      <TopHeader />
      {/* Only this area scrolls — gives native app feel */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden lg:pb-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        } as React.CSSProperties}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
