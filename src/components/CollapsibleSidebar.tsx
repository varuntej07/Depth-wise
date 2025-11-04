'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  CreditCard,
  User,
  LogOut,
  Sparkles,
  BarChart3,
  HelpCircle,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Zap,
  History,
  Crown,
  Rocket,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';
import { SubscriptionTier } from '@prisma/client';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function CollapsibleSidebar({ isCollapsed, onToggleCollapse }: CollapsibleSidebarProps) {
  const { data: session } = useSession();
  const [currentTab, setCurrentTab] = useState<'subscription' | 'settings' | 'usage' | 'account' | 'help'>('subscription');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMobile, setIsMobile] = useState(false);

  // Mock user data - replace with actual API call
  const userData = {
    tier: 'FREE' as SubscriptionTier,
    explorationsUsed: 3,
    explorationsReset: new Date(),
    savedGraphs: 1,
  };

  const currentPlan = SUBSCRIPTION_PLANS[userData.tier];
  const explorationsLimit = typeof currentPlan.explorationsPerMonth === 'number'
    ? currentPlan.explorationsPerMonth
    : Infinity;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onToggleCollapse]);

  const navigationItems = [
    { id: 'history', icon: History, label: 'History' },
    { id: 'usage', icon: BarChart3, label: 'Usage & Stats' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'help', icon: HelpCircle, label: 'Help' },
  ] as const;

  const shouldShowUpgrade = userData.tier !== 'PRO';
  const explorationsPercentage = explorationsLimit !== Infinity
    ? (userData.explorationsUsed / explorationsLimit) * 100
    : 0;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleCollapse}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700 hover:border-cyan-500/50 transition-all"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay Sidebar */}
      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onToggleCollapse}
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-slate-950/98 backdrop-blur-xl border-r border-slate-800/50 z-50 flex flex-col overflow-y-auto sidebar-scroll"
            >
              {/* Mobile Sidebar Content - Same as desktop expanded */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    KnowledgeGraph
                  </span>
                </div>
                <button
                  onClick={onToggleCollapse}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id as any)}
                      className={`
                        w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group relative
                        ${isActive
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="mobileActiveTab"
                          className="absolute left-0 w-1 h-full bg-cyan-500 rounded-r-full"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Usage Quick Stats */}
              {explorationsLimit !== Infinity && (
                <div className="px-3 mb-3">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Explorations</span>
                      <span className="text-xs font-medium text-white">
                        {userData.explorationsUsed}/{explorationsLimit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${explorationsPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          explorationsPercentage > 80
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Button */}
              {shouldShowUpgrade && (
                <div className="p-3 border-t border-slate-800/50">
                  <button
                    onClick={() => setCurrentTab('subscription')}
                    className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="relative flex items-center justify-center gap-2">
                      {userData.tier === 'FREE' ? (
                        <Rocket className="w-4 h-4 text-white" />
                      ) : (
                        <Crown className="w-4 h-4 text-white" />
                      )}
                      <span className="text-sm font-semibold text-white">
                        {userData.tier === 'FREE' ? 'Upgrade to Starter' : 'Upgrade to Pro'}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* User Profile / Sign Out */}
              <div className="p-3 border-t border-slate-800/50">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {session.user?.name || session.user?.email?.split('@')[0]}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${currentPlan.badgeColor} bg-gradient-to-r`} />
                          <p className="text-xs text-slate-400">{currentPlan.name}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">Sign in to unlock features</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '64px' : '280px' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-40 flex-col"
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                KnowledgeGraph
              </span>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mx-auto">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-colors z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id as any)}
                className={`
                  w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group relative
                  ${isActive
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-full bg-cyan-500 rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Usage Quick Stats (when expanded) */}
        {!isCollapsed && explorationsLimit !== Infinity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 mb-3"
          >
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Explorations</span>
                <span className="text-xs font-medium text-white">
                  {userData.explorationsUsed}/{explorationsLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${explorationsPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    explorationsPercentage > 80
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Upgrade Button */}
        {shouldShowUpgrade && (
          <div className="p-3 border-t border-slate-800/50">
            {!isCollapsed ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setCurrentTab('subscription')}
                className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center justify-center gap-2">
                  {userData.tier === 'FREE' ? (
                    <Rocket className="w-4 h-4 text-white" />
                  ) : (
                    <Crown className="w-4 h-4 text-white" />
                  )}
                  <span className="text-sm font-semibold text-white">
                    {userData.tier === 'FREE' ? 'Upgrade to Starter' : 'Upgrade to Pro'}
                  </span>
                </div>
              </motion.button>
            ) : (
              <button
                onClick={() => setCurrentTab('subscription')}
                className="w-full p-2.5 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 transition-all flex items-center justify-center"
                title="Upgrade"
              >
                {userData.tier === 'FREE' ? (
                  <Rocket className="w-5 h-5 text-white" />
                ) : (
                  <Crown className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        )}

        {/* User Profile / Sign Out */}
        <div className="p-3 border-t border-slate-800/50">
          {session ? (
            <>
              {!isCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${currentPlan.badgeColor} bg-gradient-to-r`} />
                        <p className="text-xs text-slate-400">{currentPlan.name}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="w-full p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center">
              {!isCollapsed && (
                <p className="text-xs text-slate-500 mb-2">Sign in to unlock features</p>
              )}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Content Panel (Desktop) */}
      <AnimatePresence>
        {!isCollapsed && currentTab && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden md:block fixed left-[280px] top-0 bottom-0 w-[400px] bg-slate-950/98 backdrop-blur-xl border-r border-slate-800/50 z-30 overflow-y-auto"
          >
            <div className="p-6">
              {currentTab === 'subscription' && <SubscriptionTab userData={userData} />}
              {currentTab === 'usage' && <UsageTab userData={userData} />}
              {currentTab === 'settings' && <SettingsTab theme={theme} setTheme={setTheme} />}
              {currentTab === 'account' && <AccountTab />}
              {currentTab === 'help' && <HelpTab />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Subscription Tab Component
function SubscriptionTab({ userData }: { userData: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Your Plan</h3>
        <p className="text-sm text-slate-400">
          Choose the perfect plan for your learning journey
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">CURRENT PLAN</p>
            <h4 className="text-lg font-bold text-white">
              {SUBSCRIPTION_PLANS[userData.tier].name}
            </h4>
          </div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${SUBSCRIPTION_PLANS[userData.tier].badgeColor}`}>
            {(() => {
              const Icon = SUBSCRIPTION_PLANS[userData.tier].icon;
              return <Icon className="w-5 h-5 text-white" />;
            })()}
          </div>
        </div>
        <p className="text-sm text-slate-300">
          ${SUBSCRIPTION_PLANS[userData.tier].price}/month
        </p>
      </div>

      {/* Plan Options */}
      <div className="space-y-3">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            isCurrentPlan={plan.tier === userData.tier}
          />
        ))}
      </div>
    </div>
  );
}

// Plan Card Component
function PlanCard({ plan, isCurrentPlan }: { plan: any; isCurrentPlan: boolean }) {
  const Icon = plan.icon;

  return (
    <motion.div
      whileHover={{ scale: isCurrentPlan ? 1 : 1.02 }}
      className={`
        p-5 rounded-xl border transition-all cursor-pointer
        ${isCurrentPlan
          ? 'bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }
        ${plan.popular && !isCurrentPlan ? 'ring-2 ring-cyan-500/30' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.badgeColor}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white">{plan.name}</h4>
              {plan.popular && !isCurrentPlan && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Popular
                </span>
              )}
              {isCurrentPlan && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  Current
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">{plan.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold text-white">${plan.price}</span>
        <span className="text-slate-400">/month</span>
      </div>

      {/* Key Features */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          {plan.explorationsPerMonth === 'unlimited'
            ? 'Unlimited explorations'
            : `${plan.explorationsPerMonth} explorations/month`}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          {plan.maxDepth} levels deep
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
          {plan.savedGraphs === 'unlimited'
            ? 'Unlimited saved graphs'
            : `${plan.savedGraphs} saved graphs`}
        </div>
      </div>

      {!isCurrentPlan && (
        <button className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-medium transition-all">
          {plan.tier === 'FREE' ? 'Downgrade' : 'Upgrade'}
        </button>
      )}
    </motion.div>
  );
}

// Usage Tab Component
function UsageTab({ userData }: { userData: any }) {
  const currentPlan = SUBSCRIPTION_PLANS[userData.tier];
  const explorationsLimit = typeof currentPlan.explorationsPerMonth === 'number'
    ? currentPlan.explorationsPerMonth
    : null;

  const explorationsPercentage = explorationsLimit
    ? (userData.explorationsUsed / explorationsLimit) * 100
    : 0;

  const savedGraphsLimit = typeof currentPlan.savedGraphs === 'number'
    ? currentPlan.savedGraphs
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Usage & Stats</h3>
        <p className="text-sm text-slate-400">
          Track your monthly exploration activity
        </p>
      </div>

      {/* Explorations Progress */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">Explorations</h4>
          <span className="text-sm text-slate-400">
            {userData.explorationsUsed} / {explorationsLimit || '∞'} used
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${explorationsLimit ? explorationsPercentage : 50}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              explorationsPercentage > 80
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-cyan-500 to-violet-500'
            }`}
          />
        </div>
        {explorationsLimit && explorationsPercentage > 80 && (
          <p className="mt-2 text-xs text-orange-400">
            You're running low! Consider upgrading for more explorations.
          </p>
        )}
      </div>

      {/* Saved Graphs */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">Saved Graphs</h4>
          <span className="text-sm text-slate-400">
            {userData.savedGraphs} / {savedGraphsLimit || '∞'} saved
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: savedGraphsLimit
                ? `${(userData.savedGraphs / savedGraphsLimit) * 100}%`
                : '50%',
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
          />
        </div>
      </div>

      {/* Reset Date */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h4 className="font-semibold text-white mb-2">Next Reset</h4>
        <p className="text-sm text-slate-400">
          Your monthly limit resets on{' '}
          <span className="text-cyan-400 font-medium">
            {new Date(
              new Date(userData.explorationsReset).setMonth(
                new Date(userData.explorationsReset).getMonth() + 1
              )
            ).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </p>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ theme, setTheme }: { theme: string; setTheme: (theme: 'light' | 'dark') => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Preferences</h3>
        <p className="text-sm text-slate-400">
          Customize your experience
        </p>
      </div>

      {/* Theme Selector */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h4 className="font-semibold text-white mb-4">Theme</h4>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <Moon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Dark</p>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <Sun className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">Light</p>
            <span className="text-xs text-slate-500">(Coming soon)</span>
          </button>
        </div>
      </div>

      {/* Other Settings */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h4 className="font-semibold text-white mb-4">Display</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Show node animations</span>
            <input type="checkbox" defaultChecked className="toggle" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Auto-save graphs</span>
            <input type="checkbox" defaultChecked className="toggle" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-slate-300">Show depth indicators</span>
            <input type="checkbox" defaultChecked className="toggle" />
          </label>
        </div>
      </div>
    </div>
  );
}

// Account Tab Component
function AccountTab() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Account</h3>
        <p className="text-sm text-slate-400">
          Manage your account settings
        </p>
      </div>

      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h4 className="font-semibold text-white mb-4">Profile</h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name</label>
            <input
              type="text"
              value={session?.user?.name || ''}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-slate-900 border border-red-900/30">
        <h4 className="font-semibold text-red-400 mb-2">Danger Zone</h4>
        <p className="text-sm text-slate-400 mb-4">
          Permanently delete your account and all data
        </p>
        <button className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all">
          Delete Account
        </button>
      </div>
    </div>
  );
}

// Help Tab Component
function HelpTab() {
  const helpItems = [
    { title: 'Getting Started', description: 'Learn how to use knowledge graphs' },
    { title: 'Keyboard Shortcuts', description: 'Speed up your workflow' },
    { title: 'FAQ', description: 'Common questions answered' },
    { title: 'Contact Support', description: 'Get help from our team' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Help & Support</h3>
        <p className="text-sm text-slate-400">
          Resources to help you succeed
        </p>
      </div>

      <div className="space-y-3">
        {helpItems.map((item) => (
          <button
            key={item.title}
            className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left"
          >
            <h4 className="font-medium text-white mb-1">{item.title}</h4>
            <p className="text-sm text-slate-400">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
        <h4 className="font-semibold text-white mb-2">Need Help?</h4>
        <p className="text-sm text-slate-400 mb-4">
          Our support team is here to help you get the most out of Knowledge Graph.
        </p>
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium">
          Contact Support
        </button>
      </div>
    </div>
  );
}
