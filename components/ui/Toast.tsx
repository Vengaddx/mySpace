'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Positioned above bottom nav on mobile, bottom-right on desktop */}
      <div
        className="fixed z-[200] flex flex-col gap-2 items-center pointer-events-none"
        style={{
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastBubble key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastBubble({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const config = {
    success: {
      icon: <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />,
      cls: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
      cls: 'bg-red-500 text-white',
    },
    info: {
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
      cls: 'bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900',
    },
  }[item.type];

  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
      onClick={onDismiss}
      className={cn(
        'pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg text-[13px] font-semibold whitespace-nowrap cursor-pointer select-none',
        config.cls
      )}
    >
      {config.icon}
      {item.message}
    </motion.button>
  );
}
