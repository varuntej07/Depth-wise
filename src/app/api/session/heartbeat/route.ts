import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidUUID } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, durationSec, isAnonymous } = body;

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const duration = Number(durationSec);
    if (!Number.isFinite(duration) || duration < 0 || duration > 3600) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const requestContext = getRequestContext(request);

    if (isAnonymous) {
      await prisma.anonymousSession.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() },
      }).catch(() => {});
    } else {
      await prisma.graphSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }).catch(() => {});
    }

    recordUsageEventSafe(
      prisma,
      {
        eventName: 'session_heartbeat',
        graphSessionId: isAnonymous ? undefined : sessionId,
        anonymousSessionId: isAnonymous ? sessionId : undefined,
        route: 'POST /api/session/heartbeat',
        success: true,
        statusCode: 200,
        metadata: { durationSec: duration },
      },
      requestContext
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.warn('heartbeat_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}
