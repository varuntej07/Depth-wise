'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function SubscriptionPlans() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleSubscribe = async (tier: string, planName: string) => {
    if (!session?.user?.email) {
      router.push('/explore');
      return;
    }

    setLoadingTier(tier);

    try {
      // Step 1: Create subscription on backend
      const response = await fetch('/api/razorpay/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create subscription');
      }

      const { subscriptionId } = await response.json();

      // Step 2: Open Razorpay checkout popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: 'Depthwise',
        description: `${planName} - Monthly Subscription`,
        currency: 'USD',
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (verifyResponse.ok) {
              router.push('/dashboard');
            } else {
              console.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
          }
        },
        prefill: {
          email: session.user.email,
        },
        theme: {
          color: '#06b6d4',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--mint-page)] via-[var(--mint-surface)] to-[var(--mint-page)] text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--mint-accent-1)] via-[var(--mint-accent-2)] to-[var(--mint-accent-3)] bg-clip-text text-transparent"
          >
            Knowledge Graph Explorer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--mint-text-secondary)] text-lg mb-2"
          >
            Choose the plan that fits your exploration needs
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--mint-text-secondary)] text-base"
          >
            Unlock deeper insights with our intelligent knowledge graphs
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const isLoading = loadingTier === plan.tier;

            return (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-[var(--mint-elevated)] backdrop-blur rounded-3xl p-8 border ${
                  isPopular ? 'border-2 border-[var(--mint-accent-2)] shadow-xl shadow-[0_0_24px_var(--mint-accent-glow)]' : 'border border-[var(--mint-elevated)]'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] text-white text-xs font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${plan.iconColor} bg-opacity-10`}>
                      <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                    </div>
                  </div>

                  <p className="text-[var(--mint-text-secondary)] text-sm mb-2">{plan.description}</p>
                  <h2 className="text-4xl font-bold mb-1">{plan.name}</h2>

                  <div className="flex items-baseline gap-1 mb-6">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-[var(--mint-text-secondary)] text-lg">/month</span>
                      </>
                    )}
                  </div>

                  <button
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-full font-medium transition-all cursor-pointer ${
                      plan.price === 0
                        ? 'bg-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:bg-[rgba(32,52,45,0.55)] cursor-default'
                        : isPopular
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105'
                        : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105'
                    } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    onClick={() => {
                      if (plan.price === 0) {
                        router.push('/dashboard');
                        return;
                      }
                      handleSubscribe(plan.tier, plan.name);
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      plan.price === 0 ? 'Current Plan' : `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  {plan.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={feature.id} className="flex items-start gap-3">
                        <FeatureIcon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            feature.included ? 'text-[var(--mint-accent-1)]' : 'text-[var(--mint-text-secondary)]'
                          }`}
                        />
                        <div className="flex-1">
                          <span className={feature.included ? 'text-slate-200' : 'text-[var(--mint-text-secondary)]'}>
                            {feature.name}
                          </span>
                          {feature.comingSoon && (
                            <span className="ml-2 text-xs text-[var(--mint-accent-1)] font-semibold">(Soon)</span>
                          )}
                        </div>
                        {feature.included && (
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
