import { create } from 'zustand';
import { GraphNode, GraphEdge } from '@/types/graph';

interface GraphState {
  // Data
  sessionId: string | null;
  rootQuery: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];

  // Session state
  isPublic: boolean; // tracks if current graph is public
  isAnonymous: boolean; // tracks if this is an anonymous session

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  setSessionId: (id: string) => void;
  setRootQuery: (query: string) => void;
  setIsAnonymous: (isAnonymous: boolean) => void;
  addNodes: (nodes: GraphNode[]) => void;
  addEdges: (edges: GraphEdge[]) => void;
  updateNode: (id: string, updates: Partial<GraphNode['data']>) => void;
  removeNode: (id: string) => void;
  clearGraph: () => void;
  loadSession: (sessionId: string, rootQuery: string, nodes: GraphNode[], edges: GraphEdge[], isPublic?: boolean, isAnonymous?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Share actions
  setIsPublic: (isPublic: boolean) => void;

  // Computed
  getNodeById: (id: string) => GraphNode | undefined;
  getChildrenOf: (parentId: string) => GraphNode[];
  getMaxDepth: () => number;
}

const useGraphStore = create<GraphState>((set, get) => ({
  sessionId: null,
  rootQuery: null,
  nodes: [],
  edges: [],
  isPublic: false, // Graphs are private by default
  isAnonymous: false, // Defaults to authenticated session
  isLoading: false,
  error: null,

  setSessionId: (id) => set({ sessionId: id }),
  setRootQuery: (query) => set({ rootQuery: query }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),

  // Update the share status of the current graph
  setIsPublic: (isPublic) => set({ isPublic }),

  addNodes: (newNodes) =>
    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
    })),

  addEdges: (newEdges) =>
    set((state) => ({
      edges: [...state.edges, ...newEdges],
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...updates } } : node
      ),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  clearGraph: () =>
    set({
      nodes: [],
      edges: [],
      sessionId: null,
      rootQuery: null,
      isPublic: false, // Reset share status when clearing
      isAnonymous: false, // Reset anonymous status when clearing
      error: null,
    }),

  // Load a session with all its data, optionally including share status
  loadSession: (sessionId, rootQuery, nodes, edges, isPublic = false, isAnonymous = false) =>
    set({
      sessionId,
      rootQuery,
      nodes,
      edges,
      isPublic, // Load the share status from the session
      isAnonymous, // Load the anonymous status
      error: null,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  getNodeById: (id) => get().nodes.find((n) => n.id === id),

  getChildrenOf: (parentId) => {
    const edges = get().edges.filter((e) => e.source === parentId);
    const childIds = edges.map((e) => e.target);
    return get().nodes.filter((n) => childIds.includes(n.id));
  },

  getMaxDepth: () => {
    const depths = get().nodes.map((n) => n.data.depth);
    return depths.length > 0 ? Math.max(...depths) : 0;
  },
}));

export default useGraphStore;
