import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    redisConfigured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    nodeEnv: process.env.NODE_ENV,
  };

  const allGood = checks.anthropicKeyConfigured && checks.databaseUrlConfigured;

  return NextResponse.json({
    status: allGood ? 'healthy' : 'misconfigured',
    checks,
    message: !checks.anthropicKeyConfigured
      ? 'ANTHROPIC_API_KEY is not set - this is why your requests are failing!'
      : !checks.databaseUrlConfigured
      ? 'DATABASE_URL is not set'
      : 'All environment variables configured',
    rateLimiting: checks.redisConfigured
      ? 'enabled (Upstash Redis configured)'
      : 'disabled (fail-open mode - no Redis configured)',
    debugEndpoint: '/api/debug/ratelimit - Check your current rate limit status',
  }, { status: allGood ? 200 : 500 });
}
