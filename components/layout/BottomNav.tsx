'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckSquare, Target, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Tasks',  href: '/tasks',  icon: CheckSquare },
  { label: 'Goals',  href: '/goals',  icon: Target },
  { label: 'Travel', href: '/travel', icon: Plane },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      {/* Liquid glass pill */}
      <div className="liquid-glass relative rounded-[26px] overflow-hidden">
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 select-none"
              >
                {/* Liquid sliding pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-[6px] rounded-[18px] bg-zinc-900 dark:bg-zinc-100"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                      mass: 0.9,
                    }}
                  />
                )}

                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={cn(
                    'relative z-10 transition-all duration-200',
                    isActive
                      ? 'text-white dark:text-zinc-900'
                      : 'text-zinc-400 dark:text-zinc-500'
                  )}
                />
                <span
                  className={cn(
                    'relative z-10 text-[10px] font-semibold tracking-wide transition-all duration-200',
                    isActive
                      ? 'text-white dark:text-zinc-900'
                      : 'text-zinc-400 dark:text-zinc-500'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
