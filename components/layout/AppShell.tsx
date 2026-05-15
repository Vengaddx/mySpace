import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      <div className="flex flex-col h-full transition-colors">
        <TopHeader />
        {/* Only this area scrolls — gives native app feel */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden lg:pb-0"
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
    </ToastProvider>
  );
}
