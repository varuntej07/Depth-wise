'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KnowledgeNodeData, FollowUpType } from '@/types/graph';
import { Loader2, AlertCircle, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import useGraphStore from '@/store/graphStore';
import { usePostHog } from 'posthog-js/react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { getClientId } from '@/lib/utils';

interface KnowledgeNodeProps {
  data: KnowledgeNodeData;
  id: string;
  selected?: boolean;
}

// Static color lookup map — all classes are fully spelled out so Tailwind's purge scanner can see them
type FeedbackValue = 'up' | 'down';
type ExploreAction = {
  key: string;
  type?: FollowUpType;
  label: string;
};

const DOWN_FEEDBACK_OPTIONS = [
  { value: 'unclear', label: 'Unclear' },
  { value: 'too_shallow', label: 'Too shallow' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'repetitive', label: 'Repetitive' },
  { value: 'skip_reason', label: 'Skip reason' },
] as const;

const DEPTH_COLORS = [
  {
    border: 'border-cyan-500',
    shadow: 'shadow-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'hover:shadow-cyan-500/50',
    hoverBorder: 'hover:border-cyan-500/60',
    borderLight: 'border-cyan-500/30',
  },
  {
    border: 'border-blue-500',
    shadow: 'shadow-blue-500/30',
    text: 'text-blue-400',
    glow: 'hover:shadow-blue-500/50',
    hoverBorder: 'hover:border-blue-500/60',
    borderLight: 'border-blue-500/30',
  },
  {
    border: 'border-violet-500',
    shadow: 'shadow-violet-500/30',
    text: 'text-violet-400',
    glow: 'hover:shadow-violet-500/50',
    hoverBorder: 'hover:border-violet-500/60',
    borderLight: 'border-violet-500/30',
  },
  {
    border: 'border-pink-500',
    shadow: 'shadow-pink-500/30',
    text: 'text-pink-400',
    glow: 'hover:shadow-pink-500/50',
    hoverBorder: 'hover:border-pink-500/60',
    borderLight: 'border-pink-500/30',
  },
  {
    border: 'border-amber-500',
    shadow: 'shadow-amber-500/30',
    text: 'text-amber-400',
    glow: 'hover:shadow-amber-500/50',
    hoverBorder: 'hover:border-amber-500/60',
    borderLight: 'border-amber-500/30',
  },
] as const;

const getDepthColor = (depth: number) => {
  return DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
};

const ROOT_PREVIEW_CHAR_LIMIT = 210;

const KnowledgeNode: React.FC<KnowledgeNodeProps> = ({ data, id, selected = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState<FeedbackValue | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showDownvoteReasons, setShowDownvoteReasons] = useState(false);
  const [selectedDownvoteReason, setSelectedDownvoteReason] = useState<string | null>(null);
  const posthog = usePostHog();
  const updateNodeInternals = useUpdateNodeInternals();

  const { isPublic, isAnonymous } = useGraphStore();
  const isReadOnly = isPublic;

  const stopEventPropagation = (event: { stopPropagation: () => void }) => {
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
    if (data.loading || isReadOnly || (data.explored && !focusTerm)) return;

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

  const getFollowUpButtons = (): ExploreAction[] => {
    const branchType = data.followUpType;
    const buttons: ExploreAction[] = [];

    if (branchType === 'how' || branchType === 'what') {
      buttons.push({ key: 'why', type: 'why', label: 'Why?' });
    }
    if (branchType === 'why' || branchType === 'what') {
      buttons.push({ key: 'how', type: 'how', label: 'How?' });
    }
    if (branchType !== 'example') {
      buttons.push({ key: 'example', type: 'example', label: 'Examples' });
    }

    if (buttons.length < 2) {
      return [
        { key: 'why', type: 'why', label: 'Why?' },
        { key: 'how', type: 'how', label: 'How?' },
        { key: 'example', type: 'example', label: 'Examples' },
      ];
    }

    return buttons;
  };

  const depthColors = getDepthColor(data.depth);
  const isRootNode = !data.parentId || data.depth <= 1;
  const contentText = (data.content || data.summary || '').trim();
  const shouldClampContent = contentText.length > (isRootNode ? ROOT_PREVIEW_CHAR_LIMIT : 280);
  const isContentExpanded = shouldClampContent && (isHovered || selected);
  const showExploreTerms = Array.isArray(data.exploreTerms) && data.exploreTerms.length > 0;
  const compactExploreActions = getFollowUpButtons();
  const showFeedbackControls =
    !isReadOnly && !data.loading && !data.error && (isHovered || selected || showDownvoteReasons);

  const rootPreviewText = useMemo(() => {
    if (!isRootNode || !shouldClampContent) {
      return contentText;
    }
    return `${contentText.slice(0, ROOT_PREVIEW_CHAR_LIMIT).trimEnd().replace(/[.,;:!?-]+$/, '')}...`;
  }, [contentText, isRootNode, shouldClampContent]);

  const displayedContent = !isContentExpanded && isRootNode ? rootPreviewText : contentText;

  useEffect(() => {
    const timer = window.setTimeout(() => updateNodeInternals(id), 30);
    return () => window.clearTimeout(timer);
  }, [id, isContentExpanded, updateNodeInternals]);

  return (
    <div
      className="knowledge-node"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDownvoteReasons(false);
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5 w-2.5 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
      />

      <Card
        className={`group/card relative w-[300px] gap-0 overflow-visible rounded-[22px] border-2 py-0 sm:w-[340px] lg:w-[360px] ${
          data.error ? 'border-red-500 shadow-red-500/30' : depthColors.border
        } ${
          data.error ? 'shadow-red-500/30' : depthColors.shadow
        } bg-[var(--mint-surface)] shadow-lg transition-all duration-300 ${
          data.error ? 'hover:shadow-red-500/50' : depthColors.glow
        } ${
          data.loading ? 'animate-pulse' : ''
        }`}
      >
        <CardHeader className="!space-y-0 border-b border-[var(--mint-elevated)]/80 !px-4 !py-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              className="line-clamp-2 text-[15px] font-semibold leading-[1.35] text-white sm:text-base"
              title={data.title}
            >
              {data.title}
            </CardTitle>
            {data.explored && (
              <span className="shrink-0 rounded-full border border-[var(--mint-elevated)] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/55">
                Explored
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 !px-4 !py-3">
          <div
            className={`rounded-xl border border-[rgba(110,231,183,0.2)] px-3 py-2.5 transition-colors duration-200 ${
              isContentExpanded ? 'bg-[rgba(32,52,45,0.35)]' : 'bg-[rgba(32,52,45,0.24)]'
            }`}
          >
            {contentText ? (
              <p
                className={`whitespace-pre-wrap text-[12px] leading-[1.52] text-white/90 sm:text-[13px] ${
                  !isContentExpanded ? (isRootNode ? 'line-clamp-4' : 'line-clamp-6') : ''
                }`}
              >
                {displayedContent}
              </p>
            ) : (
              <div className="flex min-h-[56px] items-center justify-center text-center text-[11px] text-[var(--mint-text-secondary)]">
                Content is loading for this node.
              </div>
            )}
          </div>

          {data.error && !data.loading && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-[11px] leading-[1.35]">{data.error}</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={(event) => {
                    stopEventPropagation(event);
                    handleExplore();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/35 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:border-red-400/60 hover:bg-red-500/12"
                >
                  <RotateCw className="h-3.5 w-3.5" />
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
                    onClick={() => handleExplore(btn.type)}
                    className={`text-xs ${depthColors.text} hover:bg-slate-800/50 border border-slate-600/50 rounded-md py-1 px-2.5 font-medium transition-all duration-200 ${depthColors.hoverBorder}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {/* Generic explore button */}
              <button
                onClick={() => handleExplore()}
                className={`w-full text-xs sm:text-sm ${depthColors.text} hover:bg-slate-800/50 border ${depthColors.borderLight} rounded-lg py-1.5 sm:py-2 px-3 sm:px-4 font-medium transition-all duration-200 ${depthColors.hoverBorder} flex items-center justify-center gap-2 group`}
              >
                <span>Explore Deeper</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {!isReadOnly && !data.loading && !data.error && (
            <div
              className={`absolute bottom-2 right-3 z-30 transition-all duration-200 ${
                showFeedbackControls
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-1 opacity-0'
              }`}
            >
              <div className="relative">
                {showDownvoteReasons && (
                  <div className="absolute bottom-full right-0 z-20 mb-2 w-[176px] rounded-xl border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.98)] p-2 shadow-xl">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Reason</p>
                    <div className="flex flex-wrap gap-1">
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
                          className={`rounded-md border px-1.5 py-1 text-[10px] transition-colors disabled:opacity-60 ${
                            selectedDownvoteReason === option.value
                              ? 'border-red-500/60 bg-red-500/10 text-red-300'
                              : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-red-500/60 hover:text-red-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 rounded-full border border-[var(--mint-elevated)] bg-[rgba(13,26,22,0.9)] px-1.5 py-1 shadow-lg backdrop-blur-sm">
                  {isSubmittingFeedback && (
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--mint-accent-1)]" />
                  )}

                  <button
                    onClick={(event) => {
                      stopEventPropagation(event);
                      setShowDownvoteReasons(false);
                      setSelectedDownvoteReason(null);
                      submitNodeFeedback('up');
                    }}
                    disabled={isSubmittingFeedback}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
                      feedbackValue === 'up'
                        ? 'border-[var(--mint-accent-2)] bg-[rgba(16,185,129,0.16)] text-[var(--mint-accent-1)]'
                        : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-[var(--mint-accent-2)] hover:text-[var(--mint-accent-1)]'
                    }`}
                    title="Like node"
                    aria-label="Like node"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={(event) => {
                      stopEventPropagation(event);
                      setFeedbackValue('down');
                      setShowDownvoteReasons((visible) => !visible);
                    }}
                    disabled={isSubmittingFeedback}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
                      feedbackValue === 'down'
                        ? 'border-red-500/60 bg-red-500/10 text-red-300'
                        : 'border-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:border-red-500/60 hover:text-red-300'
                    }`}
                    title="Dislike node"
                    aria-label="Dislike node"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5 w-2.5 !bg-[var(--mint-accent-2)] !border-2 !border-[var(--mint-page)]"
      />
    </div>
  );
};

export default memo(
  KnowledgeNode,
  (prev, next) =>
    prev.selected === next.selected &&
    prev.data.title === next.data.title &&
    prev.data.content === next.data.content &&
    prev.data.summary === next.data.summary &&
    prev.data.parentId === next.data.parentId &&
    prev.data.followUpType === next.data.followUpType &&
    JSON.stringify(prev.data.exploreTerms ?? []) === JSON.stringify(next.data.exploreTerms ?? []) &&
    prev.data.explored === next.data.explored &&
    prev.data.loading === next.data.loading &&
    prev.data.error === next.data.error &&
    prev.data.content === next.data.content &&
    prev.data.summary === next.data.summary
);
