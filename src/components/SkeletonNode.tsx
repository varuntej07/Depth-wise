'use client';
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SkeletonNodeProps {
  data: {
    depth: number;
  };
}

const getDepthColor = (depth: number) => {
  const colors = [
    { border: 'border-cyan-500/50', shimmer: 'from-cyan-500/10 via-cyan-500/20 to-cyan-500/10' },
    { border: 'border-blue-500/50', shimmer: 'from-blue-500/10 via-blue-500/20 to-blue-500/10' },
    { border: 'border-violet-500/50', shimmer: 'from-violet-500/10 via-violet-500/20 to-violet-500/10' },
    { border: 'border-pink-500/50', shimmer: 'from-pink-500/10 via-pink-500/20 to-pink-500/10' },
    { border: 'border-amber-500/50', shimmer: 'from-amber-500/10 via-amber-500/20 to-amber-500/10' },
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const SkeletonNode: React.FC<SkeletonNodeProps> = ({ data }) => {
  const depthColors = getDepthColor(data.depth);
  
  return (
    <div className="knowledge-node">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-cyan-500 !border-2 !border-slate-900"
      />
      <Card
        className={`w-[360px] h-[280px] bg-slate-900/90 backdrop-blur-sm border-2 ${depthColors.border} shadow-lg flex flex-col`}
      >
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className={`h-5 bg-gradient-to-r ${depthColors.shimmer} rounded animate-shimmer w-3/4`}></div>
          <div className={`h-3 bg-gradient-to-r ${depthColors.shimmer} rounded animate-shimmer w-20 mt-2`}></div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            <div className={`h-3 bg-gradient-to-r ${depthColors.shimmer} rounded animate-shimmer w-full`}></div>
            <div className={`h-3 bg-gradient-to-r ${depthColors.shimmer} rounded animate-shimmer w-full`}></div>
            <div className={`h-3 bg-gradient-to-r ${depthColors.shimmer} rounded animate-shimmer w-4/5`}></div>
          </div>
          <div className={`h-10 bg-gradient-to-r ${depthColors.shimmer} rounded-lg animate-shimmer w-full`}></div>
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-cyan-500 !border-2 !border-slate-900"
      />
    </div>
  );
};

export default SkeletonNode;