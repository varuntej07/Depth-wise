// In-memory storage for testing without database

interface Session {
  id: string;
  rootQuery: string;
  title: string;
  createdAt: Date;
  nodeCount: number;
  maxDepth: number;
}

interface Node {
  id: string;
  sessionId: string;
  parentId: string | null;
  title: string;
  content: string | null;
  summary: string | null;
  depth: number;
  positionX: number;
  positionY: number;
  explored: boolean;
  createdAt: Date;
}

interface Edge {
  id: string;
  sessionId: string;
  sourceId: string;
  targetId: string;
  animated: boolean;
}

class MockDatabase {
  private sessions: Map<string, Session> = new Map();
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();

  // Session methods
  createSession(data: { rootQuery: string; title?: string }) {
    const id = this.generateId();
    const session: Session = {
      id,
      rootQuery: data.rootQuery,
      title: data.title || data.rootQuery.slice(0, 100),
      createdAt: new Date(),
      nodeCount: 0,
      maxDepth: 0,
    };
    this.sessions.set(id, session);
    return session;
  }

  findSession(id: string) {
    return this.sessions.get(id) || null;
  }

  updateSession(id: string, data: Partial<Session>) {
    const session = this.sessions.get(id);
    if (session) {
      Object.assign(session, data);
    }
    return session;
  }

  // Node methods
  createNode(data: {
    sessionId: string;
    parentId?: string | null;
    title: string;
    content?: string | null;
    summary?: string | null;
    depth: number;
    positionX: number;
    positionY: number;
    explored?: boolean;
  }) {
    const id = this.generateId();
    const node: Node = {
      id,
      sessionId: data.sessionId,
      parentId: data.parentId || null,
      title: data.title,
      content: data.content || null,
      summary: data.summary || null,
      depth: data.depth,
      positionX: data.positionX,
      positionY: data.positionY,
      explored: data.explored || false,
      createdAt: new Date(),
    };
    this.nodes.set(id, node);
    return node;
  }

  findNode(id: string) {
    return this.nodes.get(id) || null;
  }

  findNodesBySession(sessionId: string) {
    return Array.from(this.nodes.values()).filter(
      (node) => node.sessionId === sessionId
    );
  }

  findNodesByParent(parentId: string) {
    return Array.from(this.nodes.values()).filter(
      (node) => node.parentId === parentId
    );
  }

  updateNode(id: string, data: Partial<Node>) {
    const node = this.nodes.get(id);
    if (node) {
      Object.assign(node, data);
    }
    return node;
  }

  countNodesBySession(sessionId: string) {
    return this.findNodesBySession(sessionId).length;
  }

  getMaxDepthNode(sessionId: string) {
    const nodes = this.findNodesBySession(sessionId);
    if (nodes.length === 0) return null;
    return nodes.reduce((max, node) => (node.depth > max.depth ? node : max));
  }

  // Edge methods
  createEdge(data: {
    sessionId: string;
    sourceId: string;
    targetId: string;
    animated?: boolean;
  }) {
    const id = this.generateId();
    const edge: Edge = {
      id,
      sessionId: data.sessionId,
      sourceId: data.sourceId,
      targetId: data.targetId,
      animated: data.animated !== undefined ? data.animated : true,
    };
    this.edges.set(id, edge);
    return edge;
  }

  findEdgesBySource(sourceId: string) {
    return Array.from(this.edges.values()).filter(
      (edge) => edge.sourceId === sourceId
    );
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data (useful for testing)
  clear() {
    this.sessions.clear();
    this.nodes.clear();
    this.edges.clear();
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();
