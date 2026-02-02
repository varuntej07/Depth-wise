import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

// Query intent classification types
export type QueryIntent = 'factual' | 'conceptual' | 'technical' | 'comparative' | 'exploratory';
export type QueryComplexity = 'simple' | 'moderate' | 'complex';
export type FollowUpType = 'why' | 'how' | 'what' | 'example' | 'compare';

export interface QueryClassification {
  intent: QueryIntent;
  complexity: QueryComplexity;
  suggestedBranchCount: number; // 2-5
}

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
  followUpType?: FollowUpType;
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
  followUpType?: FollowUpType; // what kind of follow-up this branch represents
}