import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { getStripePriceIdForPlan, type WorkspacePlan } from '@/lib/billing';

export const dynamic = 'force-dynamic';

type CheckoutPlan = Exclude<WorkspacePlan, 'free'>;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = String(body.workspaceId ?? '');
    const plan = String(body.plan ?? '') as CheckoutPlan;

    if (!workspaceId || !plan || (plan !== 'starter' && plan !== 'agency')) {
      return NextResponse.json({ error: 'workspaceId ve geçerli plan zorunludur' }, { status: 400 });
    }

    const priceId = getStripePriceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `${plan} planı için Stripe fiyatı tanımlı değil.` },
        { status: 400 }
      );
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, stripe_customer_id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace bulunamadı veya erişim yok' }, { status: 403 });
    }

    let customerId = workspace.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          workspace_id: workspace.id,
          owner_id: user.id,
        },
        name: workspace.name ?? undefined,
      });
      customerId = customer.id;

      await supabase
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspace.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        workspace_id: workspace.id,
        plan,
      },
      subscription_data: {
        metadata: {
          workspace_id: workspace.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout oluşturulamadı' },
      { status: 500 }
    );
  }
}
