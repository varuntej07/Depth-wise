import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Upstash Redis client (only if configured)
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit configurations - centralized for consistency
const RATE_LIMITS = {
  'session-create': {
    anonymous: 20,      // 20 sessions per hour for anonymous users
    authenticated: 100, // 100 sessions per hour for authenticated users
  },
  explore: {
    anonymous: 20,      // 20 explorations per hour for anonymous users
    authenticated: 200, // 200 explorations per hour for authenticated users
  },
} as const;

// Rate limiters for session creation (only if Redis is available)
// IMPORTANT: ephemeralCache disabled to prevent false positives from stale in-memory cache
// The default ephemeralCache can incorrectly block users across warm serverless instances
const sessionCreateAnonymous = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS['session-create'].anonymous, '1 h'),
      analytics: true,
      prefix: '@ratelimit/session-create-anon',
      ephemeralCache: false,
    })
  : null;

const sessionCreateAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS['session-create'].authenticated, '1 h'),
      analytics: true,
      prefix: '@ratelimit/session-create-auth',
      ephemeralCache: false,
    })
  : null;

// Rate limiters for explore (only if Redis is available)
const exploreAnonymous = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.explore.anonymous, '1 h'),
      analytics: true,
      prefix: '@ratelimit/explore-anon',
      ephemeralCache: false,
    })
  : null;

const exploreAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.explore.authenticated, '1 h'),
      analytics: true,
      prefix: '@ratelimit/explore-auth',
      ephemeralCache: false,
    })
  : null;

export type RateLimitType = 'session-create' | 'explore';

export async function rateLimit(
  request: NextRequest,
  type: RateLimitType,
  userEmail?: string | null,
  clientId?: string | null
): Promise<{ success: boolean; response?: NextResponse }> {
  // Determine if user is authenticated
  const isAuthenticated = !!userEmail;

  // For anonymous users, prefer client-generated ID over IP address
  // This prevents mobile carrier CGNAT from causing shared rate limits
  // across thousands of users on the same carrier network
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const identifier = isAuthenticated
    ? userEmail!
    : clientId
      ? `client:${clientId}`
      : `ip:${ipAddress}`;

  const identifierType = isAuthenticated ? 'email' : (clientId ? 'clientId' : 'ip');

  // Select appropriate rate limiter and get the correct limit from centralized config
  let limiter: Ratelimit | null;
  const limit = isAuthenticated
    ? RATE_LIMITS[type].authenticated
    : RATE_LIMITS[type].anonymous;

  switch (type) {
    case 'session-create':
      limiter = isAuthenticated ? sessionCreateAuthenticated : sessionCreateAnonymous;
      break;
    case 'explore':
      limiter = isAuthenticated ? exploreAuthenticated : exploreAnonymous;
      break;
  }

  // If rate limiting is not configured, allow the request (fail-open)
  if (!limiter) {
    logger.warn('Rate limiting not configured - allowing request without limits', {
      type,
      identifierType,
      isAuthenticated,
    });
    return { success: true };
  }

  try {
    // Check rate limit - capture all returned values for debugging
    const { success, reset, remaining, limit: returnedLimit } = await limiter.limit(identifier);

    const resetDate = new Date(reset);
    const used = limit - remaining;

    // ALWAYS log rate limit check results for debugging (at INFO level)
    logger.info('Rate limit check', {
      type,
      identifierType,
      isAuthenticated,
      success,
      used,
      remaining,
      limit: returnedLimit || limit,
      resetAt: resetDate.toISOString(),
    });

    if (!success) {
      // Log at ERROR level when rate limit is exceeded so it shows up prominently
      logger.error('Rate limit EXCEEDED', {
        type,
        identifierType,
        isAuthenticated,
        used,
        limit: returnedLimit || limit,
        remaining,
        resetAt: resetDate.toISOString(),
        // Include truncated identifier for debugging (first 8 chars only for privacy)
        identifierPrefix: identifier.slice(0, 8) + '...',
      });

      return {
        success: false,
        response: NextResponse.json(
          {
            error: `Rate limit exceeded. You've made ${used} requests in the last hour (limit: ${limit}). Please try again at ${resetDate.toLocaleTimeString()}.`,
            code: 'RATE_LIMIT_EXCEEDED',
            limit,
            used,
            remaining,
            reset: resetDate.toISOString(),
            isAuthenticated,
            _debug: {
              identifierType,
              hadClientId: !!clientId,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    // Fail-open: if Redis is unavailable, allow the request
    // This prevents the app from being completely broken if Redis goes down
    logger.error('Rate limit check FAILED - allowing request (fail-open)', {
      type,
      identifierType,
      isAuthenticated,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join(' | ') : undefined,
    });
    return { success: true };
  }
}
