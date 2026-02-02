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

  // Focus Mode State
  focusMode: boolean; // Is focus mode active?
  focusedNodeId: string | null; // Currently focused node (null = show all)
  focusDepthThreshold: number; // Depth at which focus mode auto-activates (default: 3)

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

  // Focus Mode Actions
  setFocusMode: (enabled: boolean) => void;
  setFocusedNode: (nodeId: string | null) => void;
  exitFocusMode: () => void;

  // Computed
  getNodeById: (id: string) => GraphNode | undefined;
  getChildrenOf: (parentId: string) => GraphNode[];
  getMaxDepth: () => number;
  getAncestorPath: (nodeId: string) => GraphNode[];
  getVisibleNodes: () => GraphNode[];
  getVisibleEdges: () => GraphEdge[];
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

  // Focus Mode State
  focusMode: false,
  focusedNodeId: null,
  focusDepthThreshold: 3, // Auto-activate focus mode at depth 3+

  setSessionId: (id) => set({ sessionId: id }),
  setRootQuery: (query) => set({ rootQuery: query }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),

  // Update the share status of the current graph
  setIsPublic: (isPublic) => set({ isPublic }),

  // Focus Mode Actions
  setFocusMode: (enabled) => set({ focusMode: enabled }),
  setFocusedNode: (nodeId) => set({ focusedNodeId: nodeId, focusMode: nodeId !== null }),
  exitFocusMode: () => set({ focusMode: false, focusedNodeId: null }),

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
      focusMode: false, // Reset focus mode when clearing
      focusedNodeId: null,
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

  // Get ancestor path from root to given node
  getAncestorPath: (nodeId: string) => {
    const { nodes } = get();
    const path: GraphNode[] = [];
    let currentNode = nodes.find((n) => n.id === nodeId);

    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.data.parentId) {
        currentNode = nodes.find((n) => n.id === currentNode!.data.parentId);
      } else {
        break;
      }
    }

    return path;
  },

  // Get visible nodes based on focus mode
  getVisibleNodes: () => {
    const { nodes, focusMode, focusedNodeId } = get();

    // If focus mode is off, return all nodes
    if (!focusMode || !focusedNodeId) {
      return nodes;
    }

    const focusedNode = nodes.find((n) => n.id === focusedNodeId);
    if (!focusedNode) {
      return nodes;
    }

    // Get ancestors (path from root to focused node)
    const ancestorPath = get().getAncestorPath(focusedNodeId);
    const ancestorIds = new Set(ancestorPath.map((n) => n.id));

    // Get children of focused node
    const childrenIds = new Set(
      nodes
        .filter((n) => n.data.parentId === focusedNodeId)
        .map((n) => n.id)
    );

    // Return: ancestors + focused node + children
    return nodes.filter(
      (n) => ancestorIds.has(n.id) || childrenIds.has(n.id)
    );
  },

  // Get visible edges based on focus mode
  getVisibleEdges: () => {
    const { edges, focusMode, focusedNodeId } = get();

    if (!focusMode || !focusedNodeId) {
      return edges;
    }

    const visibleNodes = get().getVisibleNodes();
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    // Only show edges where both source and target are visible
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  },
}));

export default useGraphStore;