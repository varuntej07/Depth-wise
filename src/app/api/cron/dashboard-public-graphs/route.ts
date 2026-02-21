import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { DASHBOARD_PUBLIC_GRAPHS_TAG } from '@/lib/dashboard-public-graphs';
import { logger } from '@/lib/logger';

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : authHeader.trim();

  return token === configuredSecret;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (!isAuthorized(request)) {
    logger.warn('cron.dashboard_public_graphs.unauthorized', { requestId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    revalidateTag(DASHBOARD_PUBLIC_GRAPHS_TAG, 'max');
    logger.info('cron.dashboard_public_graphs.revalidated', { requestId });
    return NextResponse.json({
      success: true,
      tag: DASHBOARD_PUBLIC_GRAPHS_TAG,
      revalidatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.apiError('GET /api/cron/dashboard-public-graphs', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to revalidate dashboard public graphs cache' },
      { status: 500 }
    );
  }
}
