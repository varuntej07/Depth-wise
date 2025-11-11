'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/user/usage');
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

    fetchUsage();
  }, [session]);

  if (!session?.user || loading || !usage) {
    return null;
  }

  const { explorationsUsed, explorationsLimit, percentage } = usage;

  // Color coding based on percentage
  const getColorClasses = () => {
    if (percentage >= 90) return 'from-red-500 to-orange-500';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-cyan-500 to-blue-500';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg"
    >
      {/* Icon */}
      <Zap className={`w-4 h-4 ${getTextColor()}`} />

      {/* Usage Text */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">
          {explorationsLimit === null ? (
            <>
              <span className="font-semibold text-violet-400">{explorationsUsed}</span>
              <span className="text-slate-400"> explorations</span>
            </>
          ) : (
            <>
              <span className={`font-semibold ${getTextColor()}`}>{explorationsUsed}</span>
              <span className="text-slate-400"> / {explorationsLimit}</span>
            </>
          )}
        </span>

        {/* Progress Bar (only for limited plans) */}
        {explorationsLimit !== null && (
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-full">
            <TrendingUp className="w-3 h-3 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400">Unlimited</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
