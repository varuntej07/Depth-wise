'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  Calendar,
  Crown,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { SubscriptionTier } from '@prisma/client';

interface UsageData {
  explorationsUsed: number;
  explorationsLimit: number | null;
  tier: SubscriptionTier;
  percentage: number;
  explorationsReset: string;
  savedGraphsCount: number;
  savedGraphsLimit: number | null;
  maxDepth: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  if (!session?.user || !usage) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[usage.tier];
  const PlanIcon = plan.icon;
  const resetDate = new Date(usage.explorationsReset);
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-400 hover:text-cyan-300 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <Link
            href="/pricing"
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-lg hover:shadow-cyan-500/50 rounded-lg text-white font-medium transition-all cursor-pointer hover:scale-105"
          >
            Upgrade Plan
          </Link>
        </div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Welcome back, {session.user.name?.split(' ')[0] || 'Explorer'}!
          </p>
        </motion.div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative p-6 rounded-3xl border-2 ${
            usage.tier === 'FREE'
              ? 'bg-slate-800/50 border-slate-700/50'
              : 'bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/50'
          } mb-8 overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${plan.iconColor} bg-opacity-10`}>
                <PlanIcon className={`w-8 h-8 ${plan.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Current Plan</p>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  {plan.name}
                  {usage.tier !== 'FREE' && <Crown className="w-6 h-6 text-violet-400" />}
                </h2>
                <p className="text-slate-400 mt-1">{plan.description}</p>
              </div>
            </div>
            {usage.tier === 'FREE' && (
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 rounded-xl text-white font-medium transition-all cursor-pointer hover:scale-105"
              >
                Upgrade Now
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Explorations Used */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-cyan-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-sm text-slate-400 mb-1">Explorations Used</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{usage.explorationsUsed}</p>
              {usage.explorationsLimit !== null && (
                <p className="text-lg text-slate-400">/ {usage.explorationsLimit}</p>
              )}
            </div>
            {usage.explorationsLimit !== null && (
              <div className="mt-3 w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usage.percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${
                    usage.percentage >= 90
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : usage.percentage >= 70
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                />
              </div>
            )}
            {usage.explorationsLimit === null && (
              <div className="flex items-center gap-1 mt-2 text-violet-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">Unlimited</span>
              </div>
            )}
          </motion.div>

          {/* Reset Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50"
          >
            <Calendar className="w-6 h-6 text-blue-400 mb-4" />
            <p className="text-sm text-slate-400 mb-1">Usage Resets In</p>
            <p className="text-3xl font-bold text-white">{daysUntilReset}</p>
            <p className="text-sm text-slate-400 mt-1">days</p>
          </motion.div>

          {/* Saved Graphs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50"
          >
            <BarChart3 className="w-6 h-6 text-violet-400 mb-4" />
            <p className="text-sm text-slate-400 mb-1">Saved Graphs</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">{usage.savedGraphsCount}</p>
              {usage.savedGraphsLimit !== null && (
                <p className="text-lg text-slate-400">/ {usage.savedGraphsLimit}</p>
              )}
            </div>
            {usage.savedGraphsLimit === null && (
              <p className="text-sm text-violet-400 mt-1">Unlimited</p>
            )}
          </motion.div>

          {/* Max Depth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50"
          >
            <Layers className="w-6 h-6 text-pink-400 mb-4" />
            <p className="text-sm text-slate-400 mb-1">Max Depth</p>
            <p className="text-3xl font-bold text-white">{usage.maxDepth}</p>
            <p className="text-sm text-slate-400 mt-1">levels</p>
          </motion.div>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50"
        >
          <h3 className="text-xl font-bold text-white mb-4">Your Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {plan.features.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={feature.id} className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <FeatureIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {feature.name}
                      {feature.comingSoon && (
                        <span className="ml-2 text-xs text-violet-400">(Coming Soon)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
