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

// Rate limiters for session creation (only if Redis is available)
const sessionCreateAnonymous = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: '@ratelimit/session-create-anon',
    })
  : null;

const sessionCreateAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 h'),
      analytics: true,
      prefix: '@ratelimit/session-create-auth',
    })
  : null;

// Rate limiters for explore (only if Redis is available)
const exploreAnonymous = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: '@ratelimit/explore-anon',
    })
  : null;

const exploreAuthenticated = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 h'),
      analytics: true,
      prefix: '@ratelimit/explore-auth',
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

  // Select appropriate rate limiter
  let limiter: Ratelimit | null;
  let limit: number;

  switch (type) {
    case 'session-create':
      limiter = isAuthenticated ? sessionCreateAuthenticated : sessionCreateAnonymous;
      limit = isAuthenticated ? 100 : 10;
      break;
    case 'explore':
      limiter = isAuthenticated ? exploreAuthenticated : exploreAnonymous;
      limit = isAuthenticated ? 200 : 20;
      break;
  }

  // If rate limiting is not configured, allow the request (fail-open)
  if (!limiter) {
    logger.warn('Rate limiting not configured - allowing request without limits', { type, identifier });
    return { success: true };
  }

  try {
    // Check rate limit
    const { success, reset } = await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      // Log the rate limit hit with identifier for debugging
      logger.warn('Rate limit hit', {
        type,
        identifier: identifier.slice(0, 20), // Truncate for privacy
        identifierType: clientId ? 'clientId' : (isAuthenticated ? 'email' : 'ip'),
        limit,
        reset: resetDate.toISOString(),
      });

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            limit,
            reset: resetDate.toISOString(),
            isAuthenticated,
            // Include debug info (identifier type only, not the actual value for privacy)
            _debug: {
              identifierType: clientId ? 'clientId' : (isAuthenticated ? 'email' : 'ip'),
              hadClientId: !!clientId,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
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
    logger.error('Rate limit check failed, allowing request (fail-open)', {
      type,
      identifier,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: true };
  }
}
