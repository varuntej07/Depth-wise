import { NextRequest, NextResponse } from 'next/server';
import {
  DASHBOARD_PUBLIC_GRAPHS_REVALIDATE_SECONDS,
  getPublicGraphsDashboardData,
} from '@/lib/dashboard-public-graphs';
import { logger } from '@/lib/logger';

const DEFAULT_LIMIT = 48;
const MIN_LIMIT = 8;
const MAX_LIMIT = 80;

const parseLimit = (input: string | null): number => {
  if (!input) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(parsed)));
};

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  try {
    logger.apiStart('GET /api/dashboard/public-graphs', { requestId, limit });

    const payload = await getPublicGraphsDashboardData(limit);

    logger.apiSuccess('GET /api/dashboard/public-graphs', {
      requestId,
      limit,
      cards: payload.cards.length,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${DASHBOARD_PUBLIC_GRAPHS_REVALIDATE_SECONDS}, stale-while-revalidate=${DASHBOARD_PUBLIC_GRAPHS_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    logger.apiError('GET /api/dashboard/public-graphs', error, { requestId, limit });
    return NextResponse.json(
      { error: 'Failed to load dashboard public graphs' },
      { status: 500 }
    );
  }
}
