import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUsageLimit, getMaxDepth, getSavedGraphsLimit } from '@/lib/subscription-config';

export async function GET() {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user with subscription details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionTier: true,
        explorationsUsed: true,
        explorationsReset: true,
        graphSessions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    // Calculate percentage (for limited plans)
    const percentage =
      explorationsLimit !== null
        ? Math.min(100, Math.round((explorationsUsed / explorationsLimit) * 100))
        : 0;

    return NextResponse.json({
      explorationsUsed,
      explorationsLimit,
      tier: user.subscriptionTier,
      percentage,
      explorationsReset: explorationsReset.toISOString(),
      savedGraphsCount: user.graphSessions.length,
      savedGraphsLimit,
      maxDepth,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
