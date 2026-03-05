'use client';

import React from 'react';
import { X, Sparkles, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { SubscriptionTier } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  currentTier?: SubscriptionTier;
  suggestedTier?: SubscriptionTier;
}

/**
 * Premium Subscription Modal Component
 *
 * Modal that prompts users to upgrade when they hit limits.
 * Features:
 * - Glassmorphism design matching ShareModal
 * - Shows current limit and reason for upgrade
 * - Displays recommended plan with benefits
 * - Smooth animations and micro-interactions
 */
export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  reason,
  currentTier = 'FREE',
  suggestedTier = 'STARTER',
}) => {
  const router = useRouter();
  const currentPlan = SUBSCRIPTION_PLANS[currentTier];
  const suggestedPlan = SUBSCRIPTION_PLANS[suggestedTier];
  const SuggestedIcon = suggestedPlan.icon;

  const handleUpgrade = () => {
    // Navigate to pricing page
    router.push('/pricing');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal Container - Centered */}
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect behind modal */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] blur-2xl -z-10" />

              {/* Main Modal Card with Glassmorphism */}
              <div className="relative bg-[var(--mint-surface)] backdrop-blur-2xl border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Gradient top border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)]" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Icon with gradient background */}
                    <div className="relative p-3 bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] rounded-2xl border border-white/10">
                      <Zap className="w-6 h-6 text-[var(--mint-accent-1)]" />
                      {/* Sparkle effect */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-4 h-4 text-[var(--mint-accent-1)]" />
                      </motion.div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] bg-clip-text text-transparent">
                        Upgrade to Explore More
                      </h2>
                      <p className="text-sm text-[var(--mint-text-secondary)] mt-0.5">
                        Unlock your full potential
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--mint-text-secondary)]" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Reason Display */}
                  {reason && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl border border-red-500/30"
                    >
                      <p className="text-sm text-red-300">{reason}</p>
                    </motion.div>
                  )}

                  {/* Current vs Suggested Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Plan */}
                    <div className="p-4 bg-[var(--mint-elevated)] rounded-xl border border-[var(--mint-elevated)]">
                      <p className="text-xs text-[var(--mint-text-secondary)] mb-2">Current Plan</p>
                      <h3 className="text-lg font-bold text-white mb-1">{currentPlan.name}</h3>
                      <p className="text-sm text-[var(--mint-text-secondary)]">
                        {typeof currentPlan.explorationsPerMonth === 'number'
                          ? `${currentPlan.explorationsPerMonth} explorations/mo`
                          : 'Unlimited'}
                      </p>
                      <p className="text-xs text-[var(--mint-text-secondary)] mt-1">{currentPlan.maxDepth} levels deep</p>
                    </div>

                    {/* Suggested Plan */}
                    <div className="p-4 bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] rounded-xl border-2 border-[var(--mint-accent-2)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)]" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[var(--mint-accent-1)] font-semibold">Recommended</p>
                          <SuggestedIcon className={`w-4 h-4 ${suggestedPlan.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{suggestedPlan.name}</h3>
                        <p className="text-sm text-[var(--mint-accent-1)]">
                          {typeof suggestedPlan.explorationsPerMonth === 'number'
                            ? `${suggestedPlan.explorationsPerMonth} explorations/mo`
                            : 'Unlimited'}
                        </p>
                        <p className="text-xs text-[var(--mint-accent-1)] mt-1">{suggestedPlan.maxDepth} levels deep</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--mint-text-secondary)] flex items-center gap-2">
                      <Crown className="w-4 h-4 text-[var(--mint-accent-1)]" />
                      What you&apos;ll get with {suggestedPlan.name}:
                    </h3>
                    <div className="space-y-2">
                      {suggestedPlan.features.slice(0, 4).map((feature) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div key={feature.id} className="flex items-start gap-2">
                            <FeatureIcon className="w-4 h-4 text-[var(--mint-accent-1)] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-slate-200">{feature.name}</p>
                              <p className="text-xs text-[var(--mint-text-secondary)]">{feature.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative p-5 bg-gradient-to-br from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] rounded-xl border border-white/5"
                  >
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] bg-clip-text text-transparent">
                        ${suggestedPlan.price}
                      </span>
                      <span className="text-[var(--mint-text-secondary)]">/month</span>
                    </div>
                    <p className="text-xs text-center text-[var(--mint-text-secondary)]">
                      Cancel anytime • No hidden fees
                    </p>
                  </motion.div>
                </div>

                {/* Footer - Actions */}
                <div className="flex gap-3 px-6 py-4 bg-white/5 border-t border-white/5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-2.5 text-sm font-medium text-[var(--mint-text-secondary)] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    Maybe Later
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgrade}
                    className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] hover:shadow-lg hover:shadow-[0_0_24px_var(--mint-accent-glow)] rounded-xl transition-all cursor-pointer"
                  >
                    Upgrade Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
