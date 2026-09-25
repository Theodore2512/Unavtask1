import { notFound, redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "./auto-refresh";

export default async function CheckoutSuccessPage({
  params,
}: PageProps<"/checkout/[orderId]/success">) {
  const { orderId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id")
    .eq("order_id", orderId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (ticket) redirect(`/tickets/${ticket.id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!order) notFound();

  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 px-4 py-20 text-center">
      <AutoRefresh />
      <Loader2 className="text-primary size-10 animate-spin" />
      <h1 className="text-xl font-bold">Paiement en cours de validation…</h1>
      <p className="text-muted-foreground text-sm">
        Ton billet apparaîtra ici dans quelques secondes. Ne ferme pas la page.
      </p>
    </div>
  );
}
