import { TopHeader } from './TopHeader';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      <OfflineBanner />
      <div className="flex flex-col h-dvh transition-colors">
        <TopHeader />
        {/* Only this area scrolls — gives native app feel */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)]"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
          } as React.CSSProperties}
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
