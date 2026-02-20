'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface UsageData {
  explorationsUsed: number;
  explorationsLimit: number | null;
  tier: string;
  percentage: number;
}

/**
 * Usage Indicator Component
 *
 * Shows the user's current exploration usage with a progress bar.
 * Features:
 * - Real-time usage tracking
 * - Visual progress bar with gradient
 * - Color-coded based on usage percentage
 * - Compact design for header placement
 */
export const UsageIndicator: React.FC = () => {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.USER_USAGE);
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Listen for usage refresh events
  useEffect(() => {
    const handleRefreshUsage = () => {
      fetchUsage();
    };

    window.addEventListener('refresh-usage', handleRefreshUsage);
    return () => window.removeEventListener('refresh-usage', handleRefreshUsage);
  }, [fetchUsage]);

  if (!session?.user || loading || !usage) {
    return null;
  }

  const { explorationsUsed, explorationsLimit, percentage } = usage;
  const explorationsRemaining =
    explorationsLimit === null ? null : Math.max(0, explorationsLimit - explorationsUsed);
  const remainingLabel =
    explorationsRemaining === null
      ? 'Unlimited explorations left on your current plan.'
      : `${explorationsRemaining} exploration${explorationsRemaining === 1 ? '' : 's'} left this cycle.`;

  // Color coding based on percentage
  const getColorClasses = () => {
    if (percentage >= 90) return 'from-red-500 to-orange-500';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-[var(--mint-accent-1)]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      tabIndex={0}
      className="group relative flex items-center gap-1.5 rounded-lg border border-[var(--mint-accent-2)] bg-[var(--mint-surface)] px-2 py-1.5 backdrop-blur-sm focus-visible:outline-none sm:gap-3 sm:px-4 sm:py-2"
    >
      {/* Icon */}
      <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${getTextColor()}`} />

      {/* Usage Text */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm text-[var(--mint-text-secondary)]">
          {explorationsLimit === null ? (
            <>
              <span className="font-semibold text-[var(--mint-accent-1)]">{explorationsUsed}</span>
              <span className="text-[var(--mint-text-secondary)] hidden sm:inline"> explorations</span>
            </>
          ) : (
            <>
              <span className={`font-semibold ${getTextColor()}`}>{explorationsUsed}</span>
              <span className="text-[var(--mint-text-secondary)]">/{explorationsLimit}</span>
            </>
          )}
        </span>

        {/* Progress Bar (only for limited plans) */}
        {explorationsLimit !== null && (
          <div className="w-10 sm:w-16 h-1.5 bg-[var(--mint-elevated)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getColorClasses()}`}
            />
          </div>
        )}

        {/* Unlimited Badge */}
        {explorationsLimit === null && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] border border-[var(--mint-accent-2)] rounded-full">
            <TrendingUp className="w-3 h-3 text-[var(--mint-accent-1)]" />
            <span className="text-xs font-semibold text-[var(--mint-accent-1)]">Unlimited</span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] z-30 w-max -translate-x-1/2 rounded-md border border-[var(--mint-elevated)] bg-[rgba(5,13,11,0.95)] px-2.5 py-1 text-[11px] text-[var(--mint-text-secondary)] opacity-0 shadow-[0_8px_20px_rgba(2,6,18,0.45)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {remainingLabel}
      </div>
    </motion.div>
  );
};
