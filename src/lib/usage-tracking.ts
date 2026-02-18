import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { RequestContext } from '@/lib/request-context';

type DbClient = PrismaClient | Prisma.TransactionClient;

interface UsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}

interface UsageEventInput extends UsageMetrics {
  eventName: string;
  userId?: string | null;
  graphSessionId?: string | null;
  anonymousSessionId?: string | null;
  requestId?: string;
  clientId?: string | null;
  route?: string;
  success?: boolean;
  statusCode?: number;
  latencyMs?: number;
  model?: string | null;
  totalTokens?: number;
  ipAddress?: string | null;
  ipHash?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

interface UserUsageUpdateOptions extends UsageMetrics {
  incrementExplorations?: boolean;
}

function toSafeInt(value: number | undefined): number {
  if (!Number.isFinite(value) || value == null) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function toSafeLatency(value: number | undefined): number | undefined {
  if (!Number.isFinite(value) || value == null) {
    return undefined;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

function toSafeCost(value: number | undefined): Prisma.Decimal {
  const raw = Number.isFinite(value) && value != null ? Math.max(0, value) : 0;
  return new Prisma.Decimal(raw.toFixed(6));
}

function resolveEventData(event: UsageEventInput, requestContext?: RequestContext): Record<string, unknown> {
  const inputTokens = toSafeInt(event.inputTokens);
  const outputTokens = toSafeInt(event.outputTokens);
  const totalTokens = toSafeInt(event.totalTokens ?? inputTokens + outputTokens);

  return {
    eventName: event.eventName,
    userId: event.userId ?? null,
    graphSessionId: event.graphSessionId ?? null,
    anonymousSessionId: event.anonymousSessionId ?? null,
    requestId: event.requestId,
    clientId: event.clientId ?? requestContext?.clientId ?? null,
    route: event.route,
    success: event.success,
    statusCode: event.statusCode,
    latencyMs: toSafeLatency(event.latencyMs),
    model: event.model ?? null,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: toSafeCost(event.estimatedCostUsd),
    ipAddress: event.ipAddress ?? requestContext?.ipAddress ?? null,
    ipHash: event.ipHash ?? requestContext?.ipHash ?? null,
    country: event.country ?? requestContext?.country ?? null,
    region: event.region ?? requestContext?.region ?? null,
    city: event.city ?? requestContext?.city ?? null,
    userAgent: event.userAgent ?? requestContext?.userAgent ?? null,
    metadata: event.metadata === null ? Prisma.JsonNull : event.metadata,
  };
}

export function buildUserUsageUpdate(options: UserUsageUpdateOptions): Record<string, unknown> {
  const inputTokens = toSafeInt(options.inputTokens);
  const outputTokens = toSafeInt(options.outputTokens);

  const update: Record<string, unknown> = {
    lastSeenAt: new Date(),
    totalInputTokens: { increment: inputTokens },
    totalOutputTokens: { increment: outputTokens },
    totalTokensUsed: { increment: inputTokens + outputTokens },
    totalEstimatedCostUsd: { increment: toSafeCost(options.estimatedCostUsd) },
  };

  if (options.incrementExplorations) {
    update.explorationsUsed = { increment: 1 };
    update.explorationsTotal = { increment: 1 };
  }

  return update;
}

export async function recordUsageEvent(
  db: DbClient,
  event: UsageEventInput,
  requestContext?: RequestContext
): Promise<void> {
  const data = resolveEventData(event, requestContext);
  const usageEventDelegate = (db as unknown as {
    usageEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    };
  }).usageEvent;
  await usageEventDelegate.create({ data });
}

export async function recordUsageEventSafe(
  db: DbClient,
  event: UsageEventInput,
  requestContext?: RequestContext
): Promise<void> {
  try {
    // Telemetry write failures must not impact product flows.
    await recordUsageEvent(db, event, requestContext);
  } catch (error) {
    logger.warn('usage_event_write_failed', {
      eventName: event.eventName,
      requestId: event.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function touchUserLastSeenSafe(db: DbClient, userId: string, context?: { route?: string; requestId?: string }) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() } as unknown as Record<string, unknown>,
    });
  } catch (error) {
    logger.warn('user_last_seen_update_failed', {
      route: context?.route,
      requestId: context?.requestId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
