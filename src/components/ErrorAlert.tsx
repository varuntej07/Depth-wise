'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useGraphStore from '@/store/graphStore';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  const { clearGraph } = useGraphStore();

  const isSessionError = message.includes('Session expired') || message.includes('Session not found');

  const handleStartNewSearch = () => {
    clearGraph();
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('retry-last-action'));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-[var(--mint-surface)] border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl shadow-red-500/20 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-sm text-zinc-400">{message}</p>
            </div>

            <div className="flex gap-3 w-full">
              {isSessionError ? (
                <button
                  onClick={handleStartNewSearch}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[image:var(--mint-accent-gradient)] hover:brightness-105 text-[#04120e] text-sm font-medium transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start New Search
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[image:var(--mint-accent-gradient)] hover:brightness-105 text-[#04120e] text-sm font-medium transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorAlert;
