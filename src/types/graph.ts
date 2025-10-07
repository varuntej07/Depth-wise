import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

export interface KnowledgeNodeData {
  title: string;
  content?: string;
  summary?: string;
  depth: number;
  explored: boolean;
  loading?: boolean;
  error?: string;
  sessionId: string;
  parentId?: string;
  isSkeleton?: boolean;
  [key: string]: unknown;
}

export interface GraphNode extends ReactFlowNode {
  id: string;
  type: 'knowledge';
  position: { x: number; y: number };
  data: KnowledgeNodeData;
}

export interface GraphEdge extends ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface Branch {
  id: string;
  title: string;
  summary: string;
  content?: string;
  depth: number;
  position: { x: number; y: number };
}
