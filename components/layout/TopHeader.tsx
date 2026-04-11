'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Tasks',  href: '/tasks' },
  { label: 'Goals',  href: '/goals' },
  { label: 'Travel', href: '/travel' },
  // { label: 'Roadmap', href: '/roadmap' }, // hidden — work in progress
];

export function TopHeader() {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-200/70 dark:border-zinc-800/70"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Icon: 2×2 grid, top-left cell highlighted */}
          <div className="w-[22px] h-[22px] bg-zinc-900 dark:bg-white rounded-[5px] grid grid-cols-2 gap-[2.5px] p-[4px] shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-[1.5px]" />
            <div className="bg-white/30 dark:bg-zinc-900/30 rounded-[1.5px]" />
            <div className="bg-white/30 dark:bg-zinc-900/30 rounded-[1.5px]" />
            <div className="bg-white/30 dark:bg-zinc-900/30 rounded-[1.5px]" />
          </div>
          <span className="tracking-tight leading-none hidden sm:block" style={{ letterSpacing: '-0.025em' }}>
            <span className="text-[14px] font-medium text-zinc-400 dark:text-zinc-500">my</span>
            <span className="text-[15px] font-black text-zinc-900 dark:text-white">Space</span>
          </span>
        </div>

        {/* Nav — desktop only; mobile uses BottomNav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-1.5 text-[13px] font-medium rounded-md transition-all',
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right area */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <Link
            href="/settings"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
              pathname === '/settings'
                ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            aria-label="Settings"
          >
            <Settings size={14} />
          </Link>
          <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center">
            <span className="text-[11px] font-semibold text-white dark:text-zinc-900 leading-none">D</span>
          </div>
        </div>
      </div>
    </header>
  );
}
