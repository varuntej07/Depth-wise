import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RAZORPAY_PLAN_IDS } from '@/lib/subscription-server';
import { SubscriptionTier } from '@prisma/client';

function tierFromPlanId(planId: string): SubscriptionTier | null {
  for (const [tier, id] of Object.entries(RAZORPAY_PLAN_IDS)) {
    if (id === planId) return tier as SubscriptionTier;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });
    }

    // Verify signature: hmac_sha256(payment_id + "|" + subscription_id, key_secret)
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Find the user and update subscription status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Look up the subscription to get the plan_id for tier mapping
    // For now, use the subscriptionId stored during creation to find the tier
    // The webhook will also handle this, but we update immediately for better UX
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: keySecret,
    });

    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    const tier = tierFromPlanId(subscription.plan_id) || 'STARTER';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionId: razorpay_subscription_id,
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: tier,
      },
    });

    return NextResponse.json({
      success: true,
      tier,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
