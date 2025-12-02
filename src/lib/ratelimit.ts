import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for session creation
const sessionCreateAnonymous = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: '@ratelimit/session-create-anon',
});

const sessionCreateAuthenticated = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
  prefix: '@ratelimit/session-create-auth',
});

// Rate limiters for explore
const exploreAnonymous = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: '@ratelimit/explore-anon',
});

const exploreAuthenticated = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'),
  analytics: true,
  prefix: '@ratelimit/explore-auth',
});

export type RateLimitType = 'session-create' | 'explore';

export async function rateLimit(
  request: NextRequest,
  type: RateLimitType,
  userEmail?: string | null
): Promise<{ success: boolean; response?: NextResponse }> {
  // Determine if user is authenticated
  const isAuthenticated = !!userEmail;

  // Get IP address for anonymous users
  const identifier = isAuthenticated
    ? userEmail!
    : request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

  // Select appropriate rate limiter
  let limiter: Ratelimit;
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

  // Check rate limit
  const { success, reset } = await limiter.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          limit,
          reset: resetDate.toISOString(),
          isAuthenticated,
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
}
