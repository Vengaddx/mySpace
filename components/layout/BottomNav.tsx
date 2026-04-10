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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      {/* Compact liquid glass pill */}
      <div className="liquid-glass relative rounded-[20px] overflow-hidden w-full max-w-[260px]">
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 select-none"
              >
                {/* Liquid sliding pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-[4px] rounded-[14px] bg-white ring-1 ring-black/[0.07] dark:bg-zinc-800 dark:ring-white/[0.08]"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                      mass: 0.9,
                    }}
                  />
                )}

                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={cn(
                    'relative z-10 transition-all duration-200',
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-400 dark:text-zinc-500'
                  )}
                />
                <span
                  className={cn(
                    'relative z-10 text-[9px] font-semibold tracking-wide leading-none transition-all duration-200',
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
      </div>
    </nav>
  );
}
