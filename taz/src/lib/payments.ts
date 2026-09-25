import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Couche paiement. PAYMENT_PROVIDER=mock (défaut) simule le paiement ;
 * PAYMENT_PROVIDER=stripe utilise Stripe Checkout + Connect :
 *   - l'étudiant paie le prix affiché,
 *   - TAZ prélève sa commission (3 %) via `application_fee_amount`,
 *   - le reste est viré sur le compte Connect de l'asso (`transfer_data`).
 */

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  stripeClient ??= new Stripe(env.stripeSecretKey());
  return stripeClient;
}

export type CheckoutInput = {
  orderId: string;
  amountCents: number;
  feeCents: number;
  eventTitle: string;
  ticketTypeName: string;
  customerEmail: string;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
};

/** Crée la session de paiement et renvoie l'URL vers laquelle rediriger. */
export async function createCheckoutUrl(input: CheckoutInput): Promise<string> {
  const site = env.siteUrl();

  if (env.paymentProvider() === "mock") {
    const admin = createAdminClient();
    const { error } = await admin.rpc("confirm_order_payment", {
      p_order_id: input.orderId,
      p_stripe_session_id: `mock_${input.orderId}`,
    });
    if (error) throw new Error(error.message);
    return `${site}/checkout/${input.orderId}/success`;
  }

  if (!input.stripeAccountId || !input.stripeChargesEnabled) {
    throw new Error("L'association n'a pas encore finalisé son compte Stripe.");
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    client_reference_id: input.orderId,
    metadata: { order_id: input.orderId },
    // Minimum imposé par Stripe : 30 min. Un paiement arrivé après la fin du
    // panier n'est accepté que s'il reste de la place (sinon remboursé).
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: input.amountCents,
          product_data: { name: `${input.eventTitle} — ${input.ticketTypeName}` },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: input.feeCents,
      transfer_data: { destination: input.stripeAccountId },
      metadata: { order_id: input.orderId },
    },
    success_url: `${site}/checkout/${input.orderId}/success`,
    cancel_url: `${site}/checkout/${input.orderId}`,
  });

  const admin = createAdminClient();
  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", input.orderId);

  if (!session.url) throw new Error("Session Stripe sans URL");
  return session.url;
}

// ---------------------------------------------------------------------------
// Stripe Connect (Express) : onboarding des associations
// ---------------------------------------------------------------------------

/** Crée le compte Connect de l'asso si besoin et renvoie le lien d'onboarding Stripe. */
export async function createConnectOnboardingUrl(
  associationId: string,
  email: string | undefined,
): Promise<string> {
  const admin = createAdminClient();
  const { data: association, error } = await admin
    .from("associations")
    .select("id, name, stripe_account_id")
    .eq("id", associationId)
    .single();
  if (error || !association) throw new Error("Association introuvable");

  let accountId = association.stripe_account_id;
  if (!accountId) {
    const account = await stripe().accounts.create({
      type: "express",
      country: "FR",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: { name: association.name },
      metadata: { association_id: association.id },
    });
    accountId = account.id;
    await admin.from("associations").update({ stripe_account_id: accountId }).eq("id", association.id);
  }

  const site = env.siteUrl();
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${site}/dashboard/associations/${association.id}/stripe`,
    return_url: `${site}/dashboard/associations/${association.id}/stripe/return`,
  });
  return link.url;
}

/** Relit le compte Stripe et met à jour `stripe_charges_enabled`. */
export async function syncConnectStatus(stripeAccountId: string): Promise<boolean> {
  const account = await stripe().accounts.retrieve(stripeAccountId);
  const enabled = Boolean(account.charges_enabled);
  await createAdminClient()
    .from("associations")
    .update({ stripe_charges_enabled: enabled })
    .eq("stripe_account_id", stripeAccountId);
  return enabled;
}
