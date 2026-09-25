import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon billet" };

export default async function TicketPage({ params }: PageProps<"/tickets/[id]">) {
  const { id } = await params;
  const profile = await requireProfile(`/tickets/${id}`);
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      `id, qr_token, status, checked_in_at,
       order:orders!inner (amount_cents, status),
       ticket_type:ticket_types!inner (name),
       event:events!inner (title, starts_at, venue, address, association:associations!inner (name))`,
    )
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!ticket) notFound();

  const qr = await QRCode.toDataURL(ticket.qr_token, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="mx-auto max-w-sm px-4 py-8">
      <div className="bg-card overflow-hidden rounded-2xl border shadow-lg">
        <div className="bg-primary text-primary-foreground grid gap-1 p-5">
          <span className="text-xs font-medium uppercase opacity-80">
            {ticket.event.association.name}
          </span>
          <h1 className="text-xl font-black">{ticket.event.title}</h1>
        </div>

        <div className="grid justify-items-center gap-3 p-6">
          {ticket.status === "valid" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code du billet" className="size-64 rounded-lg bg-white p-2" />
          ) : (
            <div className="bg-muted text-muted-foreground grid size-64 place-items-center rounded-lg text-center font-semibold">
              {ticket.status === "used" ? "Billet déjà scanné" : "Billet annulé"}
            </div>
          )}
          <p className="font-mono text-xs tracking-widest">{ticket.qr_token.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="grid gap-2 border-t border-dashed p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Titulaire</span>
            <span className="font-medium">
              {profile.first_name} {profile.last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarif</span>
            <span className="font-medium">
              {ticket.ticket_type.name} · {formatPrice(ticket.order.amount_cents)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4" /> {formatDateTime(ticket.event.starts_at)}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4" /> {ticket.event.venue}
            {ticket.event.address ? ` — ${ticket.event.address}` : ""}
          </div>
          <Badge
            className="mt-2 justify-self-center"
            variant={ticket.order.status === "free" ? "secondary" : "success"}
          >
            {ticket.order.status === "free" ? "Gratuit" : "Payé"}
          </Badge>
        </div>
      </div>
      <p className="text-muted-foreground mt-4 text-center text-xs">
        Présente ce QR code à l&apos;entrée avec ta carte étudiante.
      </p>
    </div>
  );
}
