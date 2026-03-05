'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { HeartHandshake, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanInterestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export function PlanInterestDialog({
  isOpen,
  onClose,
  planName,
}: PlanInterestDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative w-full max-w-md pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-br from-[rgba(110,231,183,0.16)] to-[rgba(16,185,129,0.08)] blur-xl" />

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(8,16,14,0.96)] shadow-2xl">
                <div className="flex items-start justify-between p-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--mint-accent-gradient)] shadow-[0_12px_28px_rgba(16,185,129,0.2)]">
                      <HeartHandshake className="h-6 w-6 text-[#04120e]" />
                      <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Thanks for the interest</h2>
                      <p className="mt-1 text-sm text-[var(--mint-text-secondary)]">
                        {planName} is not wired to payments yet.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="rounded-xl p-2 text-[var(--mint-text-secondary)] transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <div className="rounded-2xl border border-[rgba(110,231,183,0.18)] bg-[rgba(16,30,24,0.9)] p-4">
                    <p className="text-sm leading-6 text-white/85">
                      Thanks for showing interest in the <span className="font-semibold text-white">{planName}</span>{' '}
                      plan. This is a placeholder checkout step for now. Razorpay can plug into this flow later
                      without changing the page layout.
                    </p>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/explore');
                      }}
                      className="flex-1 rounded-xl bg-[image:var(--mint-accent-gradient)] px-4 py-3 text-sm font-semibold text-[#04120e] shadow-[0_14px_28px_rgba(16,185,129,0.2)] transition-transform hover:-translate-y-0.5"
                    >
                      Explore Instead
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
