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
    '#6EE7B7',
    '#34D399',
    '#10B981',
    '#59D7AA',
    '#7DE5BE',
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
  // Validate coordinates before rendering
  if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY) ||
      !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
    return null;
  }

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.42,
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
          strokeWidth={7}
          strokeOpacity={0.22}
          className="transition-opacity duration-200"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isHighlighted ? '#6EE7B7' : color}
        strokeWidth={isHighlighted ? 2.9 : 2.2}
        strokeOpacity={isHighlighted ? 0.94 : 0.58}
        className="transition-all duration-300"
        style={{
          animation: 'edge-appear 0.24s ease-out',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        markerEnd={markerEnd}
      />
    </g>
  );
};

export default KnowledgeEdge;
