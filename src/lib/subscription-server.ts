import { SubscriptionTier } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getUsageLimit } from '@/lib/subscription-config';

const USAGE_RESET_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Server-only Razorpay plan ID mapping
export const RAZORPAY_PLAN_IDS: Record<Exclude<SubscriptionTier, 'FREE'>, string> = {
  STARTER: process.env.RAZORPAY_PLAN_STARTER || '',
  PRO: process.env.RAZORPAY_PLAN_PRO || '',
};

export function isUsageResetDue(lastResetAt: Date, now = new Date()): boolean {
  return now.getTime() - lastResetAt.getTime() >= USAGE_RESET_WINDOW_MS;
}

export function getNextUsageResetAt(lastResetAt: Date): Date {
  return new Date(lastResetAt.getTime() + USAGE_RESET_WINDOW_MS);
}

export function normalizeUsageResetAt(storedResetAt: Date, now = new Date()): Date {
  if (storedResetAt.getTime() > now.getTime()) {
    return new Date(storedResetAt.getTime() - USAGE_RESET_WINDOW_MS);
  }

  return storedResetAt;
}

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
  const storedResetAt = new Date(user.explorationsReset);
  const lastResetAt = normalizeUsageResetAt(storedResetAt, now);

  if (lastResetAt.getTime() !== storedResetAt.getTime()) {
    await prisma.user.update({
      where: { id: userId },
      data: { explorationsReset: lastResetAt },
    });
  }

  // Reset counter if 30 days have passed since the last cycle start.
  if (isUsageResetDue(lastResetAt, now)) {
    await prisma.user.update({
      where: { id: userId },
      data: { explorationsUsed: 1, explorationsReset: now },
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
