'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import useGraphStore from '@/store/graphStore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';

/**
 * Floating Share Button Component (FAB)
 *
 * A modern floating action button that appears in the bottom-right
 * corner of the canvas when a graph is loaded.
 *
 * Features:
 * - Fixed positioning over canvas
 * - Static public/private status indicator
 * - Smooth hover effects with shadows
 * - Glassmorphism design
 * - Always accessible while viewing graph
 */
export const ShareButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const posthog = usePostHog();

  // Get session info from store to determine if we should show the button
  const { sessionId, isPublic } = useGraphStore();

  // Don't show the button if there's no graph loaded
  if (!sessionId) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <AnimatePresence>
        {sessionId && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed top-20 right-6 z-30"
          >
            {/* Main Share Button */}
            <motion.button
              onClick={() => {
                posthog.capture('share_button_clicked', {
                  session_id: sessionId,
                  is_public: isPublic,
                });
                setIsModalOpen(true);
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
              title="Share this graph"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[rgba(110,231,183,0.18)] to-[rgba(52,211,153,0.18)] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />

              {/* Button container with glassmorphism */}
              <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(8,16,14,0.92)] px-4 py-3 shadow-lg shadow-black/40 transition-all duration-300 group-hover:border-[rgba(110,231,183,0.45)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--mint-accent-gradient)] shadow-[0_8px_18px_rgba(16,185,129,0.22)]">
                  <Share2 className="h-4 w-4 text-[#04120e] transition-transform duration-300 group-hover:rotate-12" />
                </div>

                {/* Label that appears on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-semibold text-white"
                    >
                      Share
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Public indicator badge */}
                {isPublic && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </motion.button>

            {/* Tooltip on hover (alternative to expanding label) */}
            <AnimatePresence>
              {!isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 pointer-events-none"
                >
                  <div className="rounded-lg border border-white/10 bg-[rgba(8,16,14,0.92)] px-3 py-1.5 shadow-xl backdrop-blur-sm">
                    <p className="whitespace-nowrap text-xs font-medium text-white/85">
                      {isPublic ? 'Public Graph' : 'Share Graph'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
