'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useGraphStore from '@/store/graphStore';
import { usePostHog } from 'posthog-js/react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Premium Share Modal Component
 *
 * Modern modal with glassmorphism design that allows users to:
 * 1. Toggle their graph between public and private
 * 2. Copy the shareable link with animated feedback
 * 3. See real-time status updates
 *
 * Design Features:
 * - Glassmorphism with backdrop blur
 * - Smooth animations and micro-interactions
 * - Premium toggle switch
 * - Ripple effects on actions
 * - Gradient accents
 */
export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  // Get the current session info from the store
  const { sessionId, isPublic, setIsPublic } = useGraphStore();
  const posthog = usePostHog();

  // Local state for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRipple, setShowRipple] = useState(false);

  // Generate the shareable URL based on current domain
  const shareUrl = typeof window !== 'undefined' && sessionId
    ? `${window.location.origin}/share/${sessionId}`
    : '';

  /**
   * Toggle the public/private status of the graph
   * with smooth loading and error handling
   */
  const handleTogglePublic = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call the API to update the share status
      const response = await fetch(`/api/session/${sessionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update share status');
      }

      const data = await response.json();

      // Update the store with the new share status
      setIsPublic(data.isPublic);

      // Track share toggle
      posthog.capture('graph_visibility_toggled', {
        session_id: sessionId,
        is_public: data.isPublic,
      });

      // Reset copied state when toggling
      setCopied(false);

      // Show success ripple effect
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
    } catch (err) {
      console.error('Toggle share error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update share status');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy the share link to clipboard with animated feedback
   */
  const handleCopyLink = async () => {
    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(shareUrl);

      // Track link copy
      posthog.capture('share_link_copied', {
        session_id: sessionId,
        share_url: shareUrl,
      });

      // Show success feedback with ripple
      setCopied(true);
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);

      // Reset the "copied" state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
      setError('Failed to copy link. Please copy it manually.');
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal Container - Centered */}
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ripple effect on actions */}
              <AnimatePresence>
                {showRipple && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Glow effect behind modal */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-2xl -z-10" />

              {/* Main Modal Card with Glassmorphism */}
              <div className="relative bg-slate-900/90 backdrop-blur-2xl border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Gradient top border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Icon with gradient background */}
                    <div className="relative p-3 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl border border-white/10">
                      <Share2 className="w-6 h-6 text-cyan-400" />
                      {/* Sparkle effect */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      </motion.div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                        Share Your Graph
                      </h2>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Make your knowledge visible to the world
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Premium Toggle Section */}
                  <motion.div
                    layout
                    className="relative p-5 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden"
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                      className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-50"
                      style={{ backgroundSize: '200% 200%' }}
                    />

                    <div className="relative flex items-center justify-between">
                      {/* Status Display */}
                      <div className="flex items-center gap-4">
                        {/* Animated icon */}
                        <motion.div
                          animate={{ scale: isPublic ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.5 }}
                          className={`p-3 rounded-xl ${
                            isPublic
                              ? 'bg-green-500/20 border-2 border-green-500/30'
                              : 'bg-slate-800/50 border-2 border-slate-700/30'
                          }`}
                        >
                          {isPublic ? (
                            <Globe className="w-6 h-6 text-green-400" />
                          ) : (
                            <Lock className="w-6 h-6 text-slate-400" />
                          )}
                        </motion.div>

                        {/* Status Text */}
                        <div>
                          <motion.p
                            key={isPublic ? 'public' : 'private'}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-base font-semibold text-white"
                          >
                            {isPublic ? 'Public Graph' : 'Private Graph'}
                          </motion.p>
                          <p className="text-sm text-slate-400">
                            {isPublic
                              ? 'Anyone with the link can view'
                              : 'Only you can see this graph'}
                          </p>
                        </div>
                      </div>

                      {/* Premium Toggle Switch */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTogglePublic}
                        disabled={isLoading}
                        className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 ${
                          isPublic
                            ? 'bg-gradient-to-r from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/50'
                            : 'bg-slate-700'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {/* Toggle knob */}
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform ${
                            isPublic ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        >
                          {/* Inner icon */}
                          <div className="flex items-center justify-center h-full">
                            {isLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full"
                              />
                            ) : (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.3 }}
                              >
                                {isPublic ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400" />
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.span>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Share Link Section - Only show when public */}
                  <AnimatePresence mode="wait">
                    {isPublic && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          Your Shareable Link
                        </label>

                        {/* Link Display with Copy Button */}
                        <div className="relative group">
                          {/* Background glow on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity" />

                          <div className="relative flex items-center gap-2 p-3 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl">
                            {/* URL Display - with proper overflow handling */}
                            <div className="flex-1 min-w-0 px-3 py-2 bg-slate-900/50 rounded-lg">
                              <p className="text-xs sm:text-sm text-cyan-400 font-mono break-all">
                                {shareUrl}
                              </p>
                            </div>

                            {/* Copy Button with icon */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCopyLink}
                              className={`flex-shrink-0 p-3 rounded-lg font-semibold transition-all ${
                                copied
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                              }`}
                              title={copied ? 'Copied!' : 'Copy link'}
                            >
                              {copied ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                        </div>

                        {/* Success Message */}
                        <AnimatePresence>
                          {copied && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 text-green-400 text-sm"
                            >
                              <Check className="w-4 h-4" />
                              <span>Link copied! Share it anywhere.</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Info Card */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative p-4 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 rounded-xl border border-white/5"
                  >
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isPublic ? (
                        <>
                          <span className="text-green-400 font-semibold">🌍 Public:</span> Your
                          graph is now visible to anyone with the link. They can view and explore
                          but cannot edit.
                        </>
                      ) : (
                        <>
                          <span className="text-slate-300 font-semibold">🔒 Private:</span> Your
                          graph is private and only visible to you. Toggle public to share with
                          others.
                        </>
                      )}
                    </p>
                  </motion.div>
                </div>

                {/* Footer - Optional actions */}
                <div className="flex justify-end gap-3 px-6 py-4 bg-white/5 border-t border-white/5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
