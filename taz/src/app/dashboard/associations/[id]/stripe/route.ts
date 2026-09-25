import { NextResponse, type NextRequest } from "next/server";
import { createConnectOnboardingUrl } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

/** `refresh_url` Stripe : le lien d'onboarding a expiré, on en génère un nouveau. */
export async function GET(request: NextRequest, ctx: RouteContext<"/dashboard/associations/[id]/stripe">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const [{ data: isManager }, { data: association }, { data: userData }] = await Promise.all([
    supabase.rpc("is_association_manager", { p_association_id: id }),
    supabase.from("associations").select("stripe_account_id").eq("id", id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  // Ne crée jamais de compte depuis un GET : seulement un nouveau lien.
  if (!isManager || !association?.stripe_account_id) {
    return NextResponse.redirect(new URL(`/dashboard/associations/${id}`, request.url));
  }
  const url = await createConnectOnboardingUrl(id, userData.user?.email);
  return NextResponse.redirect(url);
}
