import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { env } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cancelOrder } from "./actions";
import { HoldTimer } from "./hold-timer";
import { PayForm } from "./pay-form";
import { requestTime } from "@/lib/time";

export const metadata: Metadata = { title: "Paiement" };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await params;
  const profile = await requireProfile(`/checkout/${orderId}`);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, amount_cents, hold_expires_at,
       ticket_type:ticket_types!inner (name),
       event:events!inner (title, slug, starts_at, venue)`,
    )
    .eq("id", orderId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!order) notFound();
  if (order.status === "paid" || order.status === "free") redirect(`/checkout/${order.id}/success`);

  const expired =
    order.status !== "pending" ||
    !order.hold_expires_at ||
    new Date(order.hold_expires_at).getTime() <= requestTime();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{order.event.title}</CardTitle>
          <CardDescription>
            {formatDateTime(order.event.starts_at)} · {order.event.venue}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>{order.ticket_type.name}</span>
            <span className="font-semibold">{formatPrice(order.amount_cents)}</span>
          </div>

          {expired ? (
            <>
              <p className="text-destructive text-center font-medium">
                Ton panier a expiré, la place a été remise en jeu.
              </p>
              <Button asChild>
                <Link href={`/events/${order.event.slug}`}>Retenter ma chance</Link>
              </Button>
            </>
          ) : (
            <>
              <HoldTimer expiresAt={order.hold_expires_at!} />
              <PayForm
                orderId={order.id}
                label={
                  env.paymentProvider() === "mock"
                    ? `Payer ${formatPrice(order.amount_cents)} (simulation)`
                    : `Payer ${formatPrice(order.amount_cents)}`
                }
              />
              <form action={cancelOrder}>
                <input type="hidden" name="order_id" value={order.id} />
                <input type="hidden" name="slug" value={order.event.slug} />
                <Button variant="ghost" className="w-full" type="submit">
                  Libérer ma place
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
