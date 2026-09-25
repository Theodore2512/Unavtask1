import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { stripe } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : checkout.session.completed -> billet émis ;
 * account.updated -> statut d'encaissement de l'asso.
 * Si l'événement est complet entre-temps (panier expiré), on rembourse.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  // Deux endpoints Stripe (compte + comptes connectés) pointent ici, chacun avec son secret.
  const body = await request.text();
  let event: Stripe.Event | null = null;
  for (const secret of env.stripeWebhookSecrets()) {
    try {
      event = stripe().webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // essaie le secret suivant
    }
  }
  if (!event) return NextResponse.json({ error: "Signature invalide" }, { status: 400 });

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (!orderId || session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const { error } = await admin.rpc("confirm_order_payment", {
      p_order_id: orderId,
      p_stripe_session_id: session.id,
    });

    if (error) {
      if (error.code === "53400" && typeof session.payment_intent === "string") {
        await stripe().refunds.create({
          payment_intent: session.payment_intent,
          refund_application_fee: true,
          reverse_transfer: true,
        });
        await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        return NextResponse.json({ refunded: true });
      }
      // 500 => Stripe réessaiera.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Événement de compte connecté (endpoint "Connect" côté Stripe).
  if (event.type === "account.updated") {
    const account = event.data.object;
    await admin
      .from("associations")
      .update({ stripe_charges_enabled: Boolean(account.charges_enabled) })
      .eq("stripe_account_id", account.id);
  }

  if (event.type === "checkout.session.expired") {
    const orderId = event.data.object.metadata?.order_id;
    if (orderId) {
      await admin
        .from("orders")
        .update({ status: "expired" })
        .eq("id", orderId)
        .eq("status", "pending");
    }
  }

  return NextResponse.json({ received: true });
}
