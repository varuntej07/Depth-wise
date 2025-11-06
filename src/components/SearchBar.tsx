'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useGraphStore from '@/store/graphStore';
import { GraphNode, GraphEdge } from '@/types/graph';
import { LAYOUT_CONFIG } from '@/lib/layout';
import { SuggestionsGrid } from './SuggestionCard';

interface SearchBarProps {
  isCompact?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ isCompact = false }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { setSessionId, setRootQuery, addNodes, addEdges, clearGraph, setError, nodes, rootQuery } =
    useGraphStore();

  const hasExistingGraph = nodes.length > 0;

  const handleSearch = async (e: React.FormEvent, retryQuery?: string) => {
    e.preventDefault();

    const searchQuery = retryQuery || query.trim();
    if (!searchQuery || isSearching) return;

    setIsSearching(true);
    setError(null);

    if (!retryQuery) {
      clearGraph();
    }

    // Skeleton nodes for loading state
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

    const skeletonBranches: GraphNode[] = Array.from({ length: 4 }).map((_, index) => ({
      id: `skeleton-${index}`,
      type: 'knowledge',
      position: {
        x: (index - 1.5) * LAYOUT_CONFIG.level1.horizontalSpacing,
        y: LAYOUT_CONFIG.level1.verticalSpacing,
      },
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

    const skeletonEdges: GraphEdge[] = skeletonBranches.map((node) => ({
      id: `edge-${skeletonRootId}-${node.id}`,
      source: skeletonRootId,
      target: node.id,
      animated: true,
    }));

    if (!retryQuery) {
      addNodes([...skeletonNodes, ...skeletonBranches]);
      addEdges(skeletonEdges);
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

      if (!retryQuery) {
        clearGraph();
      }

      setSessionId(data.sessionId);
      setRootQuery(searchQuery);

      // Root node
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

      // Branch nodes
      const branchNodes: GraphNode[] = data.branches.map((branch: {
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
          sessionId: data.sessionId,
          parentId: data.rootNode.id,
        },
      }));

      const edges: GraphEdge[] = branchNodes.map((node) => ({
        id: `edge-${data.rootNode.id}-${node.id}`,
        source: data.rootNode.id,
        target: node.id,
        animated: true,
      }));

      addNodes([rootNode, ...branchNodes]);
      addEdges(edges);

      if (!retryQuery) {
        setQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start exploration';
      setError(`${errorMessage}. Please try again.`);

      if (!retryQuery) {
        clearGraph();
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestionQuery: string) => {
    setQuery(suggestionQuery);
    // Trigger search after state update
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(fakeEvent);
    }, 0);
  };

  // Compact layout (when graph exists) - Read-only display
  if (isCompact && hasExistingGraph) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-4 sm:px-6"
      >
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            {rootQuery || 'Exploring...'}
          </h2>
        </div>
      </motion.div>
    );
  }

  // Full layout (empty state)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center justify-center min-h-screen px-4"
    >
      {/* Centered Content */}
      <div className="w-full max-w-3xl space-y-8 md:space-y-12">
        {/* Title and Description */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-3">
            Explore Any Topic
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Ask questions and explore answers in depth with interconnected knowledge trees
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center"
        >
          <div className="relative flex-1 group">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 h-4 w-4 sm:h-5 sm:w-5 z-10" />
            <Input
              type="text"
              placeholder="Ask anything... (e.g., How does quantum computing work?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className="pl-10 sm:pl-12 pr-3 sm:pr-4 h-12 sm:h-14 text-sm sm:text-base bg-slate-900/80 backdrop-blur-sm border-2 border-cyan-500/30 focus:border-cyan-500 text-white placeholder:text-slate-500 placeholder:text-xs sm:placeholder:text-sm rounded-xl focus:ring-0 focus:ring-offset-0 transition-all duration-300 focus:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10" />
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || isSearching}
            size="lg"
            className="h-12 sm:h-14 px-6 sm:px-8 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-medium rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed border-0"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-sm sm:text-base">Exploring...</span>
              </>
            ) : (
              <>
                <span className="text-sm sm:text-base">Explore</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </Button>
        </motion.form>

        {/* Suggestions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <SuggestionsGrid onSelectSuggestion={handleSuggestionClick} displayCount={2} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SearchBar;