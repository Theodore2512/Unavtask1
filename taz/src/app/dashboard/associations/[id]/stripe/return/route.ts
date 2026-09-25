import { NextResponse, type NextRequest } from "next/server";
import { syncConnectStatus } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

/** `return_url` Stripe : fin (ou abandon) de l'onboarding, on relit le statut. */
export async function GET(request: NextRequest, ctx: RouteContext<"/dashboard/associations/[id]/stripe/return">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const [{ data: isManager }, { data: association }] = await Promise.all([
    supabase.rpc("is_association_manager", { p_association_id: id }),
    supabase.from("associations").select("stripe_account_id").eq("id", id).maybeSingle(),
  ]);

  const target = new URL(`/dashboard/associations/${id}`, request.url);
  if (isManager && association?.stripe_account_id) {
    const enabled = await syncConnectStatus(association.stripe_account_id);
    target.searchParams.set("stripe", enabled ? "ok" : "incomplete");
  }
  return NextResponse.redirect(target);
}
