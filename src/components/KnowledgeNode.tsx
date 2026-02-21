'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KnowledgeNodeData, FollowUpType } from '@/types/graph';
import { Loader2, AlertCircle, RotateCw, Sparkles, ChevronUp, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react';
import useGraphStore from '@/store/graphStore';
import { usePostHog } from 'posthog-js/react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { getClientId } from '@/lib/utils';

interface KnowledgeNodeProps {
  data: KnowledgeNodeData;
  id: string;
}

type FeedbackValue = 'up' | 'down';

const DOWN_FEEDBACK_OPTIONS = [
  { value: 'unclear', label: 'Unclear' },
  { value: 'too_shallow', label: 'Too shallow' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'repetitive', label: 'Repetitive' },
  { value: 'skip_reason', label: 'Skip reason' },
] as const;

// Get color based on depth
const getDepthColor = (depth: number) => {
  const colors = [
    { border: 'border-[rgba(16,185,129,0.55)]', shadow: 'shadow-[0_0_24px_var(--mint-accent-glow)]', text: 'text-[var(--mint-accent-1)]', glow: 'hover:shadow-[0_0_24px_var(--mint-accent-glow)]' },
    { border: 'border-[rgba(16,185,129,0.55)]', shadow: 'shadow-[0_0_24px_var(--mint-accent-glow)]', text: 'text-[var(--mint-accent-1)]', glow: 'hover:shadow-[0_0_24px_var(--mint-accent-glow)]' },
    { border: 'border-[rgba(16,185,129,0.55)]', shadow: 'shadow-[0_0_24px_var(--mint-accent-glow)]', text: 'text-[var(--mint-accent-1)]', glow: 'hover:shadow-[0_0_24px_var(--mint-accent-glow)]' },
    { border: 'border-[rgba(16,185,129,0.55)]', shadow: 'shadow-[0_0_24px_var(--mint-accent-glow)]', text: 'text-[var(--mint-accent-1)]', glow: 'hover:shadow-[0_0_24px_var(--mint-accent-glow)]' },
    { border: 'border-[rgba(16,185,129,0.55)]', shadow: 'shadow-[0_0_24px_var(--mint-accent-glow)]', text: 'text-[var(--mint-accent-1)]', glow: 'hover:shadow-[0_0_24px_var(--mint-accent-glow)]' },
  ];
  return colors[Math.min(depth, colors.length - 1)];
};

const KnowledgeNode: React.FC<KnowledgeNodeProps> = ({ data, id }) => {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState<FeedbackValue | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showDownvoteReasons, setShowDownvoteReasons] = useState(false);
  const [selectedDownvoteReason, setSelectedDownvoteReason] = useState<string | null>(null);
  const posthog = usePostHog();

  // Check if we're viewing a shared (public) graph
  // If so, we shouldn't allow exploration (read-only mode)
  const { isPublic, isAnonymous } = useGraphStore();
  const isReadOnly = isPublic;

  const stopEventPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const submitNodeFeedback = async (value: FeedbackValue, reason?: string) => {
    if (isSubmittingFeedback || data.loading || !data.sessionId) {
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const response = await fetch(API_ENDPOINTS.NODE_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: data.sessionId,
          nodeId: id,
          isAnonymous,
          value,
          reason: reason || undefined,
          nodeDepth: data.depth,
          nodeTitle: data.title,
          followUpType: data.followUpType,
          clientId: getClientId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to save node feedback');
      }

      setFeedbackValue(value);
      if (value === 'up') {
        setShowDownvoteReasons(false);
        setSelectedDownvoteReason(null);
      } else {
        setShowDownvoteReasons(false);
      }

      posthog.capture('node_feedback_submitted', {
        node_id: id,
        node_title: data.title,
        depth: data.depth,
        session_id: data.sessionId,
        value,
        reason: reason || null,
      });
    } catch (error) {
      console.error('Node feedback submission failed:', error);
      posthog.capture('node_feedback_submission_failed', {
        node_id: id,
        session_id: data.sessionId,
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleExplore = (exploreType?: FollowUpType, focusTerm?: string) => {
    // Don't allow exploration on read-only (shared) graphs
    if (data.loading || isReadOnly || (data.explored && !focusTerm)) return;

    // Track node exploration
    posthog.capture('node_explored', {
      node_id: id,
      node_title: data.title,
      depth: data.depth,
      session_id: data.sessionId,
      is_retry: !!data.error,
      explore_type: exploreType || 'explore',
      focus_term: focusTerm || null,
    });

    const event = new CustomEvent('explore-node', { detail: { nodeId: id, exploreType, focusTerm } });
    window.dispatchEvent(event);
  };

  // Determine which follow-up buttons to show based on branch type
  const getFollowUpButtons = () => {
    const branchType = data.followUpType;
    const buttons: { type: FollowUpType | undefined; label: string; icon?: string }[] = [];

    // Logic: Show complementary buttons based on what this branch type is
    // If it's a "how" branch, user might want to know "why"
    // If it's a "why" branch, user might want to know "how"
    // Always show examples as an option

    if (branchType === 'how' || branchType === 'what') {
      buttons.push({ type: 'why', label: 'Why?' });
    }
    if (branchType === 'why' || branchType === 'what') {
      buttons.push({ type: 'how', label: 'How?' });
    }
    if (branchType !== 'example') {
      buttons.push({ type: 'example', label: 'Examples' });
    }

    // If no specific branch type or limited buttons, show all options
    if (buttons.length < 2) {
      return [
        { type: 'why' as FollowUpType, label: 'Why?' },
        { type: 'how' as FollowUpType, label: 'How?' },
        { type: 'example' as FollowUpType, label: 'Examples' },
      ];
    }

    return buttons;
  };

  const depthColors = getDepthColor(data.depth);
  const contentText = data.content || data.summary || '';
  const charCount = contentText.length;
  const shouldShowInlineExpansion = charCount > 220;
  const isRootNode = data.depth === 1;

  return (
    <>
      <div className="knowledge-node">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
        />

        <Card
          className={`${
            isRootNode
              ? 'min-w-[320px] w-[320px] sm:min-w-[400px] sm:w-[400px] md:min-w-[500px] md:w-[500px]'
              : 'min-w-[280px] w-[280px] sm:min-w-[340px] sm:w-[340px] md:min-w-[420px] md:w-[420px]'
          } min-h-fit bg-[var(--mint-surface)] backdrop-blur-sm border-2 ${
            data.error
              ? 'border-red-500 shadow-red-500/30'
              : depthColors.border
          } ${
            data.error ? 'shadow-red-500/30' : depthColors.shadow
          } shadow-lg transition-all duration-300 ${
            data.error ? 'hover:shadow-red-500/50' : depthColors.glow
          } ${
            data.loading
              ? 'animate-pulse'
              : ''
          } flex flex-col`}
        >
        <CardHeader className="pb-2 border-b border-[var(--mint-elevated)]">
          <div className={`text-xs ${depthColors.text} mb-1 flex items-center justify-center gap-2 font-medium`}>
            <span>Level {data.depth}</span>
            {data.explored && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Explored
              </span>
            )}
          </div>
          <CardTitle className={`text-lg sm:text-xl font-semibold leading-tight text-white`}>
            {data.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2.5 pb-2.5 space-y-2 flex-1 flex flex-col overflow-hidden">
          {/* Content display with inline "Lens" expansion for long answers */}
          {contentText && (
            <div className="flex-1 overflow-hidden">
              <div className={`relative rounded-lg border border-[rgba(110,231,183,0.18)] bg-[rgba(32,52,45,0.3)] px-3 py-2.5 transition-all duration-200 ${
                isContentExpanded ? 'border-[rgba(110,231,183,0.36)]' : ''
              }`}>
                <div className={`knowledge-content-scroll text-[15px] sm:text-base text-white/92 leading-[1.65] ${
                  shouldShowInlineExpansion
                    ? isContentExpanded
                      ? 'max-h-[220px] overflow-y-auto pr-1'
                      : 'line-clamp-4'
                    : ''
                }`}>
                  {data.content || data.summary}
                </div>

                {shouldShowInlineExpansion && !isContentExpanded && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-lg bg-gradient-to-t from-[rgba(13,26,22,0.95)] to-transparent" />
                )}
              </div>

              {shouldShowInlineExpansion && (
                <button
                  onClick={(event) => {
                    stopEventPropagation(event);
                    setIsContentExpanded((expanded) => !expanded);
                    posthog.capture('node_content_expansion_toggled', {
                      node_id: id,
                      expanded: !isContentExpanded,
                      depth: data.depth,
                    });
                  }}
                  className={`mt-2 text-xs ${depthColors.text} hover:underline flex items-center gap-1 transition-colors font-medium`}
                >
                  {isContentExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>Collapse Lens</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Open Lens</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Per-node quality feedback */}
          {!data.loading && !data.error && (
            <div className="space-y-2 rounded-lg border border-[rgba(110,231,183,0.18)] bg-[rgba(32,52,45,0.24)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Was this node useful?</p>
                {isSubmittingFeedback && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--mint-accent-1)]" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(event) => {
                    stopEventPropagation(event);
                    setShowDownvoteReasons(false);
                    setSelectedDownvoteReason(null);
                    submitNodeFeedback('up');
                  }}
                  disabled={isSubmittingFeedback}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-60 ${
                    feedbackValue === 'up'
                      ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                      : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-[var(--mint-accent-1)]'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>Yes</span>
                </button>

                <button
                  onClick={(event) => {
                    stopEventPropagation(event);
                    setFeedbackValue('down');
                    setShowDownvoteReasons((visible) => !visible);
                  }}
                  disabled={isSubmittingFeedback}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-60 ${
                    feedbackValue === 'down'
                      ? 'border-red-500/60 bg-red-500/10 text-red-300'
                      : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-red-500/60 hover:text-red-300'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>No</span>
                </button>
              </div>

              {showDownvoteReasons && (
                <div className="flex flex-wrap gap-1.5">
                  {DOWN_FEEDBACK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={(event) => {
                        stopEventPropagation(event);
                        setSelectedDownvoteReason(option.value);
                        submitNodeFeedback(
                          'down',
                          option.value === 'skip_reason' ? undefined : option.value
                        );
                      }}
                      disabled={isSubmittingFeedback}
                      className={`rounded-md border px-2 py-1 text-[11px] transition-colors disabled:opacity-60 ${
                        selectedDownvoteReason === option.value
                          ? 'border-red-500/60 bg-red-500/10 text-red-300'
                          : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-red-500/60 hover:text-red-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {Array.isArray(data.exploreTerms) && data.exploreTerms.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Dig deeper into terms</p>
              <div className="flex flex-wrap gap-1.5">
                {data.exploreTerms.map((term) => (
                  <button
                    key={`${id}-${term.label}`}
                    onClick={(event) => {
                      stopEventPropagation(event);
                      handleExplore(undefined, term.query);
                    }}
                    className={`text-xs ${depthColors.text} border border-[var(--mint-elevated)] rounded-md py-1 px-2.5 font-medium transition-all duration-200 hover:border-[var(--mint-accent-2)] hover:bg-[var(--mint-elevated)]`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error state with retry button - Only show retry on non-read-only graphs */}
          {data.error && !data.loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs">{data.error}</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={(event) => {
                    stopEventPropagation(event);
                    handleExplore();
                  }}
                  className="w-full text-sm text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-4 font-medium transition-all duration-200 hover:border-red-500/60 flex items-center justify-center gap-2 group"
                >
                  <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Follow-up buttons - Only show on non-read-only graphs */}
          {!data.explored && !data.loading && !data.error && !isReadOnly && (
            <div className="space-y-2">
              {/* Follow-up type buttons */}
              <div className="flex flex-wrap gap-1.5">
                {getFollowUpButtons().map((btn) => (
                  <button
                    key={btn.type}
                    onClick={(event) => {
                      stopEventPropagation(event);
                      handleExplore(btn.type);
                    }}
                    className={`text-xs ${depthColors.text} hover:bg-[var(--mint-elevated)] border border-[var(--mint-elevated)] rounded-md py-1 px-2.5 font-medium transition-all duration-200 hover:border-[var(--mint-accent-2)]`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {/* Generic explore button */}
              <button
                onClick={(event) => {
                  stopEventPropagation(event);
                  handleExplore();
                }}
                className={`w-full text-xs sm:text-sm ${depthColors.text} hover:bg-[var(--mint-elevated)] border border-[rgba(16,185,129,0.35)] rounded-lg py-1.5 sm:py-2 px-3 sm:px-4 font-medium transition-all duration-200 hover:border-[var(--mint-accent-2)] flex items-center justify-center gap-2 group`}
              >
                <span>Explore Deeper</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* Loading state */}
          {data.loading && (
            <div className="flex items-center justify-center py-3 bg-[var(--mint-elevated)] rounded-lg">
              <Loader2 className={`h-5 w-5 animate-spin ${depthColors.text}`} />
              <span className={`ml-2 text-sm ${depthColors.text}`}>Exploring...</span>
            </div>
          )}
        </CardContent>
        </Card>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
        />
      </div>
    </>
  );
};

export default memo(
  KnowledgeNode,
  (prev, next) =>
    prev.data.title === next.data.title &&
    prev.data.explored === next.data.explored &&
    prev.data.loading === next.data.loading
);
