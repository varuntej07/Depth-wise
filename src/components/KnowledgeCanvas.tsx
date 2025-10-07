'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import KnowledgeNode from './KnowledgeNode';
import SkeletonNode from './SkeletonNode';
import KnowledgeEdge from './KnowledgeEdge';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';

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

const KnowledgeCanvas: React.FC = () => {
  const { nodes: storeNodes, edges: storeEdges, updateNode } = useGraphStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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

  // Sync store with React Flow state
  useEffect(() => {
    setNodes(storeNodes as unknown as Node[]);
  }, [storeNodes, setNodes]);

  // Enhanced edges with depth and highlight information
  useEffect(() => {
    const highlightedEdges = hoveredNodeId ? getPathToRoot(hoveredNodeId) : [];

    const enhancedEdges = storeEdges.map((edge) => ({
      ...edge,
      type: 'default',
      data: {
        depth: getEdgeDepth(edge.target),
        isHighlighted: highlightedEdges.includes(edge.id),
      },
    }));

    setEdges(enhancedEdges as unknown as Edge[]);
  }, [storeEdges, hoveredNodeId, getPathToRoot, getEdgeDepth, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node exploration
  useEffect(() => {
    const handleExploreNode = async (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>;
      const { nodeId } = customEvent.detail;

      const node = storeNodes.find((n) => n.id === nodeId);
      if (!node || node.data.explored || node.data.loading) return;

      // Mark as loading
      updateNode(nodeId, { loading: true, error: undefined });

      // Add skeleton nodes for preview
      const skeletonNodes: GraphNode[] = Array.from({ length: 3 }).map((_, index) => ({
        id: `skeleton-${nodeId}-${index}`,
        type: 'knowledge',
        position: {
          x: node.position.x + (index - 1) * 440,
          y: node.position.y + 300,
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

      useGraphStore.getState().addNodes(skeletonNodes);

      try {
        const sessionId = useGraphStore.getState().sessionId;
        const response = await fetch('/api/explore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            parentId: nodeId,
            depth: node.data.depth,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to explore node');
        }

        const data = await response.json();

        // Remove skeleton nodes
        const nodeIdsToRemove = skeletonNodes.map((n) => n.id);
        nodeIdsToRemove.forEach((id) => useGraphStore.getState().removeNode(id));

        // Add new nodes
        const newNodes: GraphNode[] = data.branches.map((branch: {
          id: string;
          title: string;
          content: string;
          summary: string;
          depth: number;
          position: { x: number; y: number };
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
  }, [storeNodes, updateNode]);

  return (
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
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background
          color="#06b6d4"
          gap={20}
          size={1}
          style={{ backgroundColor: '#0f172a' }}
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const knowledgeNode = node as unknown as GraphNode;
            if (knowledgeNode.data.loading) return '#3b82f6';
            if (knowledgeNode.data.explored) return '#06b6d4';
            return '#64748b';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          style={{
            backgroundColor: '#1e293b',
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};

export default KnowledgeCanvas;
