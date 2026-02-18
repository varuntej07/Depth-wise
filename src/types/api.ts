import { Branch, GraphNode, GraphEdge, ExploreTerm } from './graph';

export interface CreateSessionRequest {
  query: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;
  rootNode?: {
    id: string;
    title: string;
    content?: string;
    depth: number;
    position: { x: number; y: number };
    exploreTerms?: ExploreTerm[];
  };
  branches?: Array<Branch & { exploreTerms?: ExploreTerm[] }>;
}

export interface ExploreRequest {
  sessionId: string;
  parentId?: string;
  depth: number;
  query?: string;
}

export interface ExploreResponse {
  parentId?: string;
  parentContent?: string;
  parentTerms?: ExploreTerm[];
  branches: Branch[];
  edges: {
    id: string;
    source: string;
    target: string;
  }[];
}

export interface GetSessionResponse {
  sessionId: string;
  rootQuery: string;
  createdAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ErrorResponse {
  error: string;
}
