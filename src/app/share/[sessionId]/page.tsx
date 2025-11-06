'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

/**
 * Public Share Page - /share/[sessionId]
 *
 * This page displays a read-only version of a shared knowledge graph.
 * Anyone with the link can view it, but they cannot:
 * - Explore deeper (no interactive buttons)
 * - Edit the graph
 * - Create new searches
 *
 * The graph must be marked as public (isPublic: true) to be viewable.
 */
export default function SharePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  // Local state for this page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<{ name: string } | null>(null);

  // Use the graph store to render the graph
  // We use loadSession to populate the store with the shared graph data
  const { loadSession } = useGraphStore();

  /**
   * Fetch the public graph data when the page loads
   */
  useEffect(() => {
    const fetchPublicGraph = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call the public share API
        const response = await fetch(`/api/share/${sessionId}`);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load shared graph');
        }

        const data = await response.json();

        // Transform the node data to match our GraphNode format
        const nodes: GraphNode[] = data.nodes.map((node: {
          id: string;
          title: string;
          content: string | null;
          summary: string | null;
          depth: number;
          explored: boolean;
          parentId: string | null;
          position: { x: number; y: number };
        }) => ({
          id: node.id,
          type: 'knowledge' as const,
          position: node.position,
          data: {
            title: node.title,
            content: node.content,
            summary: node.summary,
            depth: node.depth,
            explored: node.explored, // All nodes are marked as explored (read-only)
            loading: false,
            sessionId: data.session.id,
            parentId: node.parentId,
          },
        }));

        // Transform the edge data
        const edges: GraphEdge[] = data.edges.map((edge: {
          id: string;
          source: string;
          target: string;
          animated: boolean;
        }) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.animated,
        }));

        // Load the shared graph into the store
        loadSession(
          data.session.id,
          data.session.rootQuery,
          nodes,
          edges,
          true // isPublic = true for shared graphs
        );

        // Save creator info for attribution
        setCreator(data.creator);

      } catch (err) {
        console.error('Failed to load shared graph:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load shared graph. It may be private or no longer exist.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicGraph();
  }, [sessionId, loadSession]);

  /**
   * Loading State
   */
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Loading shared graph...</p>
        </div>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="text-6xl">🔒</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Graph Not Available
            </h1>
            <p className="text-slate-400">{error}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-medium rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Create Your Own Graph
          </Link>
        </div>
      </div>
    );
  }

  /**
   * Main Render - Shared Graph View
   */
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-violet-950/20 pointer-events-none" />

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none" />

      {/* Header - Simplified for shared view */}
      <header className="relative z-10 w-full border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl h-16 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left side - Back to home */}
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">
              Create Your Own
            </span>
          </Link>

          {/* Center - Shared indicator */}
          <div className="flex items-center gap-2 text-cyan-400">
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Shared Graph</span>
          </div>

          {/* Right side - Creator attribution */}
          {creator && (
            <div className="text-xs text-slate-400">
              by <span className="text-slate-300">{creator.name || 'Anonymous'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Canvas - Read-only graph visualization */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <KnowledgeCanvas />
      </main>

      {/* Info banner at bottom */}
      <div className="relative z-10 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-sm text-slate-400">
          <span>👁️</span>
          <span>You&apos;re viewing a shared graph (read-only)</span>
        </div>
      </div>

      {/* Error alert if any runtime errors occur */}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  );
}
