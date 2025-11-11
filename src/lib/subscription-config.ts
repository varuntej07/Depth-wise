import { SubscriptionTier } from '@prisma/client';
import {
  Sparkles,
  Rocket,
  Crown,
  Zap,
  Users,
  Download,
  Lock,
  Share2,
  FileText,
  Code2,
  HeadphonesIcon,
  type LucideIcon
} from 'lucide-react';

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  included: boolean;
  comingSoon?: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  priceId?: string; // Stripe price ID
  icon: LucideIcon;
  iconColor: string;
  badgeColor: string;
  popular?: boolean;
  explorationsPerMonth: number | 'unlimited';
  maxDepth: number;
  savedGraphs: number | 'unlimited';
  features: SubscriptionFeature[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    description: 'Perfect for trying out knowledge graphs',
    price: 0,
    icon: Sparkles,
    iconColor: 'text-slate-400',
    badgeColor: 'from-slate-500 to-slate-600',
    explorationsPerMonth: 10,
    maxDepth: 5,
    savedGraphs: 3,
    features: [
      {
        id: 'explorations-free',
        name: '10 explorations/month',
        description: 'Create up to 10 knowledge graphs per month',
        icon: Zap,
        included: true,
      },
      {
        id: 'depth-free',
        name: '5 levels deep',
        description: 'Explore up to 5 levels of depth',
        icon: FileText,
        included: true,
      },
      {
        id: 'saved-free',
        name: '3 saved graphs',
        description: 'Save and revisit your favorite explorations',
        icon: Download,
        included: true,
      },
      {
        id: 'share-public',
        name: 'Public sharing',
        description: 'Share graphs with a public link',
        icon: Share2,
        included: true,
      },
      {
        id: 'export-png',
        name: 'PNG exports',
        description: 'Download graphs as images',
        icon: Download,
        included: true,
      },
      {
        id: 'support-standard',
        name: 'Standard support',
        description: '48-hour response time',
        icon: HeadphonesIcon,
        included: true,
      },
    ],
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Pro',
    description: 'For serious learners and researchers',
    price: 9.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    icon: Rocket,
    iconColor: 'text-cyan-500',
    badgeColor: 'from-cyan-500 to-blue-500',
    popular: true,
    explorationsPerMonth: 100,
    maxDepth: 10,
    savedGraphs: 'unlimited',
    features: [
      {
        id: 'explorations-starter',
        name: '100 explorations/month',
        description: 'Create up to 100 knowledge graphs per month',
        icon: Zap,
        included: true,
      },
      {
        id: 'depth-starter',
        name: '10 levels deep',
        description: 'Explore up to 10 levels of depth',
        icon: FileText,
        included: true,
      },
      {
        id: 'saved-starter',
        name: 'Unlimited saved graphs',
        description: 'Save as many graphs as you want',
        icon: Download,
        included: true,
      },
      {
        id: 'share-private',
        name: 'Private sharing',
        description: 'Password-protected links',
        icon: Lock,
        included: true,
      },
      {
        id: 'export-all',
        name: 'PDF + PNG exports',
        description: 'Professional export formats',
        icon: Download,
        included: true,
      },
      {
        id: 'memory-extended',
        name: 'Extended context',
        description: '256K token memory for deeper graphs',
        icon: FileText,
        included: true,
      },
      {
        id: 'support-priority',
        name: 'Priority support',
        description: '24-hour response time',
        icon: HeadphonesIcon,
        included: true,
      },
    ],
  },
  PRO: {
    tier: 'PRO',
    name: 'Enterprise',
    description: 'For power users and teams',
    price: 29.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    icon: Crown,
    iconColor: 'text-violet-500',
    badgeColor: 'from-violet-500 to-pink-500',
    explorationsPerMonth: 'unlimited',
    maxDepth: 15,
    savedGraphs: 'unlimited',
    features: [
      {
        id: 'explorations-pro',
        name: 'Unlimited explorations',
        description: 'No monthly limits',
        icon: Zap,
        included: true,
      },
      {
        id: 'depth-pro',
        name: '15 levels deep',
        description: 'Maximum exploration depth',
        icon: FileText,
        included: true,
      },
      {
        id: 'saved-pro',
        name: 'Unlimited saved graphs',
        description: 'Save as many graphs as you want',
        icon: Download,
        included: true,
      },
      {
        id: 'team-collab',
        name: 'Team collaboration',
        description: 'Unlimited team members',
        icon: Users,
        included: true,
      },
      {
        id: 'export-all',
        name: 'PDF + PNG exports',
        description: 'Professional export formats',
        icon: Download,
        included: true,
      },
      {
        id: 'api-access',
        name: 'API access',
        description: 'Programmatic graph generation',
        icon: Code2,
        included: true,
        comingSoon: true,
      },
      {
        id: 'support-24-7',
        name: '24/7 priority support',
        description: 'Instant response time',
        icon: HeadphonesIcon,
        included: true,
      },
      {
        id: 'branding',
        name: 'Custom branding',
        description: 'White-label exports and custom themes',
        icon: Crown,
        included: true,
        comingSoon: true,
      },
    ],
  },
};

export function getUsageLimit(tier: SubscriptionTier): number | null {
  const plan = SUBSCRIPTION_PLANS[tier];
  return plan.explorationsPerMonth === 'unlimited' ? null : plan.explorationsPerMonth;
}

export function getMaxDepth(tier: SubscriptionTier): number {
  return SUBSCRIPTION_PLANS[tier].maxDepth;
}

export function getSavedGraphsLimit(tier: SubscriptionTier): number | null {
  const plan = SUBSCRIPTION_PLANS[tier];
  return plan.savedGraphs === 'unlimited' ? null : plan.savedGraphs;
}

export function canUserExplore(user: {
  subscriptionTier: SubscriptionTier;
  explorationsUsed: number;
  explorationsReset: Date;
}): { allowed: boolean; reason?: string } {
  // Check if usage should be reset
  const now = new Date();
  const resetDate = new Date(user.explorationsReset);
  const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

  // If more than 30 days, usage should be reset (handle in API)
  if (daysSinceReset >= 30) {
    return { allowed: true };
  }

  const limit = getUsageLimit(user.subscriptionTier);

  // Unlimited for PRO
  if (limit === null) {
    return { allowed: true };
  }

  if (user.explorationsUsed >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit} explorations. Upgrade to explore more!`
    };
  }

  return { allowed: true };
}
