'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Connection,
  Node,
  Edge,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import KnowledgeNode from './KnowledgeNode';
import SkeletonNode from './SkeletonNode';
import KnowledgeEdge from './KnowledgeEdge';
import Breadcrumb from './Breadcrumb';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';
import { LAYOUT_CONFIG, NODE_CARD_DIMENSIONS, getResponsiveLayoutConfig } from '@/lib/layout';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionTier } from '@prisma/client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { SignInDialog } from './SignInDialog';
import { useSession } from 'next-auth/react';
import { getClientId } from '@/lib/utils';
import { ArrowLeft, Crosshair, Type } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

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
    sessionId,
    updateNode,
    isAnonymous: isAnonymousSession,
    focusMode,
    focusedNodeId,
    focusDepthThreshold,
    setFocusedNode,
    getVisibleNodes,
    getVisibleEdges,
    getMaxDepth,
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
  const [crispTextMode, setCrispTextMode] = useState(true);
  const [centeredNodeId, setCenteredNodeId] = useState<string | null>(null);
  const [centerHistory, setCenterHistory] = useState<string[]>([]);
  const { fitView, setCenter, getZoom } = useReactFlow();
  const posthog = usePostHog();
  const initialFitDone = useRef(false);
  const centerPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crispPreferenceHydrated = useRef(false);
  const shouldRenderDesktopTools = !isMobile && nodes.length > 0;
  const canvasMinZoom = isMobile ? 0.05 : crispTextMode ? 0.55 : 0.05;
  const canvasFitMaxZoom = isMobile ? 0.6 : crispTextMode ? 1.05 : 1;
  const responsiveLayout = getResponsiveLayoutConfig(isMobile);
  const fallbackNodeHeight = isMobile
    ? NODE_CARD_DIMENSIONS.mobile.height
    : NODE_CARD_DIMENSIONS.desktop.height;
  const fallbackNodeWidth = isMobile
    ? NODE_CARD_DIMENSIONS.mobile.width
    : NODE_CARD_DIMENSIONS.desktop.width;
  const depthRowGap = Math.max(36, responsiveLayout.level2Plus.verticalSpacing - fallbackNodeHeight);
  const baselineDepthYMap = useMemo(() => {
    const map = new Map<number, number>();

    for (const node of storeNodes) {
      const depth = Math.max(1, node.data?.depth || 1);
      const existingY = map.get(depth);
      const nodeY = node.position.y;
      map.set(depth, existingY === undefined ? nodeY : Math.min(existingY, nodeY));
    }

    return map;
  }, [storeNodes]);

  const getMiniMapNodeColor = useCallback((node: Node) => {
    const data = (node as Partial<GraphNode>).data as GraphNode['data'] | undefined;
    if (!data) return '#20342D';
    if (data.loading) return '#34D399';
    if (data.explored) return '#10B981';
    return '#20342D';
  }, []);

  const getMiniMapNodeStrokeColor = useCallback((node: Node) => {
    const data = (node as Partial<GraphNode>).data as GraphNode['data'] | undefined;
    if (!data) return '#D1D5DB';
    if (data.loading) return '#6EE7B7';
    if (data.explored) return '#34D399';
    return '#D1D5DB';
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Persisted crisp text mode preference.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = 'depthwise_crisp_text_mode';
    const saved = localStorage.getItem(storageKey);
    if (saved === null) {
      const desktopDefault = window.innerWidth >= 768;
      setCrispTextMode(desktopDefault);
      localStorage.setItem(storageKey, String(desktopDefault));
    } else {
      setCrispTextMode(saved === 'true');
    }
    crispPreferenceHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!crispPreferenceHydrated.current || typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('depthwise_crisp_text_mode', String(crispTextMode));
  }, [crispTextMode]);

  // Detect long tasks so we can track jank in production.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }
    if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < 120) {
          continue;
        }

        posthog.capture('graph_render_long_task_detected', {
          duration_ms: Number(entry.duration.toFixed(1)),
          crisp_text_mode: crispTextMode,
        });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  }, [crispTextMode, posthog]);

  // Reset fit state when switching sessions so each loaded history graph gets centered once.
  useEffect(() => {
    initialFitDone.current = false;
    setCenterHistory([]);
    setCenteredNodeId(null);
  }, [sessionId]);

  // Trigger fitView after rendered nodes are available (after skeleton nodes are replaced).
  useEffect(() => {
    if (initialFitDone.current) {
      return;
    }

    // Only trigger on initial load when we have real nodes (not skeletons)
    const hasRealNodes = nodes.some((n) => {
      const data = n.data as GraphNode['data'] | undefined;
      return !data?.isSkeleton;
    });
    const hasNoSkeletons = nodes.every((n) => {
      const data = n.data as GraphNode['data'] | undefined;
      return !data?.isSkeleton;
    });

    if (hasRealNodes && hasNoSkeletons && nodes.length > 0) {
      // Delay fitView slightly to ensure nodes are rendered
      const timer = setTimeout(() => {
        fitView({
          padding: isMobile ? 0.12 : 0.24,
          duration: 300,
          maxZoom: canvasFitMaxZoom,
          minZoom: canvasMinZoom,
        });
        initialFitDone.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView, isMobile, canvasFitMaxZoom, canvasMinZoom]);

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

  const applyDepthRowLayout = useCallback(
    (inputNodes: Node[]): Node[] => {
      if (inputNodes.length < 2) {
        return inputNodes;
      }

      type SizedNode = Node & { measured?: { width?: number; height?: number } };
      const depthGroups = new Map<number, SizedNode[]>();
      const minYByDepth = new Map<number, number>();
      const maxHeightByDepth = new Map<number, number>();

      for (const node of inputNodes) {
        const sizedNode = node as SizedNode;
        const nodeData = node.data as GraphNode['data'] | undefined;
        const depth = Math.max(1, nodeData?.depth || 1);
        const nodeHeight = Math.max(
          sizedNode.height ?? sizedNode.measured?.height ?? fallbackNodeHeight,
          120
        );

        if (!depthGroups.has(depth)) {
          depthGroups.set(depth, []);
        }
        depthGroups.get(depth)!.push(sizedNode);

        const minY = minYByDepth.get(depth);
        minYByDepth.set(depth, minY === undefined ? node.position.y : Math.min(minY, node.position.y));

        const currentMax = maxHeightByDepth.get(depth) ?? 0;
        maxHeightByDepth.set(depth, Math.max(currentMax, nodeHeight));
      }

      const depths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
      if (depths.length < 2) {
        return inputNodes;
      }

      const rowYByDepth = new Map<number, number>();
      const firstDepth = depths[0];
      const firstDepthY = baselineDepthYMap.get(firstDepth) ?? minYByDepth.get(firstDepth) ?? 0;
      rowYByDepth.set(firstDepth, firstDepthY);

      for (let index = 1; index < depths.length; index += 1) {
        const depth = depths[index];
        const previousDepth = depths[index - 1];
        const previousRowY = rowYByDepth.get(previousDepth) ?? 0;
        const previousRowHeight = maxHeightByDepth.get(previousDepth) ?? fallbackNodeHeight;
        const computedY = previousRowY + previousRowHeight + depthRowGap;
        const baselineY = baselineDepthYMap.get(depth) ?? minYByDepth.get(depth) ?? computedY;
        rowYByDepth.set(depth, Math.max(computedY, baselineY));
      }

      let hasPositionChanges = false;
      const reflowedNodes = inputNodes.map((node) => {
        const nodeData = node.data as GraphNode['data'] | undefined;
        const depth = Math.max(1, nodeData?.depth || 1);
        const nextY = rowYByDepth.get(depth);
        if (nextY === undefined || Math.abs(node.position.y - nextY) < 0.5) {
          return node;
        }

        hasPositionChanges = true;
        return {
          ...node,
          position: {
            ...node.position,
            y: nextY,
          },
        };
      });

      return hasPositionChanges ? reflowedNodes : inputNodes;
    },
    [baselineDepthYMap, depthRowGap, fallbackNodeHeight]
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
    const nodesToRender =
      visibleNodes.length === 0 && storeNodes.length > 0 ? storeNodes : visibleNodes;
    setNodes((currentNodes) => {
      const currentNodeMap = new Map(currentNodes.map((node) => [node.id, node]));
      const enhancedNodes = nodesToRender.map((node) => {
        const isCentered = node.id === centeredNodeId;
        const existingClassName =
          typeof node.className === 'string' ? node.className : '';
        const className = `${existingClassName} ${isCentered ? 'depthwise-node-center-highlight' : ''}`.trim();
        const existingNode = currentNodeMap.get(node.id) as
          | (Node & { measured?: { width?: number; height?: number } })
          | undefined;

        return {
          ...node,
          className: className || undefined,
          zIndex: isCentered ? 100 : node.zIndex,
          width: node.width ?? existingNode?.width,
          height: node.height ?? existingNode?.height,
          measured: existingNode?.measured,
        };
      });

      return applyDepthRowLayout(enhancedNodes as unknown as Node[]);
    });
  }, [storeNodes, focusMode, focusedNodeId, centeredNodeId, setNodes, getVisibleNodes, applyDepthRowLayout]);

  useEffect(() => {
    setNodes((currentNodes) => applyDepthRowLayout(currentNodes));
  }, [nodes, setNodes, applyDepthRowLayout]);

  // Enhanced edges with depth and highlight information (apply focus mode filtering)
  useEffect(() => {
    const visibleEdges = focusMode ? getVisibleEdges() : storeEdges;
    const highlightedEdges = hoveredNodeId ? getPathToRoot(hoveredNodeId) : [];

    const enhancedEdges = visibleEdges.map((edge) => ({
      ...edge,
      type: 'default',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
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

  const clearCenterPulse = useCallback(() => {
    if (centerPulseTimer.current) {
      clearTimeout(centerPulseTimer.current);
      centerPulseTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCenterPulse();
    };
  }, [clearCenterPulse]);

  const centerNodeInViewport = useCallback(
    (node: Node, options?: { addToHistory?: boolean; trigger?: 'click' | 'back' }) => {
      const fallbackWidth = fallbackNodeWidth;
      const fallbackHeight = fallbackNodeHeight;
      const width = node.width ?? fallbackWidth;
      const height = node.height ?? fallbackHeight;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      const currentZoom = getZoom();
      const targetZoom = isMobile
        ? Math.max(currentZoom, 0.65)
        : Math.max(currentZoom, crispTextMode ? 0.95 : 0.8);

      setCenter(centerX, centerY, {
        zoom: targetZoom,
        duration: 320,
      });

      setCenteredNodeId(node.id);
      clearCenterPulse();
      centerPulseTimer.current = setTimeout(() => {
        setCenteredNodeId((current) => (current === node.id ? null : current));
      }, 1200);

      if (options?.addToHistory !== false) {
        setCenterHistory((history) => {
          if (history[history.length - 1] === node.id) {
            return history;
          }
          const nextHistory = [...history, node.id];
          return nextHistory.slice(-30);
        });
      }

      if (options?.trigger === 'click') {
        const nodeData = node.data as GraphNode['data'] | undefined;
        posthog.capture('node_clicked_centered', {
          node_id: node.id,
          node_title: nodeData?.title || null,
          depth: nodeData?.depth ?? null,
          zoom_before: Number(currentZoom.toFixed(3)),
          zoom_after: Number(targetZoom.toFixed(3)),
        });
      }
    },
    [clearCenterPulse, crispTextMode, fallbackNodeHeight, fallbackNodeWidth, getZoom, isMobile, posthog, setCenter]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, [role="button"]')) {
        return;
      }

      centerNodeInViewport(node, { addToHistory: true, trigger: 'click' });
    },
    [centerNodeInViewport]
  );

  const handleBackToPreviousCenter = useCallback(() => {
    const previousNodeId = centerHistory[centerHistory.length - 2];
    if (!previousNodeId) {
      return;
    }

    const previousNode = nodes.find((node) => node.id === previousNodeId);
    if (!previousNode) {
      return;
    }

    setCenterHistory((history) => history.slice(0, -1));
    centerNodeInViewport(previousNode, { addToHistory: false, trigger: 'back' });
  }, [centerHistory, centerNodeInViewport, nodes]);

  const handleResetViewport = useCallback(() => {
    fitView({
      padding: isMobile ? 0.12 : 0.24,
      duration: 300,
      minZoom: canvasMinZoom,
      maxZoom: canvasFitMaxZoom,
      includeHiddenNodes: false,
    });
    posthog.capture('viewport_reset', {
      crisp_text_mode: crispTextMode,
    });
  }, [canvasFitMaxZoom, canvasMinZoom, crispTextMode, fitView, isMobile, posthog]);

  const toggleCrispTextMode = useCallback(() => {
    setCrispTextMode((previous) => {
      const next = !previous;
      posthog.capture('crisp_text_mode_toggled', {
        enabled: next,
      });
      return next;
    });
  }, [posthog]);

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
      const customEvent = event as CustomEvent<{ nodeId: string; exploreType?: string; focusTerm?: string }>;
      const { nodeId, exploreType, focusTerm } = customEvent.detail;

      const node = storeNodes.find((n) => n.id === nodeId);
      if (!node || node.data.loading || (node.data.explored && !focusTerm)) return;

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
            focusTerm,
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
          updateNode(nodeId, {
            content: data.parentContent,
            exploreTerms: data.parentTerms || [],
          });
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
          exploreTerms?: { label: string; query: string }[];
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
            exploreTerms: branch.exploreTerms || [],
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

        // Trigger usage refresh to update UsageIndicator
        window.dispatchEvent(new CustomEvent('refresh-usage'));

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
        className={crispTextMode ? 'crisp-text-mode' : ''}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
        onNodeMouseLeave={() => setHoveredNodeId(null)}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.12 : 0.24,
          includeHiddenNodes: false,
          minZoom: canvasMinZoom,
          maxZoom: canvasFitMaxZoom,
        }}
        minZoom={canvasMinZoom}
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
        <Panel position="top-right">
          <div className="flex flex-col gap-2 rounded-xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.92)] p-2 shadow-xl backdrop-blur-sm">
            <button
              onClick={toggleCrispTextMode}
              className="flex items-center gap-2 rounded-md border border-[var(--mint-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--mint-text-secondary)] transition-colors hover:border-[var(--mint-accent-2)] hover:text-[var(--mint-accent-1)]"
              title="Toggle crisp text mode"
            >
              <Type className="h-3.5 w-3.5" />
              <span>{crispTextMode ? 'Crisp Text On' : 'Crisp Text Off'}</span>
            </button>

            <button
              onClick={handleResetViewport}
              className="flex items-center gap-2 rounded-md border border-[var(--mint-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--mint-text-secondary)] transition-colors hover:border-[var(--mint-accent-2)] hover:text-[var(--mint-accent-1)]"
              title="Fit all nodes in viewport"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Fit Graph</span>
            </button>

            <button
              onClick={handleBackToPreviousCenter}
              disabled={centerHistory.length < 2}
              className="flex items-center gap-2 rounded-md border border-[var(--mint-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--mint-text-secondary)] transition-colors enabled:hover:border-[var(--mint-accent-2)] enabled:hover:text-[var(--mint-accent-1)] disabled:cursor-not-allowed disabled:opacity-40"
              title="Jump back to previous centered node"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back Focus</span>
            </button>
          </div>
        </Panel>
        <Background
          color="#34D399"
          gap={20}
          size={1}
          style={{ backgroundColor: '#0D1A16' }}
        />
        {/* Desktop-only helper tools */}
        {shouldRenderDesktopTools && <Controls showInteractive={false} />}
        {shouldRenderDesktopTools && (
          <MiniMap
            nodeColor={getMiniMapNodeColor}
            nodeStrokeColor={getMiniMapNodeStrokeColor}
            nodeStrokeWidth={2}
            maskColor="rgba(5, 13, 11, 0.85)"
            style={{
              backgroundColor: '#0D1A16',
              border: '1px solid rgba(16, 185, 129, 0.35)',
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
