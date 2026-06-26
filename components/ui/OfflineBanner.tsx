'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/use-online-status';
import { useToast } from '@/components/ui/Toast';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { toast } = useToast();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast('Back online', 'success');
    }
  }, [online, toast]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed z-[150] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 text-white text-[12px] font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none"
          style={{ top: 'calc(3.5rem + env(safe-area-inset-top) + 0.5rem)' }}
        >
          <WifiOff size={13} strokeWidth={2.5} />
          You&apos;re offline — changes won&apos;t be saved
        </motion.div>
      )}
    </AnimatePresence>
  );
}
