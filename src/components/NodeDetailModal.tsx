'use client';

import React from 'react';
import { X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeNodeData } from '@/types/graph';

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: KnowledgeNodeData;
}

// Get color based on depth
const getDepthColor = (depth: number) => {
  const colors = [
    { border: 'border-[rgba(16,185,129,0.6)]', text: 'text-[var(--mint-accent-1)]', bg: 'bg-[rgba(16,185,129,0.16)]' },
    { border: 'border-[rgba(16,185,129,0.6)]', text: 'text-[var(--mint-accent-1)]', bg: 'bg-[rgba(16,185,129,0.16)]' },
    { border: 'border-[rgba(16,185,129,0.6)]', text: 'text-[var(--mint-accent-1)]', bg: 'bg-[rgba(16,185,129,0.16)]' },
    { border: 'border-[rgba(16,185,129,0.6)]', text: 'text-[var(--mint-accent-1)]', bg: 'bg-[rgba(16,185,129,0.16)]' },
    { border: 'border-[rgba(16,185,129,0.6)]', text: 'text-[var(--mint-accent-1)]', bg: 'bg-[rgba(16,185,129,0.16)]' },
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ isOpen, onClose, data }) => {
  const depthColors = getDepthColor(data.depth);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[var(--mint-surface)] backdrop-blur-md border-2 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden pointer-events-auto"
              style={{
                borderColor: 'rgba(16, 185, 129, 0.6)',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-[var(--mint-elevated)]">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${depthColors.bg} flex items-center justify-center`}>
                      <Layers className={`w-5 h-5 ${depthColors.text}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight">
                        {data.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-xs ${depthColors.text} font-medium px-3 py-1 rounded-full bg-[var(--mint-elevated)] border border-[rgba(16,185,129,0.35)]`}>
                      Level {data.depth}
                    </span>
                    {data.explored && (
                      <span className="text-xs text-green-400 font-medium px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Explored
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-[var(--mint-text-secondary)] hover:text-white transition-colors p-2 hover:bg-[var(--mint-elevated)] rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                <div className="prose prose-invert prose-zinc max-w-none">
                  {data.content && (
                    <div className="text-[var(--mint-text-secondary)] leading-relaxed space-y-4">
                      {data.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() && (
                          <p key={index} className="text-base">
                            {paragraph}
                          </p>
                        )
                      ))}
                    </div>
                  )}
                  {data.summary && !data.content && (
                    <p className="text-[var(--mint-text-secondary)] text-base leading-relaxed italic">
                      {data.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[var(--mint-elevated)] bg-[var(--mint-surface)]">
                <button
                  onClick={onClose}
                  className={`w-full py-3 px-6 rounded-lg ${depthColors.text} border border-[rgba(16,185,129,0.35)] hover:bg-[var(--mint-elevated)] hover:border-[rgba(16,185,129,0.6)] transition-all duration-200 font-medium`}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NodeDetailModal;
