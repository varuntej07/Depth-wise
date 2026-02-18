import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    logger.apiStart('GET /api/sessions', { requestId });

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all GraphSessions for this user, ordered by most recent first
    const sessions = await prisma.graphSession.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        rootQuery: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        nodeCount: true,
        maxDepth: true,
      },
    });

    // Format sessions for sidebar display
    const formattedSessions = sessions.map((session: typeof sessions[0]) => ({
      id: session.id,
      title: session.title || session.rootQuery.slice(0, 60), // Truncate to 60 chars
      timestamp: session.updatedAt,
      nodeCount: session.nodeCount,
      maxDepth: session.maxDepth,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    logger.apiError('GET /api/sessions', error, { requestId });
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  } finally {
    logger.info('api.complete:GET /api/sessions', { requestId });
  }
}
