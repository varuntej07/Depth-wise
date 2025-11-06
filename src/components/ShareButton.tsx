'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import useGraphStore from '@/store/graphStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating Share Button Component (FAB)
 *
 * A modern floating action button that appears in the bottom-right
 * corner of the canvas when a graph is loaded.
 *
 * Features:
 * - Fixed positioning over canvas
 * - Pulsing animation when graph is public
 * - Smooth hover effects with shadows
 * - Glassmorphism design
 * - Always accessible while viewing graph
 */
export const ShareButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
            className="fixed bottom-6 right-6 z-30"
          >
            {/* Main Share Button */}
            <motion.button
              onClick={() => setIsModalOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
              title="Share this graph"
            >
              {/* Pulsing ring effect when public */}
              {isPublic && (
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 animate-ping opacity-75" />
              )}

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />

              {/* Button container with glassmorphism */}
              <div className="relative flex items-center gap-2 px-5 py-4 bg-slate-900/80 backdrop-blur-xl border-2 border-cyan-500/50 rounded-full shadow-2xl shadow-cyan-500/25 transition-all duration-300 group-hover:border-cyan-400 group-hover:shadow-cyan-500/40">
                {/* Share icon */}
                <Share2 className="w-5 h-5 text-cyan-400 transition-transform duration-300 group-hover:rotate-12" />

                {/* Label that appears on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-semibold text-cyan-400"
                    >
                      Share
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Public indicator badge */}
                {isPublic && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  </motion.div>
                )}
              </div>
            </motion.button>

            {/* Tooltip on hover (alternative to expanding label) */}
            <AnimatePresence>
              {!isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0, y: 10 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 pointer-events-none"
                >
                  <div className="px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-lg shadow-xl">
                    <p className="text-xs font-medium text-cyan-400 whitespace-nowrap">
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
