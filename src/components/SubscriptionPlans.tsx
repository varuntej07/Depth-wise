'use client';

import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPlans() {
  const router = useRouter();
  const plans = Object.values(SUBSCRIPTION_PLANS);

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
                    className={`w-full py-3 px-6 rounded-full font-medium transition-all cursor-pointer ${
                      plan.price === 0
                        ? 'bg-[var(--mint-elevated)] text-[var(--mint-text-secondary)] hover:bg-[rgba(32,52,45,0.55)] cursor-default'
                        : isPopular
                        ? 'bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] text-white hover:shadow-lg hover:shadow-[0_0_24px_var(--mint-accent-glow)] hover:scale-105'
                        : 'bg-gradient-to-r from-[var(--mint-accent-1)] to-[var(--mint-accent-3)] text-white hover:shadow-lg hover:shadow-[0_0_24px_var(--mint-accent-glow)] hover:scale-105'
                    }`}
                    onClick={() => {
                      if (plan.price === 0) {
                        // Already on free plan
                        router.push('/account');
                        return;
                      }
                      // TODO: Integrate Stripe checkout
                      // For now, show coming soon message
                      alert('Stripe integration coming soon! This will redirect you to secure checkout.');
                    }}
                  >
                    {plan.price === 0 ? 'Current Plan' : `Upgrade to ${plan.name}`}
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
