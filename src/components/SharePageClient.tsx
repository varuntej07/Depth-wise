'use client';

import { useEffect, useState } from 'react';
import KnowledgeCanvas from '@/components/KnowledgeCanvas';
import ErrorAlert from '@/components/ErrorAlert';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/api-config';

export default function SharePageClient({ sessionId }: { sessionId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<{ name: string } | null>(null);

  const { loadSession, clearGraph } = useGraphStore();

  useEffect(() => {
    return () => { clearGraph(); };
  }, [clearGraph]);

  useEffect(() => {
    const fetchPublicGraph = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.SHARE_GET(sessionId));

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load shared graph');
        }

        const data = await response.json();

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
            explored: node.explored,
            loading: false,
            sessionId: data.session.id,
            parentId: node.parentId,
          },
        }));

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

        loadSession(data.session.id, data.session.rootQuery, nodes, edges, true);
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--mint-page)]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[var(--mint-accent-2)] border-t-[var(--mint-accent-2)] rounded-full animate-spin mx-auto" />
          <p className="text-[var(--mint-text-secondary)]">Loading shared graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--mint-page)] p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="text-6xl">LOCKED</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Graph Not Available</h2>
            <p className="text-[var(--mint-text-secondary)]">{error}</p>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[image:var(--mint-accent-gradient)] hover:brightness-105 text-[#04120e] font-medium rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Create Your Own Graph
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--mint-page)] relative overflow-hidden">
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-[rgba(110,231,183,0.18)] via-[var(--mint-page)] to-[rgba(52,211,153,0.16)] pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[rgba(16,185,129,0.16)] rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[rgba(16,185,129,0.16)] rounded-full blur-3xl animate-pulse-slow delay-1000 pointer-events-none" />

      <header className="relative z-10 w-full border-b border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.9)] backdrop-blur-xl h-16 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/explore"
            className="flex items-center gap-2 text-[var(--mint-text-secondary)] hover:text-[var(--mint-accent-1)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Create Your Own</span>
          </Link>

          <div className="flex items-center gap-2 text-[var(--mint-accent-1)]">
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Shared Graph</span>
          </div>

          {creator && (
            <div className="text-xs text-[var(--mint-text-secondary)]">
              by <span className="text-[var(--mint-text-secondary)]">{creator.name || 'Anonymous'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-hidden">
        <KnowledgeCanvas />
      </main>

      <div className="relative z-10 border-t border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.9)] backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-center gap-2 text-sm text-[var(--mint-text-secondary)]">
          <span>View-only</span>
          <span>You&apos;re viewing a shared graph (read-only)</span>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
    </div>
  );
}
