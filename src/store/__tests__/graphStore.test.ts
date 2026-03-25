import { describe, it, expect, beforeEach } from 'vitest';
import useGraphStore from '../graphStore';
import type { GraphNode, GraphEdge } from '@/types/graph';

function makeNode(
  id: string,
  depth: number,
  parentId?: string,
): GraphNode {
  return {
    id,
    type: 'knowledge',
    position: { x: 0, y: depth * 200 },
    data: {
      title: `Node ${id}`,
      depth,
      explored: false,
      sessionId: 'test-session',
      parentId,
    },
  };
}

function makeEdge(source: string, target: string): GraphEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
  };
}

/**
 * Build a tree:
 *   root
 *   ├── child-1
 *   │   ├── grandchild-1
 *   │   └── grandchild-2
 *   └── child-2
 */
function seedTree() {
  const store = useGraphStore.getState();
  const nodes = [
    makeNode('root', 1),
    makeNode('child-1', 2, 'root'),
    makeNode('child-2', 2, 'root'),
    makeNode('grandchild-1', 3, 'child-1'),
    makeNode('grandchild-2', 3, 'child-1'),
  ];
  const edges = [
    makeEdge('root', 'child-1'),
    makeEdge('root', 'child-2'),
    makeEdge('child-1', 'grandchild-1'),
    makeEdge('child-1', 'grandchild-2'),
  ];
  store.addNodes(nodes);
  store.addEdges(edges);
  store.setSessionId('test-session');
  store.setRootQuery('test query');
}

describe('graphStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGraphStore.setState({
      sessionId: null,
      rootQuery: null,
      nodes: [],
      edges: [],
      isPublic: false,
      isAnonymous: false,
      isLoading: false,
      error: null,
      focusMode: false,
      focusedNodeId: null,
      focusDepthThreshold: 3,
    });
  });

  // --- getVisibleNodes without focus mode ---
  describe('getVisibleNodes', () => {
    it('returns all nodes when focus mode is off', () => {
      seedTree();
      const store = useGraphStore.getState();
      const visible = store.getVisibleNodes();
      expect(visible).toHaveLength(5);
    });

    it('returns all nodes when focusMode is on but focusedNodeId is null', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: null });
      const visible = useGraphStore.getState().getVisibleNodes();
      expect(visible).toHaveLength(5);
    });

    it('returns ancestors + focused + children in focus mode', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'child-1' });
      const visible = useGraphStore.getState().getVisibleNodes();
      const ids = visible.map((n) => n.id).sort();

      // ancestors of child-1: root
      // focused: child-1
      // children of child-1: grandchild-1, grandchild-2
      expect(ids).toEqual(['child-1', 'grandchild-1', 'grandchild-2', 'root']);
    });

    it('excludes siblings not in the focused path', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'child-1' });
      const visible = useGraphStore.getState().getVisibleNodes();
      const ids = visible.map((n) => n.id);
      expect(ids).not.toContain('child-2');
    });

    it('shows only root + children when root is focused', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'root' });
      const visible = useGraphStore.getState().getVisibleNodes();
      const ids = visible.map((n) => n.id).sort();
      expect(ids).toEqual(['child-1', 'child-2', 'root']);
    });

    it('returns all nodes if focusedNodeId does not exist', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'nonexistent' });
      const visible = useGraphStore.getState().getVisibleNodes();
      expect(visible).toHaveLength(5);
    });
  });

  // --- getAncestorPath ---
  describe('getAncestorPath', () => {
    it('returns path from root to the given node', () => {
      seedTree();
      const path = useGraphStore.getState().getAncestorPath('grandchild-1');
      const ids = path.map((n) => n.id);
      expect(ids).toEqual(['root', 'child-1', 'grandchild-1']);
    });

    it('returns just the root when called on root', () => {
      seedTree();
      const path = useGraphStore.getState().getAncestorPath('root');
      expect(path).toHaveLength(1);
      expect(path[0].id).toBe('root');
    });

    it('returns empty array for nonexistent node', () => {
      seedTree();
      const path = useGraphStore.getState().getAncestorPath('nonexistent');
      expect(path).toEqual([]);
    });

    it('returns correct path for depth-2 node', () => {
      seedTree();
      const path = useGraphStore.getState().getAncestorPath('child-2');
      const ids = path.map((n) => n.id);
      expect(ids).toEqual(['root', 'child-2']);
    });
  });

  // --- clearGraph ---
  describe('clearGraph', () => {
    it('resets nodes, edges, sessionId, rootQuery, and focus state', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'child-1' });

      useGraphStore.getState().clearGraph();
      const state = useGraphStore.getState();

      expect(state.nodes).toEqual([]);
      expect(state.edges).toEqual([]);
      expect(state.sessionId).toBeNull();
      expect(state.rootQuery).toBeNull();
      expect(state.isPublic).toBe(false);
      expect(state.isAnonymous).toBe(false);
      expect(state.focusMode).toBe(false);
      expect(state.focusedNodeId).toBeNull();
    });

    it('does not reset error (errors persist until explicitly cleared)', () => {
      seedTree();
      useGraphStore.setState({ error: 'something broke' });

      useGraphStore.getState().clearGraph();
      expect(useGraphStore.getState().error).toBe('something broke');
    });
  });

  // --- getVisibleEdges ---
  describe('getVisibleEdges', () => {
    it('returns all edges when focus mode is off', () => {
      seedTree();
      const edges = useGraphStore.getState().getVisibleEdges();
      expect(edges).toHaveLength(4);
    });

    it('returns only edges between visible nodes in focus mode', () => {
      seedTree();
      useGraphStore.setState({ focusMode: true, focusedNodeId: 'child-1' });
      const edges = useGraphStore.getState().getVisibleEdges();
      const edgeIds = edges.map((e) => `${e.source}->${e.target}`).sort();
      expect(edgeIds).toEqual([
        'child-1->grandchild-1',
        'child-1->grandchild-2',
        'root->child-1',
      ]);
    });
  });
});
