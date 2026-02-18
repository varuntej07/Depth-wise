import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUsageLimit, getMaxDepth, getSavedGraphsLimit } from '@/lib/subscription-config';
import { logger } from '@/lib/logger';
import { touchUserLastSeenSafe } from '@/lib/usage-tracking';

interface UsageUserRecord {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  subscriptionTier: 'FREE' | 'STARTER' | 'PRO';
  explorationsUsed: number;
  explorationsReset: Date;
  explorationsTotal: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokensUsed: number;
  totalEstimatedCostUsd: unknown;
}

export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    logger.apiStart('GET /api/user/usage', { requestId });

    // Get authenticated user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query full user row so newly added columns are available without changing behavior.
    const user = (await prisma.user.findUnique({
      where: { email: session.user.email },
    })) as unknown as UsageUserRecord | null;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await touchUserLastSeenSafe(prisma, user.id, { route: 'GET /api/user/usage', requestId });

    // Check if usage should be reset (30+ days since last reset)
    const now = new Date();
    const resetDate = new Date(user.explorationsReset);
    const daysSinceReset = Math.floor(
      (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let explorationsUsed = user.explorationsUsed;
    let explorationsReset = user.explorationsReset;

    // Reset usage if 30+ days have passed
    if (daysSinceReset >= 30) {
      const newResetDate = new Date(now);
      newResetDate.setDate(newResetDate.getDate() + 30);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          explorationsUsed: 0,
          explorationsReset: newResetDate,
        },
      });

      explorationsUsed = 0;
      explorationsReset = newResetDate;
    }

    // Get tier limits
    const explorationsLimit = getUsageLimit(user.subscriptionTier);
    const maxDepth = getMaxDepth(user.subscriptionTier);
    const savedGraphsLimit = getSavedGraphsLimit(user.subscriptionTier);
    const savedGraphsCount = await prisma.graphSession.count({
      where: { userId: user.id },
    });

    // Calculate percentage (for limited plans)
    const percentage =
      explorationsLimit !== null
        ? Math.min(100, Math.round((explorationsUsed / explorationsLimit) * 100))
        : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dateRegistered: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        lastSeenAt: user.lastSeenAt?.toISOString() || null,
      },
      explorationsUsed,
      explorationsLimit,
      tier: user.subscriptionTier,
      percentage,
      explorationsReset: explorationsReset.toISOString(),
      explorationsTotal: user.explorationsTotal,
      savedGraphsCount,
      savedGraphsLimit,
      maxDepth,
      totalInputTokens: user.totalInputTokens,
      totalOutputTokens: user.totalOutputTokens,
      totalTokensUsed: user.totalTokensUsed,
      totalEstimatedCostUsd: Number(user.totalEstimatedCostUsd),
    });
  } catch (error) {
    logger.apiError('GET /api/user/usage', error, { requestId });
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  } finally {
    logger.info('api.complete:GET /api/user/usage', { requestId });
  }
}
