import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';
import {
  buildFreshSuggestions,
  getDefaultSuggestions,
  parseStoredSuggestions,
  resolveSuggestionAudience,
  sanitizeClientId,
  SUGGESTION_REFRESH_INTERVAL_MS,
  suggestionsToJson,
} from '@/lib/suggestions';
import { recordUsageEventSafe, touchUserLastSeenSafe } from '@/lib/usage-tracking';

const ROUTE = '/api/suggestions';

async function resolveUserIdBySessionEmail(email: string | null | undefined): Promise<string | null> {
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = logger.startTimer();

  try {
    logger.apiStart(`GET ${ROUTE}`, { requestId });

    const session = await auth();
    const userId = await resolveUserIdBySessionEmail(session?.user?.email);
    const clientId = sanitizeClientId(request.nextUrl.searchParams.get('clientId'));
    const audience = resolveSuggestionAudience({ userId, clientId });

    if (userId) {
      await touchUserLastSeenSafe(prisma, userId, { route: `GET ${ROUTE}`, requestId });
    }

    if (!audience) {
      return NextResponse.json({
        suggestions: getDefaultSuggestions(),
        source: 'default',
        shouldRefresh: false,
      });
    }

    const cached = await prisma.suggestionCache.findUnique({
      where: {
        audienceType_audienceKey: {
          audienceType: audience.audienceType,
          audienceKey: audience.audienceKey,
        },
      },
      select: {
        suggestions: true,
        generatedAt: true,
        nextRefreshAt: true,
      },
    });

    const now = new Date();
    const cachedSuggestions = cached ? parseStoredSuggestions(cached.suggestions) : [];
    const suggestions = cachedSuggestions.length > 0 ? cachedSuggestions : getDefaultSuggestions();
    const source = cachedSuggestions.length > 0 ? 'cache' : 'default';
    const shouldRefresh = !cached || cached.nextRefreshAt <= now;

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'suggestions_fetched',
        userId,
        requestId,
        clientId,
        route: `GET ${ROUTE}`,
        success: true,
        statusCode: 200,
        latencyMs: logger.durationMs(startedAt),
        metadata: {
          audienceType: audience.audienceType,
          source,
          shouldRefresh,
          suggestionCount: suggestions.length,
        },
      },
      getRequestContext(request, clientId)
    );

    return NextResponse.json({
      suggestions,
      source,
      shouldRefresh,
      generatedAt: cached?.generatedAt.toISOString() ?? null,
      nextRefreshAt: cached?.nextRefreshAt.toISOString() ?? null,
    });
  } catch (error) {
    logger.apiError(`GET ${ROUTE}`, error, { requestId });
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  } finally {
    logger.info(`api.complete:GET ${ROUTE}`, {
      requestId,
      durationMs: logger.durationMs(startedAt),
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const startedAt = logger.startTimer();

  try {
    logger.apiStart(`POST ${ROUTE}`, { requestId });

    const session = await auth();
    const body = (await request.json().catch(() => ({}))) as { clientId?: unknown };
    const clientId = sanitizeClientId(body.clientId);
    const requestContext = getRequestContext(request, clientId);
    const userId = await resolveUserIdBySessionEmail(session?.user?.email);
    const audience = resolveSuggestionAudience({ userId, clientId });

    if (!audience) {
      return NextResponse.json({ error: 'Missing user or client identity' }, { status: 400 });
    }

    if (userId) {
      await touchUserLastSeenSafe(prisma, userId, { route: `POST ${ROUTE}`, requestId });
    }

    const now = new Date();
    const existing = await prisma.suggestionCache.findUnique({
      where: {
        audienceType_audienceKey: {
          audienceType: audience.audienceType,
          audienceKey: audience.audienceKey,
        },
      },
      select: {
        id: true,
        nextRefreshAt: true,
      },
    });

    if (existing && existing.nextRefreshAt > now) {
      return NextResponse.json({
        skipped: true,
        reason: 'cooldown',
        nextRefreshAt: existing.nextRefreshAt.toISOString(),
      });
    }

    const refreshed = await buildFreshSuggestions(prisma, audience);
    const nextRefreshAt = new Date(Date.now() + SUGGESTION_REFRESH_INTERVAL_MS);

    await prisma.suggestionCache.upsert({
      where: {
        audienceType_audienceKey: {
          audienceType: audience.audienceType,
          audienceKey: audience.audienceKey,
        },
      },
      update: {
        userId: audience.userId,
        suggestions: suggestionsToJson(refreshed.suggestions),
        source: refreshed.source,
        model: refreshed.usage?.model ?? null,
        generatedAt: now,
        nextRefreshAt,
        lastStatus: 'ready',
      },
      create: {
        audienceType: audience.audienceType,
        audienceKey: audience.audienceKey,
        userId: audience.userId,
        suggestions: suggestionsToJson(refreshed.suggestions),
        source: refreshed.source,
        model: refreshed.usage?.model ?? null,
        generatedAt: now,
        nextRefreshAt,
        lastStatus: 'ready',
      },
    });

    await recordUsageEventSafe(
      prisma,
      {
        eventName: 'suggestions_refreshed',
        userId,
        requestId,
        clientId,
        route: `POST ${ROUTE}`,
        success: true,
        statusCode: 200,
        latencyMs: logger.durationMs(startedAt),
        model: refreshed.usage?.model ?? null,
        inputTokens: refreshed.usage?.inputTokens ?? 0,
        outputTokens: refreshed.usage?.outputTokens ?? 0,
        estimatedCostUsd: refreshed.usage?.estimatedCostUsd ?? 0,
        metadata: {
          audienceType: audience.audienceType,
          source: refreshed.source,
          suggestionCount: refreshed.suggestions.length,
          personalCount: refreshed.personalCount,
          trendingCount: refreshed.trendingCount,
        } as Prisma.InputJsonValue,
      },
      requestContext
    );

    return NextResponse.json({
      success: true,
      source: refreshed.source,
      generatedAt: now.toISOString(),
      nextRefreshAt: nextRefreshAt.toISOString(),
      suggestionCount: refreshed.suggestions.length,
    });
  } catch (error) {
    logger.apiError(`POST ${ROUTE}`, error, { requestId });
    return NextResponse.json({ error: 'Failed to refresh suggestions' }, { status: 500 });
  } finally {
    logger.info(`api.complete:POST ${ROUTE}`, {
      requestId,
      durationMs: logger.durationMs(startedAt),
    });
  }
}
