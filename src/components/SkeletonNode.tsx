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
    { border: 'border-[var(--mint-accent-2)]', shimmer: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]' },
    { border: 'border-[var(--mint-accent-2)]', shimmer: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]' },
    { border: 'border-[var(--mint-accent-2)]', shimmer: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]' },
    { border: 'border-[var(--mint-accent-2)]', shimmer: 'from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]' },
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
        className="h-2.5 w-2.5 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
      />
      <Card
        className={`w-[300px] gap-0 rounded-[22px] border-2 py-0 sm:w-[340px] lg:w-[360px] bg-[var(--mint-surface)] ${depthColors.border} shadow-lg`}
      >
        <CardHeader className="!space-y-2 border-b border-[var(--mint-elevated)] !px-4 !py-3">
          <div className={`h-2.5 w-20 rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
          <div className={`h-5 w-4/5 rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
        </CardHeader>
        <CardContent className="flex min-h-[180px] flex-col gap-2.5 !px-4 !py-3">
          <div className="flex-1 rounded-lg border border-[rgba(110,231,183,0.18)] bg-[rgba(32,52,45,0.28)] px-3 py-2">
            <div className="space-y-2">
              <div className={`h-3 w-full rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
              <div className={`h-3 w-full rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
              <div className={`h-3 w-4/5 rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
              <div className={`h-3 w-11/12 rounded bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className={`h-6 w-28 rounded-md bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
            <div className={`h-6 w-20 rounded-md bg-gradient-to-r ${depthColors.shimmer} animate-shimmer`} />
          </div>
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
      />
    </div>
  );
};

export default SkeletonNode;
