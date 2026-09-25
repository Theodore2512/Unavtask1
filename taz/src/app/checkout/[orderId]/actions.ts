"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl } from "@/lib/payments";
import { getString, type FormState } from "@/lib/form";

export async function payOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const orderId = getString(formData, "order_id");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS : l'étudiant ne lit que ses propres commandes.
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, amount_cents, fee_cents, hold_expires_at, user_id,
       ticket_type:ticket_types!inner (name),
       event:events!inner (title, slug, association:associations!inner (stripe_account_id, stripe_charges_enabled))`,
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "pending") return { error: "Cette commande n'est plus en attente." };
  if (!order.hold_expires_at || new Date(order.hold_expires_at).getTime() <= Date.now()) {
    return { error: "Ton panier a expiré. Retente ta chance !" };
  }

  let url: string;
  try {
    url = await createCheckoutUrl({
      orderId: order.id,
      amountCents: order.amount_cents,
      feeCents: order.fee_cents,
      eventTitle: order.event.title,
      ticketTypeName: order.ticket_type.name,
      customerEmail: user.email ?? "",
      stripeAccountId: order.event.association.stripe_account_id,
      stripeChargesEnabled: order.event.association.stripe_charges_enabled,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Paiement impossible." };
  }
  redirect(url);
}

export async function cancelOrder(formData: FormData): Promise<void> {
  const orderId = getString(formData, "order_id");
  const slug = getString(formData, "slug");
  const supabase = await createClient();
  await supabase.rpc("cancel_pending_order", { p_order_id: orderId });
  redirect(`/events/${slug}`);
}
