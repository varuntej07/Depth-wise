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
    { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500' },
    { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500' },
    { border: 'border-violet-500', text: 'text-violet-400', bg: 'bg-violet-500' },
    { border: 'border-pink-500', text: 'text-pink-400', bg: 'bg-pink-500' },
    { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500' },
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
              className="bg-slate-900/95 backdrop-blur-md border-2 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden pointer-events-auto"
              style={{
                borderColor: depthColors.border.split('-')[1] + '-500',
                boxShadow: `0 0 40px rgba(${depthColors.border.split('-')[1] === 'cyan' ? '6, 182, 212' : depthColors.border.split('-')[1] === 'blue' ? '59, 130, 246' : depthColors.border.split('-')[1] === 'violet' ? '139, 92, 246' : depthColors.border.split('-')[1] === 'pink' ? '236, 72, 153' : '245, 158, 11'}, 0.3)`,
              }}
            >
              {/* Header */}
              <div className={`flex items-start justify-between p-6 border-b border-slate-800`}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${depthColors.bg}/20 flex items-center justify-center`}>
                      <Layers className={`w-5 h-5 ${depthColors.text}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight">
                        {data.title}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-xs ${depthColors.text} font-medium px-3 py-1 rounded-full bg-slate-800/50 border ${depthColors.border}/30`}>
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
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
                <div className="prose prose-invert prose-slate max-w-none">
                  {data.content && (
                    <div className="text-slate-300 leading-relaxed space-y-4">
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
                    <p className="text-slate-400 text-base leading-relaxed italic">
                      {data.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <button
                  onClick={onClose}
                  className={`w-full py-3 px-6 rounded-lg ${depthColors.text} border ${depthColors.border}/30 hover:bg-slate-800/50 transition-all duration-200 font-medium`}
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
