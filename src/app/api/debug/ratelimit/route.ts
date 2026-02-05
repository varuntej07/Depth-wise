import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { auth } from '@/lib/auth';

/**
 * Debug endpoint to check current rate limit status
 * GET /api/debug/ratelimit
 *
 * Returns the current rate limit state for the authenticated user
 * This helps debug why 429 errors might be occurring
 */
export async function GET(request: NextRequest) {
  // Only allow in development or for authenticated users
  const session = await auth();

  if (!session?.user?.email && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (!isRedisConfigured) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Redis/Upstash is not configured. Rate limiting is disabled (fail-open).',
      env: {
        hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      }
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Get client ID from query params or localStorage
  const clientId = request.nextUrl.searchParams.get('clientId');
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userEmail = session?.user?.email;
  const isAuthenticated = !!userEmail;

  // Determine identifiers for each type
  const sessionCreateIdentifier = isAuthenticated
    ? userEmail
    : clientId
      ? `client:${clientId}`
      : `ip:${ipAddress}`;

  const exploreIdentifier = sessionCreateIdentifier;

  // Define rate limit configs (must match ratelimit.ts)
  const RATE_LIMITS = {
    'session-create': {
      anonymous: 20,
      authenticated: 100,
    },
    explore: {
      anonymous: 20,
      authenticated: 200,
    },
  };

  // Create rate limiters to check status (without incrementing)
  const sessionCreateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      isAuthenticated ? RATE_LIMITS['session-create'].authenticated : RATE_LIMITS['session-create'].anonymous,
      '1 h'
    ),
    prefix: isAuthenticated ? '@ratelimit/session-create-auth' : '@ratelimit/session-create-anon',
  });

  const exploreLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      isAuthenticated ? RATE_LIMITS.explore.authenticated : RATE_LIMITS.explore.anonymous,
      '1 h'
    ),
    prefix: isAuthenticated ? '@ratelimit/explore-auth' : '@ratelimit/explore-anon',
  });

  try {
    // Get remaining limits without consuming
    const [sessionCreateRemaining, exploreRemaining] = await Promise.all([
      sessionCreateLimiter.getRemaining(sessionCreateIdentifier),
      exploreLimiter.getRemaining(exploreIdentifier),
    ]);

    // Cast to number (getRemaining returns number)
    const sessionCreateStatus = Number(sessionCreateRemaining);
    const exploreStatus = Number(exploreRemaining);

    const sessionLimit = isAuthenticated
      ? RATE_LIMITS['session-create'].authenticated
      : RATE_LIMITS['session-create'].anonymous;
    const exploreLimit = isAuthenticated
      ? RATE_LIMITS.explore.authenticated
      : RATE_LIMITS.explore.anonymous;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      user: {
        isAuthenticated,
        email: userEmail ? `${userEmail.slice(0, 3)}...${userEmail.slice(-10)}` : null,
        identifierType: isAuthenticated ? 'email' : (clientId ? 'clientId' : 'ip'),
      },
      rateLimits: {
        sessionCreate: {
          limit: sessionLimit,
          remaining: sessionCreateStatus,
          used: sessionLimit - sessionCreateStatus,
          identifier: sessionCreateIdentifier.slice(0, 15) + '...',
        },
        explore: {
          limit: exploreLimit,
          remaining: exploreStatus,
          used: exploreLimit - exploreStatus,
          identifier: exploreIdentifier.slice(0, 15) + '...',
        },
      },
      note: 'Rate limits reset on a rolling 1-hour window. "remaining" shows requests left until limit is hit.',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check rate limit status',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * Reset rate limit for testing (only in development)
 * POST /api/debug/ratelimit
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Rate limit reset is only available in development mode' },
      { status: 403 }
    );
  }

  const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (!isRedisConfigured) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Redis/Upstash is not configured.',
    });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const session = await auth();
  const body = await request.json().catch(() => ({}));
  const { identifier, prefix } = body;

  if (!identifier || !prefix) {
    return NextResponse.json({
      error: 'identifier and prefix are required',
      example: {
        identifier: 'user@example.com',
        prefix: '@ratelimit/session-create-auth',
      }
    }, { status: 400 });
  }

  try {
    // Delete all keys matching the pattern for this identifier
    // Upstash ratelimit uses keys like: {prefix}:{identifier}:{timestamp}
    const pattern = `${prefix}:${identifier}*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json({
      status: 'ok',
      message: `Reset rate limit for ${identifier}`,
      keysDeleted: keys.length,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to reset rate limit',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
