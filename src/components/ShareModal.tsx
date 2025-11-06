'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useGraphStore from '@/store/graphStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ShareModal Component
 *
 * Displays a modal that allows users to:
 * 1. Toggle their graph between public and private
 * 2. Copy the shareable link when public
 * 3. See the current share status
 */
export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  // Get the current session info from the store
  const { sessionId, isPublic, setIsPublic } = useGraphStore();

  // Local state for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate the shareable URL based on current domain
  const shareUrl = typeof window !== 'undefined' && sessionId
    ? `${window.location.origin}/share/${sessionId}`
    : '';

  /**
   * Toggle the public/private status of the graph
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

      // Reset copied state when toggling
      setCopied(false);
    } catch (err) {
      console.error('Toggle share error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update share status');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy the share link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(shareUrl);

      // Show success feedback
      setCopied(true);

      // Reset the "copied" state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
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
          {/* Backdrop - darkens the background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border-2 border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Share2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Share Graph</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Toggle Section */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {isPublic ? 'Public' : 'Private'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isPublic
                          ? 'Anyone with the link can view'
                          : 'Only you can view this graph'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={handleTogglePublic}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-cyan-500' : 'bg-slate-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Share Link Section - Only show when public */}
                {isPublic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-medium text-slate-300">
                      Shareable Link
                    </label>

                    {/* Link Display with Copy Button */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <p className="text-sm text-cyan-400 truncate">{shareUrl}</p>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={handleCopyLink}
                        className={`p-3 rounded-lg border transition-all ${
                          copied
                            ? 'bg-green-500/10 border-green-500/50 text-green-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Copy Status Message */}
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-green-400 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Link copied to clipboard!
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Info Text */}
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-xs text-slate-400">
                    {isPublic
                      ? '📢 This graph is visible to anyone with the link. They can view but not edit it.'
                      : '🔒 This graph is private. Only you can see it in your dashboard.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-slate-800/50 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
