import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe } from '@/lib/usage-tracking';

// Simple in-memory rate limiter: max 10 errors per client per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientKey);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientKey, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (entry.count >= 10) {
    return true;
  }

  entry.count++;
  return false;
}

// Periodically clean up stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 120_000);

export async function POST(request: NextRequest) {
  try {
    const requestContext = getRequestContext(request);
    const clientKey = requestContext.ipHash || requestContext.clientId || 'unknown';

    if (isRateLimited(clientKey)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const { errorMessage, errorCode, route, sessionId, metadata } = body;

    if (typeof errorMessage !== 'string' || errorMessage.length > 2000) {
      return NextResponse.json({ error: 'Invalid error message' }, { status: 400 });
    }

    recordUsageEventSafe(
      prisma,
      {
        eventName: 'client_error',
        graphSessionId: typeof sessionId === 'string' ? sessionId : undefined,
        route: 'POST /api/track/error',
        success: true,
        statusCode: 200,
        metadata: {
          errorMessage: errorMessage.slice(0, 500),
          errorCode: typeof errorCode === 'string' ? errorCode.slice(0, 100) : null,
          componentRoute: typeof route === 'string' ? route.slice(0, 200) : null,
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        },
      },
      requestContext
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.warn('error_track_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
