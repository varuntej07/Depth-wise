import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RAZORPAY_PLAN_IDS } from '@/lib/subscription-server';
import { SubscriptionTier } from '@prisma/client';

function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!tier || !['STARTER', 'PRO'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier. Must be STARTER or PRO.' },
        { status: 400 }
      );
    }

    const planId = RAZORPAY_PLAN_IDS[tier as Exclude<SubscriptionTier, 'FREE'>];
    if (!planId) {
      return NextResponse.json(
        { error: 'Razorpay plan not configured for this tier' },
        { status: 500 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Razorpay subscription
    const razorpay = getRazorpay();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 months max
      quantity: 1,
    });

    // Store subscription ID with INCOMPLETE status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: 'INCOMPLETE',
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Razorpay subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
