'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { setSessionId, setRootQuery, addNodes, addEdges, clearGraph, setError } =
    useGraphStore();

  const handleSearch = async (e: React.FormEvent, retryQuery?: string) => {
    e.preventDefault();

    const searchQuery = retryQuery || query.trim();
    if (!searchQuery || isSearching) return;

    setIsSearching(true);
    setError(null);

    // Only clear graph if not retrying
    if (!retryQuery) {
      clearGraph();
    }

    // Add skeleton nodes to show loading state
    const skeletonRootId = 'skeleton-root';
    const skeletonNodes: GraphNode[] = [
      {
        id: skeletonRootId,
        type: 'knowledge',
        position: { x: 0, y: 0 },
        data: {
          title: '',
          depth: 1,
          explored: false,
          loading: true,
          isSkeleton: true,
          sessionId: '',
        },
      },
    ];

    // Add skeleton child nodes
    const skeletonBranches: GraphNode[] = Array.from({ length: 4 }).map((_, index) => ({
      id: `skeleton-${index}`,
      type: 'knowledge',
      position: { x: (index - 1.5) * 440, y: 300 },
      data: {
        title: '',
        depth: 2,
        explored: false,
        loading: true,
        isSkeleton: true,
        sessionId: '',
        parentId: skeletonRootId,
      },
    }));

    if (!retryQuery) {
      addNodes([...skeletonNodes, ...skeletonBranches]);
    }

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();

      // Clear skeleton nodes
      if (!retryQuery) {
        clearGraph();
      }

      // Set session details
      setSessionId(data.sessionId);
      setRootQuery(searchQuery);

      // Create root node
      const rootNode: GraphNode = {
        id: data.rootNode.id,
        type: 'knowledge',
        position: data.rootNode.position,
        data: {
          title: data.rootNode.title,
          content: data.rootNode.content,
          depth: data.rootNode.depth,
          explored: true,
          loading: false,
          sessionId: data.sessionId,
        },
      };

      // Create branch nodes
      const branchNodes: GraphNode[] = data.branches.map((branch: any) => ({
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
          sessionId: data.sessionId,
          parentId: data.rootNode.id,
        },
      }));

      // Create edges
      const edges: GraphEdge[] = branchNodes.map((node) => ({
        id: `edge-${data.rootNode.id}-${node.id}`,
        source: data.rootNode.id,
        target: node.id,
        animated: true,
      }));

      // Add to store
      addNodes([rootNode, ...branchNodes]);
      addEdges(edges);

      // Clear search input only if not retrying
      if (!retryQuery) {
        setQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start exploration';
      setError(`${errorMessage}. Please try again.`);

      // Clear skeleton nodes on error
      if (!retryQuery) {
        clearGraph();
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-3xl mx-auto flex gap-3 items-center"
    >
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 h-5 w-5 z-10" />
        <Input
          type="text"
          placeholder="Ask anything... (e.g., How does quantum computing work?)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isSearching}
          className="pl-12 pr-4 h-14 text-base bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-slate-500 rounded-xl focus:ring-0 focus:ring-offset-0 transition-all duration-300 focus:shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:border-cyan-500/50"
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10"></div>
      </div>
      <Button
        type="submit"
        disabled={!query.trim() || isSearching}
        size="lg"
        className="h-14 px-8 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-medium rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed border-0"
      >
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Exploring...
          </>
        ) : (
          <>
            <span>Explore</span>
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </Button>
    </form>
  );
};

export default SearchBar;
