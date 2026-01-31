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

  // Check if it's a session error
  const isSessionError = message.includes('Session expired') || message.includes('Session not found');

  const handleStartNewSearch = () => {
    clearGraph();
    onClose();
    // Scroll to top to focus on search bar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:max-w-md"
      >
        <div className="bg-slate-900/95 backdrop-blur-sm border-2 border-red-500/50 rounded-xl p-4 shadow-lg shadow-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-200 mb-3">{message}</p>
              {isSessionError && (
                <button
                  onClick={handleStartNewSearch}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors border border-cyan-500/30 hover:border-cyan-500/60 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Start New Search</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorAlert;
