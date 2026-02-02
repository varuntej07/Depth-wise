'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import KnowledgeNode from './KnowledgeNode';
import SkeletonNode from './SkeletonNode';
import KnowledgeEdge from './KnowledgeEdge';
import Breadcrumb from './Breadcrumb';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';
import { LAYOUT_CONFIG } from '@/lib/layout';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionTier } from '@prisma/client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { SignInDialog } from './SignInDialog';
import { useSession } from 'next-auth/react';
import { getClientId } from '@/lib/utils';

const nodeTypes = {
  knowledge: (props: { data: GraphNode['data']; id: string; selected: boolean }) => {
    // Render skeleton if it's a skeleton node
    if (props.data.isSkeleton) {
      return <SkeletonNode {...props} />;
    }
    return <KnowledgeNode {...props} />;
  },
};

const edgeTypes = {
  default: KnowledgeEdge,
};

const KnowledgeCanvasInner: React.FC = () => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    updateNode,
    isAnonymous: isAnonymousSession,
    sessionId: currentSessionId,
    focusMode,
    focusedNodeId,
    focusDepthThreshold,
    setFocusMode,
    setFocusedNode,
    exitFocusMode,
    getVisibleNodes,
    getVisibleEdges,
    getMaxDepth,
    getAncestorPath,
  } = useGraphStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [limitReason, setLimitReason] = useState<string>('');
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE');
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const { data: session } = useSession();
  const [anonymousSessionIdForMigration, setAnonymousSessionIdForMigration] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { fitView } = useReactFlow();
  const initialFitDone = useRef(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger fitView when nodes are first loaded (after skeleton nodes are replaced)
  useEffect(() => {
    // Only trigger on initial load when we have real nodes (not skeletons)
    const hasRealNodes = storeNodes.some(n => !n.data.isSkeleton);
    const hasNoSkeletons = storeNodes.every(n => !n.data.isSkeleton);

    if (hasRealNodes && hasNoSkeletons && storeNodes.length > 0) {
      // Delay fitView slightly to ensure nodes are rendered
      const timer = setTimeout(() => {
        fitView({
          padding: isMobile ? 0.1 : 0.2,
          duration: 300,
          maxZoom: isMobile ? 0.5 : 1,
        });
        initialFitDone.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [storeNodes, fitView, isMobile]);

  // Find all edges in the path from root to a given node
  const getPathToRoot = useCallback(
    (nodeId: string): string[] => {
      const pathEdges: string[] = [];
      let currentNodeId: string | null = nodeId;

      while (currentNodeId) {
        const currentNode = storeNodes.find((n) => n.id === currentNodeId);
        if (!currentNode || !currentNode.data.parentId) break;

        const edge = storeEdges.find(
          (e) => e.target === currentNodeId && e.source === currentNode.data.parentId
        );

        if (edge) {
          pathEdges.push(edge.id);
          currentNodeId = currentNode.data.parentId;
        } else {
          break;
        }
      }

      return pathEdges;
    },
    [storeNodes, storeEdges]
  );

  // Get the depth of the target node for each edge
  const getEdgeDepth = useCallback(
    (targetId: string): number => {
      const targetNode = storeNodes.find((n) => n.id === targetId);
      return targetNode?.data.depth || 0;
    },
    [storeNodes]
  );

  // Auto-activate focus mode when depth reaches threshold
  useEffect(() => {
    const maxDepth = getMaxDepth();
    if (maxDepth >= focusDepthThreshold && !focusMode && storeNodes.length > 0) {
      // Find the deepest explored node to focus on
      const deepestExploredNode = storeNodes
        .filter((n) => n.data.explored && n.data.depth === maxDepth)
        .sort((a, b) => b.data.depth - a.data.depth)[0];

      if (deepestExploredNode) {
        setFocusedNode(deepestExploredNode.id);
      }
    }
  }, [storeNodes, focusMode, focusDepthThreshold, getMaxDepth, setFocusedNode]);

  // Sync store with React Flow state (apply focus mode filtering)
  useEffect(() => {
    const visibleNodes = focusMode ? getVisibleNodes() : storeNodes;
    setNodes(visibleNodes as unknown as Node[]);
  }, [storeNodes, focusMode, focusedNodeId, setNodes, getVisibleNodes]);

  // Enhanced edges with depth and highlight information (apply focus mode filtering)
  useEffect(() => {
    const visibleEdges = focusMode ? getVisibleEdges() : storeEdges;
    const highlightedEdges = hoveredNodeId ? getPathToRoot(hoveredNodeId) : [];

    const enhancedEdges = visibleEdges.map((edge) => ({
      ...edge,
      type: 'default',
      data: {
        depth: getEdgeDepth(edge.target),
        isHighlighted: highlightedEdges.includes(edge.id),
      },
    }));

    setEdges(enhancedEdges as unknown as Edge[]);
  }, [storeEdges, hoveredNodeId, getPathToRoot, getEdgeDepth, setEdges, focusMode, focusedNodeId, getVisibleEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle migration after sign-in
  useEffect(() => {
    const migrateAnonymousSession = async () => {
      if (session?.user && anonymousSessionIdForMigration && isAnonymousSession) {
        try {
          const response = await fetch('/api/session/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              anonymousSessionId: anonymousSessionIdForMigration,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Update the store with the new session ID and mark as not anonymous
            useGraphStore.getState().setSessionId(data.sessionId);
            useGraphStore.getState().setIsAnonymous(false);
            setAnonymousSessionIdForMigration(null);

            // Close the sign-in dialog
            setShowSignInDialog(false);
          } else {
            console.error('Failed to migrate session');
          }
        } catch (error) {
          console.error('Migration error:', error);
        }
      }
    };

    migrateAnonymousSession();
  }, [session, anonymousSessionIdForMigration, isAnonymousSession]);

  // Handle node exploration
  useEffect(() => {
    const handleExploreNode = async (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string; exploreType?: string }>;
      const { nodeId, exploreType } = customEvent.detail;

      const node = storeNodes.find((n) => n.id === nodeId);
      if (!node || node.data.explored || node.data.loading) return;

      // For anonymous sessions, sign-in check happens in the API based on depth
      // We'll handle the ANONYMOUS_DEPTH_LIMIT error below

      // Mark as loading
      updateNode(nodeId, { loading: true, error: undefined });

      // Add skeleton nodes for preview using centralized layout config
      const skeletonNodes: GraphNode[] = Array.from({ length: 3 }).map((_, index) => ({
        id: `skeleton-${nodeId}-${index}`,
        type: 'knowledge',
        position: {
          x: node.position.x + (index - 1) * LAYOUT_CONFIG.level2Plus.horizontalSpacing,
          y: node.position.y + LAYOUT_CONFIG.level2Plus.verticalSpacing,
        },
        data: {
          title: '',
          depth: node.data.depth + 1,
          explored: false,
          loading: true,
          isSkeleton: true,
          sessionId: node.data.sessionId,
          parentId: nodeId,
        },
      }));

      // Create skeleton edges
      const skeletonEdges: GraphEdge[] = skeletonNodes.map((skeletonNode) => ({
        id: `edge-${nodeId}-${skeletonNode.id}`,
        source: nodeId,
        target: skeletonNode.id,
        animated: true,
      }));

      useGraphStore.getState().addNodes(skeletonNodes);
      useGraphStore.getState().addEdges(skeletonEdges);

      try {
        const sessionId = useGraphStore.getState().sessionId;
        const isAnonymous = useGraphStore.getState().isAnonymous;

        const response = await fetch(API_ENDPOINTS.EXPLORE_NODE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            parentId: nodeId,
            depth: node.data.depth,
            isAnonymous,
            clientId: getClientId(),
            exploreType, // Pass the exploration type (why/how/what/example)
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle anonymous depth limit - show sign-in dialog
          if (response.status === 401 && errorData.code === 'ANONYMOUS_DEPTH_LIMIT') {
            // Remove skeleton nodes
            const nodeIdsToRemove = skeletonNodes.map((n) => n.id);
            nodeIdsToRemove.forEach((id) => useGraphStore.getState().removeNode(id));

            // Save the session ID for migration after sign-in
            setAnonymousSessionIdForMigration(sessionId);

            // Show sign-in dialog
            setShowSignInDialog(true);

            // Mark parent as not loading
            updateNode(nodeId, { loading: false });
            return;
          }

          // Handle authenticated depth limit errors
          if (response.status === 429 && errorData.code === 'DEPTH_LIMIT_REACHED') {
            // Remove skeleton nodes
            const nodeIdsToRemove = skeletonNodes.map((n) => n.id);
            nodeIdsToRemove.forEach((id) => useGraphStore.getState().removeNode(id));

            // Show subscription modal
            setLimitReason(errorData.error);
            setUserTier(errorData.tier || 'FREE');
            setShowSubscriptionModal(true);

            // Mark parent as not loading
            updateNode(nodeId, { loading: false });
            return;
          }

          throw new Error(errorData.error || 'Failed to explore node');
        }

        const data = await response.json();

        // Remove skeleton nodes
        const nodeIdsToRemove = skeletonNodes.map((n) => n.id);
        nodeIdsToRemove.forEach((id) => useGraphStore.getState().removeNode(id));

        // Update parent node with full content if provided
        if (data.parentContent) {
          updateNode(nodeId, { content: data.parentContent });
        }

        // Add new nodes
        const newNodes: GraphNode[] = data.branches.map((branch: {
          id: string;
          title: string;
          content: string;
          summary: string;
          depth: number;
          position: { x: number; y: number };
          followUpType?: string;
        }) => ({
          id: branch.id,
          type: 'knowledge',
          position: branch.position,
          data: {
            title: branch.title,
            content: branch.content,
            summary: branch.summary,
            depth: branch.depth,
            explored: false,
            loading: false,
            sessionId: sessionId!,
            parentId: nodeId,
            followUpType: branch.followUpType, // Include follow-up type
          },
        }));

        // Add new edges
        const newEdges: GraphEdge[] = data.edges.map((edge: {
          id: string;
          source: string;
          target: string;
        }) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: true,
        }));

        useGraphStore.getState().addNodes(newNodes);
        useGraphStore.getState().addEdges(newEdges);

        // Mark parent as explored
        updateNode(nodeId, { loading: false, explored: true });

        // Update focus to the explored node if in focus mode
        if (useGraphStore.getState().focusMode) {
          useGraphStore.getState().setFocusedNode(nodeId);
        }
      } catch (error) {
        console.error('Exploration error:', error);

        // Remove skeleton nodes on error
        const nodeIdsToRemove = skeletonNodes.map((n) => n.id);
        nodeIdsToRemove.forEach((id) => useGraphStore.getState().removeNode(id));

        const errorMessage = error instanceof Error ? error.message : 'Failed to explore node';
        updateNode(nodeId, { loading: false, error: errorMessage });
        useGraphStore.getState().setError(`${errorMessage}. Click the node again to retry.`);
      }
    };

    window.addEventListener('explore-node', handleExploreNode);
    return () => window.removeEventListener('explore-node', handleExploreNode);
  }, [storeNodes, updateNode, session]);

  return (
    <>
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        reason={limitReason}
        currentTier={userTier}
        suggestedTier="STARTER"
      />

      <SignInDialog
        isOpen={showSignInDialog}
        onClose={() => setShowSignInDialog(false)}
      />

      {/* Breadcrumb navigation for focus mode */}
      <Breadcrumb />

      <div
        className="w-full h-full"
        onMouseLeave={() => setHoveredNodeId(null)}
      >
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.1 : 0.2,
          includeHiddenNodes: false,
          minZoom: 0.05,
          maxZoom: isMobile ? 0.6 : 1,
        }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={true}
      >
        <Background
          color="#06b6d4"
          gap={20}
          size={1}
          style={{ backgroundColor: '#0f172a' }}
        />
        {/* Hide controls on mobile - users can use pinch-to-zoom */}
        {!isMobile && <Controls showInteractive={false} />}
        {/* Hide minimap on mobile to save screen space */}
        {!isMobile && (
          <MiniMap
            nodeColor={(node) => {
              const knowledgeNode = node as unknown as GraphNode;
              if (knowledgeNode.data.loading) return '#3b82f6';
              if (knowledgeNode.data.explored) return '#06b6d4';
              return '#64748b';
            }}
            nodeStrokeColor={(node) => {
              const knowledgeNode = node as unknown as GraphNode;
              if (knowledgeNode.data.loading) return '#60a5fa';
              if (knowledgeNode.data.explored) return '#22d3ee';
              return '#94a3b8';
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(15, 23, 42, 0.85)"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              width: '180px',
              height: '120px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
            position="bottom-right"
            pannable
            zoomable
          />
        )}
      </ReactFlow>
      </div>
    </>
  );
};

// Wrap with ReactFlowProvider to enable useReactFlow hook
const KnowledgeCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <KnowledgeCanvasInner />
    </ReactFlowProvider>
  );
};

export default KnowledgeCanvas;