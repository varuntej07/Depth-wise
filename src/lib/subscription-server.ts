import { SubscriptionTier } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getUsageLimit } from '@/lib/subscription-config';

// Server-only Razorpay plan ID mapping
export const RAZORPAY_PLAN_IDS: Record<Exclude<SubscriptionTier, 'FREE'>, string> = {
  STARTER: process.env.RAZORPAY_PLAN_STARTER || '',
  PRO: process.env.RAZORPAY_PLAN_PRO || '',
};

/**
 * Atomically reset (if needed) and increment usage for a user.
 * Returns { allowed, remaining } — if not allowed, the increment did NOT happen.
 */
export async function resetAndCheckUsage(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, explorationsUsed: true, explorationsReset: true },
  });

  if (!user) return { allowed: false, remaining: 0 };

  const limit = getUsageLimit(user.subscriptionTier);

  // Unlimited tier
  if (limit === null) return { allowed: true, remaining: Infinity };

  const now = new Date();
  const resetDate = new Date(user.explorationsReset);
  const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

  // Reset counter if 30+ days passed
  if (daysSinceReset >= 30) {
    const newResetDate = new Date(now);
    newResetDate.setDate(newResetDate.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: { explorationsUsed: 1, explorationsReset: newResetDate },
    });

    return { allowed: true, remaining: limit - 1 };
  }

  // Atomic increment with WHERE guard to prevent race conditions
  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      explorationsUsed: { lt: limit },
    },
    data: {
      explorationsUsed: { increment: 1 },
    },
  });

  if (result.count === 0) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - user.explorationsUsed - 1 };
}
