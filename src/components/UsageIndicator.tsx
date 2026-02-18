'use client';

import React, { useEffect, useState } from 'react';
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

  const fetchUsage = async () => {
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
  };

  useEffect(() => {
    fetchUsage();
  }, [session]);

  // Listen for usage refresh events
  useEffect(() => {
    const handleRefreshUsage = () => {
      fetchUsage();
    };

    window.addEventListener('refresh-usage', handleRefreshUsage);
    return () => window.removeEventListener('refresh-usage', handleRefreshUsage);
  }, [session]);

  if (!session?.user || loading || !usage) {
    return null;
  }

  const { explorationsUsed, explorationsLimit, percentage } = usage;

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
      className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-[var(--mint-surface)] backdrop-blur-sm border border-[var(--mint-accent-2)] rounded-lg"
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
    </motion.div>
  );
};
