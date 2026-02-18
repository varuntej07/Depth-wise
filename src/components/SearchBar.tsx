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
import { usePostHog } from 'posthog-js/react';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionTier } from '@prisma/client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { getClientId } from '@/lib/utils';

interface SearchBarProps {
  isCompact?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ isCompact = false }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [limitReason, setLimitReason] = useState<string>('');
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE');
  const { setSessionId, setRootQuery, setIsAnonymous, addNodes, addEdges, clearGraph, setError, nodes, rootQuery } =
    useGraphStore();
  const posthog = usePostHog();

  const hasExistingGraph = nodes.length > 0;

  const handleSearch = async (e: React.FormEvent, retryQuery?: string) => {
    e.preventDefault();

    const searchQuery = retryQuery || query.trim();
    if (!searchQuery || isSearching) return;

    posthog.capture('search_initiated', {
      query: searchQuery,
      query_length: searchQuery.length,
      is_retry: !!retryQuery,
    });

    setIsSearching(true);
    setError(null);

    if (!retryQuery) {
      clearGraph();
    }

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
      const response = await fetch(API_ENDPOINTS.SESSION_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, clientId: getClientId() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429 && errorData.code === 'LIMIT_REACHED') {
          setLimitReason(errorData.error);
          setUserTier(errorData.tier || 'FREE');
          setShowSubscriptionModal(true);

          posthog.capture('exploration_limit_hit', {
            tier: errorData.tier,
            query: searchQuery,
          });

          if (!retryQuery) {
            clearGraph();
          }
          setIsSearching(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();

      if (!retryQuery) {
        clearGraph();
      }

      setSessionId(data.sessionId);
      setRootQuery(searchQuery);
      setIsAnonymous(data.isAnonymous || false);

      if (data.isAnonymous) {
        localStorage.setItem('pendingAnonymousSessionId', data.sessionId);
      }

      const rootNode: GraphNode = {
        id: data.rootNode.id,
        type: 'knowledge',
        position: data.rootNode.position,
        data: {
          title: data.rootNode.title,
          content: data.rootNode.content,
          exploreTerms: data.rootNode.exploreTerms || [],
          depth: data.rootNode.depth,
          explored: true,
          loading: false,
          sessionId: data.sessionId,
        },
      };

      const branchNodes: GraphNode[] = data.branches.map((branch: {
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
          sessionId: data.sessionId,
          parentId: data.rootNode.id,
          followUpType: branch.followUpType,
          exploreTerms: branch.exploreTerms || [],
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

      posthog.capture('exploration_created', {
        session_id: data.sessionId,
        query: searchQuery,
        branches_count: branchNodes.length,
        has_content: !!data.rootNode.content,
      });

      window.dispatchEvent(new CustomEvent('refresh-usage'));

      if (!retryQuery) {
        setQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start exploration';

      posthog.capture('search_failed', {
        query: searchQuery,
        error: errorMessage,
      });

      setError(`${errorMessage}. Please try again.`);
      if (!retryQuery) {
        clearGraph();
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestionQuery: string) => {
    posthog.capture('suggestion_clicked', {
      suggestion: suggestionQuery,
    });

    setQuery(suggestionQuery);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(fakeEvent);
    }, 0);
  };

  if (isCompact && hasExistingGraph) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute left-1/2 top-3 z-20 w-full max-w-2xl -translate-x-1/2 px-4 sm:px-6"
      >
        <div className="text-center">
          <h2 className="truncate bg-gradient-to-r from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)] bg-clip-text text-base font-semibold text-transparent sm:text-lg md:text-xl">
            {rootQuery || 'Exploring...'}
          </h2>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        reason={limitReason}
        currentTier={userTier}
        suggestedTier="STARTER"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="w-full space-y-6 rounded-3xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.78)] p-5 backdrop-blur-xl sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="space-y-3"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Start an exploration</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ask one question, then branch deeper.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--mint-text-secondary)] sm:text-base">
              Depthwise creates a connected tree of follow-up ideas so you can move from overview to detail without
              losing context.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            onSubmit={handleSearch}
            className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[var(--mint-accent-1)]" />
              <Input
                type="text"
                placeholder="Try: Why do transformers work so well for language?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isSearching}
                className="h-12 rounded-2xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.9)] pl-12 pr-4 text-sm text-white placeholder:text-[var(--mint-text-secondary)] focus:border-[var(--mint-accent-2)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.2)] focus-visible:ring-0 sm:h-14 sm:text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isSearching}
              size="lg"
              className="group h-12 rounded-2xl border-0 bg-[image:var(--mint-accent-gradient)] px-7 font-semibold text-[#04120e] transition-all duration-300 hover:brightness-105 hover:shadow-[0_8px_30px_rgba(16,185,129,0.35)] sm:h-14"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Building map...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base">Explore</span>
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <SuggestionsGrid onSelectSuggestion={handleSuggestionClick} displayCount={4} />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default SearchBar;
