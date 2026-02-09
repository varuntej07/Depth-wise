import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    databaseUrlConfigured: !!process.env.DATABASE_URL,
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
  }, { status: allGood ? 200 : 500 });
}
