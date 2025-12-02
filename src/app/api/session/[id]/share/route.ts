import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isValidUUID, sanitizeBoolean } from '@/lib/utils';

/**
 * POST /api/session/[id]/share
 *
 * Toggles the public/private status of a graph session.
 * Only the owner of the session can toggle its share status.
 *
 * Request body:
 * {
 *   "isPublic": boolean  // true to make public, false to make private
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "isPublic": boolean,
 *   "shareUrl": string (only when isPublic is true)
 * }
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Await params to get the session ID (Next.js 15 requirement)
    const params = await props.params;
    const sessionId = params.id;

    // Validate sessionId format
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Step 2: Find the graph session in the database first
    const graphSession = await prisma.graphSession.findUnique({
      where: { id: sessionId },
    });

    // Check if the session exists
    if (!graphSession) {
      return NextResponse.json(
        { error: 'Graph session not found' },
        { status: 404 }
      );
    }

    // Step 3: Check authentication and ownership
    // Anonymous users (userId: null) can share their own graphs
    // Authenticated users can only share their own graphs
    const session = await auth();

    if (graphSession.userId !== null) {
      // This is an authenticated user's graph
      // Must be signed in to toggle share status
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'You must be signed in to share this graph' },
          { status: 401 } // 401 = Unauthorized
        );
      }

      // Find the authenticated user in our database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Security check - verify the user owns this session
      if (graphSession.userId !== user.id) {
        return NextResponse.json(
          { error: 'You can only share your own graphs' },
          { status: 403 } // 403 = Forbidden
        );
      }
    }
    // If graphSession.userId is null, it's an anonymous graph
    // We allow anyone to toggle it (no ownership check needed for anonymous graphs)

    // Step 6: Get the desired public status from the request body
    const body = await request.json();
    const { isPublic } = body;

    // Validate that isPublic is a boolean
    const publicResult = sanitizeBoolean(isPublic);
    if (!publicResult.isValid) {
      return NextResponse.json(
        { error: publicResult.error, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    const validatedIsPublic = publicResult.value!;

    // Step 7: Update the session's public status in the database
    const updatedSession = await prisma.graphSession.update({
      where: { id: sessionId },
      data: { isPublic: validatedIsPublic },
    });

    // Step 8: Construct the shareable URL if the session is now public
    // This URL can be shared with anyone to view the graph
    const shareUrl = validatedIsPublic
      ? `${request.nextUrl.origin}/share/${sessionId}`
      : null;

    // Step 9: Return success response with the share status and URL
    return NextResponse.json({
      success: true,
      isPublic: updatedSession.isPublic,
      shareUrl,
      message: validatedIsPublic
        ? 'Graph is now public and can be shared'
        : 'Graph is now private',
    });

  } catch (error) {
    // Log the error for debugging
    console.error('Share toggle error:', error);

    // Return a generic error message to the user
    return NextResponse.json(
      { error: 'Failed to update share status' },
      { status: 500 } // 500 = Internal Server Error
    );
  }
}
