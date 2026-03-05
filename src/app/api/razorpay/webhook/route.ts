import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { RAZORPAY_PLAN_IDS } from '@/lib/subscription-server';
import { SubscriptionTier } from '@prisma/client';

// Reverse lookup: Razorpay plan_id → SubscriptionTier
function tierFromPlanId(planId: string): SubscriptionTier | null {
  for (const [tier, id] of Object.entries(RAZORPAY_PLAN_IDS)) {
    if (id === planId) return tier as SubscriptionTier;
  }
  return null;
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    switch (eventType) {
      case 'subscription.activated': {
        const subscriptionId = payload.subscription?.entity?.id;
        const planId = payload.subscription?.entity?.plan_id;

        if (!subscriptionId || !planId) break;

        const tier = tierFromPlanId(planId);
        if (!tier) {
          console.error('Unknown plan_id in webhook:', planId);
          break;
        }

        await prisma.user.updateMany({
          where: { subscriptionId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionTier: tier,
          },
        });
        break;
      }

      case 'subscription.charged': {
        const subscriptionId = payload.subscription?.entity?.id;
        if (!subscriptionId) break;

        // Ensure status stays ACTIVE on successful charge
        await prisma.user.updateMany({
          where: { subscriptionId },
          data: { subscriptionStatus: 'ACTIVE' },
        });
        break;
      }

      case 'subscription.cancelled': {
        const subscriptionId = payload.subscription?.entity?.id;
        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { subscriptionId },
          data: {
            subscriptionStatus: 'CANCELED',
            subscriptionTier: 'FREE',
            explorationsUsed: 0,
          },
        });
        break;
      }

      case 'subscription.halted':
      case 'payment.failed': {
        const subscriptionId =
          payload.subscription?.entity?.id || payload.payment?.entity?.subscription_id;
        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { subscriptionId },
          data: { subscriptionStatus: 'PAST_DUE' },
        });
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
