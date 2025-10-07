import { Branch } from './graph';

export interface CreateSessionRequest {
  query: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;
}

export interface ExploreRequest {
  sessionId: string;
  parentId?: string;
  depth: number;
  query?: string;
}

export interface ExploreResponse {
  parentId?: string;
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
  nodes: any[];
  edges: any[];
}

export interface ErrorResponse {
  error: string;
}
