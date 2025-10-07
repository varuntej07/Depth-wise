'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KnowledgeNodeData } from '@/types/graph';
import { Loader2, AlertCircle, RotateCw, Maximize2 } from 'lucide-react';
import NodeDetailModal from './NodeDetailModal';

interface KnowledgeNodeProps {
  data: KnowledgeNodeData;
  id: string;
}

// Get color based on depth
const getDepthColor = (depth: number) => {
  const colors = [
    { border: 'border-cyan-500/50', shadow: 'shadow-cyan-500/20', text: 'text-cyan-400', glow: 'hover:shadow-cyan-500/40' },
    { border: 'border-blue-500/50', shadow: 'shadow-blue-500/20', text: 'text-blue-400', glow: 'hover:shadow-blue-500/40' },
    { border: 'border-violet-500/50', shadow: 'shadow-violet-500/20', text: 'text-violet-400', glow: 'hover:shadow-violet-500/40' },
    { border: 'border-pink-500/50', shadow: 'shadow-pink-500/20', text: 'text-pink-400', glow: 'hover:shadow-pink-500/40' },
    { border: 'border-amber-500/50', shadow: 'shadow-amber-500/20', text: 'text-amber-400', glow: 'hover:shadow-amber-500/40' },
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const KnowledgeNode: React.FC<KnowledgeNodeProps> = ({ data, id }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExplore = () => {
    if (data.loading || data.explored) return;
    const event = new CustomEvent('explore-node', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  const depthColors = getDepthColor(data.depth);
  const contentText = data.content || data.summary || '';

  return (
    <>
      <NodeDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
      />

      <div className="knowledge-node">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-cyan-500 !border-2 !border-slate-900"
        />

        <Card
          className={`w-[360px] h-[280px] bg-slate-900/90 backdrop-blur-sm border-2 ${
            data.error
              ? 'border-red-500/50 shadow-red-500/20'
              : depthColors.border
          } ${
            data.error ? 'shadow-red-500/20' : depthColors.shadow
          } shadow-lg transition-all duration-300 ${
            data.error ? 'hover:shadow-red-500/40' : depthColors.glow
          } hover:scale-[1.02] ${
            data.loading
              ? 'animate-pulse'
              : ''
          } flex flex-col`}
        >
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className={`text-lg font-semibold leading-tight text-white`}>
            {data.title}
          </CardTitle>
          <div className={`text-xs ${depthColors.text} mt-1 flex items-center gap-2`}>
            <span>Level {data.depth}</span>
            {data.explored && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Explored
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 flex-1 flex flex-col overflow-hidden">
          {/* Content with fixed truncation */}
          {contentText && (
            <div className="flex-1 overflow-hidden">
              <div className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {data.content || data.summary}
              </div>

              {/* View Details button for any content */}
              {contentText && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={`mt-2 text-xs ${depthColors.text} hover:underline flex items-center gap-1 transition-colors`}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>View Details</span>
                </button>
              )}
            </div>
          )}

          {/* Error state with retry button */}
          {data.error && !data.loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">{data.error}</p>
              </div>
              <button
                onClick={handleExplore}
                className="w-full text-sm text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-4 font-medium transition-all duration-200 hover:border-red-500/60 flex items-center justify-center gap-2 group"
              >
                <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Normal explore button */}
          {!data.explored && !data.loading && !data.error && (
            <button
              onClick={handleExplore}
              className={`w-full text-sm ${depthColors.text} hover:bg-slate-800/50 border border-${depthColors.border.split('-')[1]}-500/30 rounded-lg py-2 px-4 font-medium transition-all duration-200 hover:border-${depthColors.border.split('-')[1]}-500/60 flex items-center justify-center gap-2 group`}
            >
              <span>Explore Deeper</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}

          {/* Loading state */}
          {data.loading && (
            <div className="flex items-center justify-center py-3 bg-slate-800/50 rounded-lg">
              <Loader2 className={`h-5 w-5 animate-spin ${depthColors.text}`} />
              <span className={`ml-2 text-sm ${depthColors.text}`}>Exploring...</span>
            </div>
          )}
        </CardContent>
        </Card>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-cyan-500 !border-2 !border-slate-900"
        />
      </div>
    </>
  );
};

export default memo(
  KnowledgeNode,
  (prev, next) =>
    prev.data.title === next.data.title &&
    prev.data.explored === next.data.explored &&
    prev.data.loading === next.data.loading
);
