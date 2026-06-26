'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckSquare, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Goals', href: '/goals', icon: Target },
  // { label: 'Roadmap', href: '/roadmap', icon: Map }, // hidden — work in progress
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-200/70 dark:border-zinc-800/70"
      style={{
        height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="h-full flex items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-zinc-900 dark:bg-white"
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.9 }}
                />
              )}

              <Icon
                size={21}
                strokeWidth={isActive ? 2.2 : 1.7}
                className={cn(
                  'transition-all duration-200',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide leading-none transition-all duration-200',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
