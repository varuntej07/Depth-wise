import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Step 2: Check if user is authenticated
    // We need to know who is making this request to verify ownership
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to share graphs' },
        { status: 401 } // 401 = Unauthorized
      );
    }

    // Step 3: Find the user in our database using their email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Step 4: Find the graph session in the database
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

    // Step 5: Security check - verify the user owns this session
    // This prevents users from making other people's graphs public/private
    if (graphSession.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only share your own graphs' },
        { status: 403 } // 403 = Forbidden
      );
    }

    // Step 6: Get the desired public status from the request body
    const body = await request.json();
    const { isPublic } = body;

    // Validate that isPublic is a boolean
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean value' },
        { status: 400 } // 400 = Bad Request
      );
    }

    // Step 7: Update the session's public status in the database
    const updatedSession = await prisma.graphSession.update({
      where: { id: sessionId },
      data: { isPublic },
    });

    // Step 8: Construct the shareable URL if the session is now public
    // This URL can be shared with anyone to view the graph
    const shareUrl = isPublic
      ? `${request.nextUrl.origin}/share/${sessionId}`
      : null;

    // Step 9: Return success response with the share status and URL
    return NextResponse.json({
      success: true,
      isPublic: updatedSession.isPublic,
      shareUrl,
      message: isPublic
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
