'use client';

import React from 'react';
import { ChevronRight, X, Home } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import useGraphStore from '@/store/graphStore';

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className = '' }) => {
  const {
    focusMode,
    focusedNodeId,
    rootQuery,
    exitFocusMode,
    setFocusedNode,
    getAncestorPath,
  } = useGraphStore();

  // Don't render if focus mode is off
  if (!focusMode || !focusedNodeId) {
    return null;
  }

  const ancestorPath = getAncestorPath(focusedNodeId);

  // Truncate title for display
  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30 ${className}`}
    >
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-full shadow-lg">
        {/* Exit Focus Mode Button */}
        <button
          onClick={exitFocusMode}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          title="Exit Focus Mode"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Exit Focus</span>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        {/* Root/Home */}
        <button
          onClick={() => {
            const rootNode = ancestorPath[0];
            if (rootNode) {
              setFocusedNode(rootNode.id);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-full transition-colors"
          title={rootQuery || 'Root'}
        >
          <Home className="w-3 h-3" />
          <span className="hidden sm:inline">{truncateTitle(rootQuery || 'Root', 15)}</span>
        </button>

        {/* Path Items */}
        {ancestorPath.slice(1).map((node, index) => (
          <React.Fragment key={node.id}>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => setFocusedNode(node.id)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                node.id === focusedNodeId
                  ? 'text-white bg-cyan-500/20 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={node.data.title}
            >
              {truncateTitle(node.data.title, 20)}
            </button>
          </React.Fragment>
        ))}

        {/* Depth indicator */}
        <div className="ml-2 px-2 py-0.5 text-[10px] text-slate-500 bg-slate-800 rounded-full">
          Depth {ancestorPath.length}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
