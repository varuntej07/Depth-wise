'use client';

import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SubscriptionPlans() {
  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent"
          >
            Knowledge Graph Explorer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg mb-2"
          >
            Choose the plan that fits your exploration needs
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-base"
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
                className={`relative bg-slate-800/50 backdrop-blur rounded-3xl p-8 border ${
                  isPopular ? 'border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20' : 'border border-slate-700/50'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold shadow-lg">
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

                  <p className="text-slate-400 text-sm mb-2">{plan.description}</p>
                  <h2 className="text-4xl font-bold mb-1">{plan.name}</h2>

                  <div className="flex items-baseline gap-1 mb-6">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-slate-400 text-lg">/month</span>
                      </>
                    )}
                  </div>

                  <button
                    className={`w-full py-3 px-6 rounded-full font-medium transition-all ${
                      plan.price === 0
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : isPopular
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
                        : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-500/50'
                    }`}
                    onClick={() => {
                      if (plan.price === 0) {
                        // Already on free plan
                        return;
                      }
                      // Placeholder for Stripe checkout
                      alert('Stripe checkout will be integrated here. Please set up your Stripe account first.');
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
                            feature.included ? 'text-cyan-400' : 'text-slate-500'
                          }`}
                        />
                        <div className="flex-1">
                          <span className={feature.included ? 'text-slate-200' : 'text-slate-500'}>
                            {feature.name}
                          </span>
                          {feature.comingSoon && (
                            <span className="ml-2 text-xs text-violet-400 font-semibold">(Soon)</span>
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
