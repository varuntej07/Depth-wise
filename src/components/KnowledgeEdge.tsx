'use client';

import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

interface KnowledgeEdgeProps extends EdgeProps {
  data?: {
    depth?: number;
    isHighlighted?: boolean;
  };
}

// Color palette based on depth level
const getDepthColor = (depth: number = 0): string => {
  const colors = [
    '#06b6d4', // cyan-500 - depth 0
    '#3b82f6', // blue-500 - depth 1
    '#8b5cf6', // violet-500 - depth 2
    '#ec4899', // pink-500 - depth 3
    '#f59e0b', // amber-500 - depth 4+
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const KnowledgeEdge: React.FC<KnowledgeEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const depth = data?.depth || 0;
  const isHighlighted = data?.isHighlighted || false;
  const color = getDepthColor(depth);

  return (
    <g className="react-flow__edge">
      {/* Background glow for highlighted edges */}
      {isHighlighted && (
        <path
          id={`${id}-glow`}
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeOpacity={0.3}
          className="animate-pulse"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeOpacity={isHighlighted ? 1 : 0.6}
        className="transition-all duration-300"
        style={{
          strokeDasharray: isHighlighted ? '0' : '5,5',
          animation: 'edge-appear 0.5s ease-out',
        }}
        markerEnd={markerEnd}
      />

      {/* Animated particle effect on highlighted paths */}
      {isHighlighted && (
        <circle r="4" fill={color} className="edge-particle">
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
    </g>
  );
};

export default KnowledgeEdge;
