import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import { recordUsageEventSafe } from '@/lib/usage-tracking';
import { isValidUUID, sanitizeBoolean } from '@/lib/utils';

type FeedbackValue = 'up' | 'down';

const ALLOWED_FEEDBACK_VALUES: FeedbackValue[] = ['up', 'down'];
const ALLOWED_DOWN_REASONS = new Set([
  'unclear',
  'too_shallow',
  'incorrect',
  'repetitive',
]);

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStart = logger.startTimer();

  try {
    const body = await request.json();
    const {
      sessionId,
      nodeId,
      isAnonymous,
      value,
      reason,
      nodeDepth,
      nodeTitle,
      followUpType,
      clientId,
    } = body ?? {};

    const requestContext = getRequestContext(request, clientId);
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!isValidUUID(sessionId) || !isValidUUID(nodeId)) {
      return NextResponse.json(
        { error: 'Invalid session or node identifier', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const anonymousResult = sanitizeBoolean(isAnonymous);
    if (!anonymousResult.isValid) {
      return NextResponse.json(
        { error: anonymousResult.error || 'Invalid session mode', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (typeof value !== 'string' || !ALLOWED_FEEDBACK_VALUES.includes(value as FeedbackValue)) {
      return NextResponse.json(
        { error: 'Invalid feedback value', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const normalizedReason =
      typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : null;

    if (normalizedReason && !ALLOWED_DOWN_REASONS.has(normalizedReason)) {
      return NextResponse.json(
        { error: 'Invalid feedback reason', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (value === 'up' && normalizedReason) {
      return NextResponse.json(
        { error: 'Positive feedback cannot include a reason', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const resolvedIsAnonymous = anonymousResult.value ?? false;
    const depthValue =
      typeof nodeDepth === 'number' && Number.isFinite(nodeDepth) && nodeDepth > 0
        ? Math.round(nodeDepth)
        : null;
    const safeNodeTitle =
      typeof nodeTitle === 'string' && nodeTitle.trim().length > 0
        ? nodeTitle.trim().slice(0, 180)
        : null;
    const safeFollowUpType =
      typeof followUpType === 'string' && followUpType.trim().length > 0
        ? followUpType.trim().slice(0, 40)
        : null;

    if (resolvedIsAnonymous) {
      const node = await prisma.anonymousNode.findFirst({
        where: {
          id: nodeId,
          sessionId,
        },
        select: { id: true },
      });

      if (!node) {
        return NextResponse.json(
          { error: 'Node not found for this anonymous session', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    } else {
      const node = await prisma.node.findFirst({
        where: {
          id: nodeId,
          sessionId,
        },
        select: { id: true },
      });

      if (!node) {
        return NextResponse.json(
          { error: 'Node not found for this session', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'node_feedback_submitted',
        userId,
        graphSessionId: resolvedIsAnonymous ? null : sessionId,
        anonymousSessionId: resolvedIsAnonymous ? sessionId : null,
        requestId,
        clientId: requestContext.clientId,
        route: 'POST /api/feedback',
        success: true,
        statusCode: 200,
        latencyMs: logger.durationMs(requestStart),
        metadata: {
          nodeId,
          value,
          reason: normalizedReason,
          nodeDepth: depthValue,
          nodeTitle: safeNodeTitle,
          followUpType: safeFollowUpType,
        },
      },
      requestContext
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.apiError('POST /api/feedback', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to submit feedback', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  } finally {
    logger.info('api.complete:POST /api/feedback', {
      requestId,
      durationMs: logger.durationMs(requestStart),
    });
  }
}
