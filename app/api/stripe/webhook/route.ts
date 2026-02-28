import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { planFromStripePriceId, type SubscriptionStatus, type WorkspacePlan } from '@/lib/billing';

export const dynamic = 'force-dynamic';

function normalizePlan(value: string | null | undefined): WorkspacePlan | null {
  if (value === 'free' || value === 'starter' || value === 'agency') return value;
  return null;
}

function normalizeSubscriptionStatus(value: string | null | undefined): SubscriptionStatus {
  const valid: SubscriptionStatus[] = [
    'inactive',
    'trialing',
    'active',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete',
    'incomplete_expired',
  ];
  if (value && valid.includes(value as SubscriptionStatus)) return value as SubscriptionStatus;
  return 'inactive';
}

function planFromSubscription(subscription: Stripe.Subscription | null): WorkspacePlan | null {
  if (!subscription) return null;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  return planFromStripePriceId(priceId);
}

async function findWorkspaceIdByRefs(params: {
  admin: ReturnType<typeof createAdminClient>;
  workspaceId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<string | null> {
  const { admin, workspaceId, customerId, subscriptionId } = params;

  if (workspaceId) {
    const { data } = await admin.from('workspaces').select('id').eq('id', workspaceId).maybeSingle();
    if (data?.id) return data.id;
  }

  if (subscriptionId) {
    const { data } = await admin
      .from('workspaces')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (customerId) {
    const { data } = await admin
      .from('workspaces')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook imza doğrulaması için gerekli env eksik.' },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook imza doğrulama hatası: ${error instanceof Error ? error.message : 'invalid signature'}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Idempotency guard: reserve event id first.
  const { error: reserveError } = await admin.from('stripe_webhook_events').insert({
    id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  if (reserveError) {
    if (reserveError.message.includes('duplicate key') || reserveError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: reserveError.message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceIdMeta = session.metadata?.workspace_id ?? null;
        const planMeta = normalizePlan(session.metadata?.plan);
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;

        let subscription: Stripe.Subscription | null = null;
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
        }

        const plan = planMeta ?? planFromSubscription(subscription) ?? 'starter';
        const status = normalizeSubscriptionStatus(subscription?.status ?? 'active');

        const targetWorkspaceId = await findWorkspaceIdByRefs({
          admin,
          workspaceId: workspaceIdMeta,
          customerId,
          subscriptionId,
        });

        if (targetWorkspaceId) {
          await admin
            .from('workspaces')
            .update({
              plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: status,
            })
            .eq('id', targetWorkspaceId);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? null;

        let subscription: Stripe.Subscription | null = null;
        if (subscriptionId) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
        }

        const plan = planFromSubscription(subscription) ?? null;
        const status =
          event.type === 'invoice.paid'
            ? normalizeSubscriptionStatus(subscription?.status ?? 'active')
            : normalizeSubscriptionStatus(subscription?.status ?? 'past_due');

        const targetWorkspaceId = await findWorkspaceIdByRefs({
          admin,
          customerId,
          subscriptionId,
        });

        if (targetWorkspaceId) {
          const payload: Record<string, unknown> = {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: status,
          };
          if (plan) payload.plan = plan;

          await admin.from('workspaces').update(payload).eq('id', targetWorkspaceId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id ?? null;
        const subscriptionId = subscription.id;

        const targetWorkspaceId = await findWorkspaceIdByRefs({
          admin,
          customerId,
          subscriptionId,
        });

        if (targetWorkspaceId) {
          await admin
            .from('workspaces')
            .update({
              plan: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('id', targetWorkspaceId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Allow retry by removing reservation when processing fails.
    await admin.from('stripe_webhook_events').delete().eq('id', event.id);

    console.error('Stripe webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook işlenemedi' },
      { status: 500 }
    );
  }
}
