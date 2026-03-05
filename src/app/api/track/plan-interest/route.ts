import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, planName } = body;

    const validEvents = ['plan_interest_shown', 'plan_interest_dismissed', 'plan_interest_explore_instead'];
    if (!validEvents.includes(eventName)) {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 });
    }

    if (typeof planName !== 'string' || planName.length > 100) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
    }

    const requestContext = getRequestContext(request);

    recordUsageEventSafe(
      prisma,
      {
        eventName,
        route: 'POST /api/track/plan-interest',
        success: true,
        statusCode: 200,
        metadata: { planName },
      },
      requestContext
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.warn('plan_interest_track_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
