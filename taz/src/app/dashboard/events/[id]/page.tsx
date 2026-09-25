import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, ScanLine, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { requireProfile } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";
import { cancelAttendeeOrder, setEventStatus } from "../actions";
import { LiveRefresh } from "./live-refresh";

export const metadata: Metadata = { title: "Suivi de l'événement" };

const PAYMENT_BADGE: Record<
  Enums<"order_status">,
  { label: string; variant: "success" | "secondary" | "destructive" | "warning" | "outline" }
> = {
  paid: { label: "Payé", variant: "success" },
  free: { label: "Gratuit", variant: "secondary" },
  pending: { label: "Paiement en cours", variant: "warning" },
  cancelled: { label: "Annulé", variant: "destructive" },
  expired: { label: "Expiré", variant: "outline" },
};

export default async function EventDashboardPage({ params }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  await requireProfile(`/dashboard/events/${id}`);
  const supabase = await createClient();

  const [{ data: event }, { data: attendees, error }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, slug, status, capacity, starts_at, shotgun_opens_at, association_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("get_event_attendees", { p_event_id: id }),
  ]);
  if (!event || error) notFound();

  const rows = attendees ?? [];
  const confirmed = rows.filter((a) => a.order_status === "paid" || a.order_status === "free");
  const pending = rows.filter((a) => a.order_status === "pending").length;
  const paid = rows.filter((a) => a.order_status === "paid");
  const revenue = paid.reduce((s, a) => s + a.amount_cents, 0);

  const stats = [
    {
      label: "Billets confirmés",
      value: (
        <>
          <CountUp value={confirmed.length} /> / {event.capacity}
        </>
      ),
    },
    { label: "Paniers en cours", value: <CountUp value={pending} /> },
    { label: "Recettes brutes", value: <CountUp value={revenue} format="currency" /> },
    {
      label: "Check-ins",
      value: <CountUp value={rows.filter((a) => a.ticket_status === "used").length} />,
    },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <Link
            href={`/dashboard/associations/${event.association_id}`}
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Retour à l&apos;asso
          </Link>
          <h1 className="text-2xl font-black">{event.title}</h1>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(event.starts_at)} · shotgun {formatDateTime(event.shotgun_opens_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${event.slug}`}>
              <ExternalLink /> Page publique
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/events/${event.id}/scan`}>
              <ScanLine /> Scanner les billets
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/events/${event.id}/export`}>
              <Download /> Export CSV
            </a>
          </Button>
          {(event.status === "draft" || (event.status === "published" && rows.length === 0)) && (
            <form action={setEventStatus}>
              <input type="hidden" name="id" value={event.id} />
              <input
                type="hidden"
                name="status"
                value={event.status === "draft" ? "published" : "draft"}
              />
              <Button
                size="sm"
                type="submit"
                variant={event.status === "draft" ? "default" : "secondary"}
              >
                {event.status === "draft" ? "Publier" : "Repasser en brouillon"}
              </Button>
            </form>
          )}
          {event.status === "published" && (
            <form action={setEventStatus}>
              <input type="hidden" name="id" value={event.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button size="sm" type="submit" variant="destructive">
                Annuler l&apos;événement
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 70}>
            <Card className="h-full gap-1 py-4">
              <CardHeader className="px-4">
                <CardDescription>{s.label}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 text-2xl font-bold tabular-nums">{s.value}</CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Participants</CardTitle>
          <LiveRefresh eventId={event.id} />
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Aucune réservation pour l&apos;instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>École</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Entrée</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const badge = PAYMENT_BADGE[a.order_status];
                  return (
                    <TableRow key={a.order_id}>
                      <TableCell>
                        <div className="font-medium">
                          {a.last_name.toUpperCase()} {a.first_name}
                        </div>
                        <div className="text-muted-foreground text-xs">{a.email}</div>
                      </TableCell>
                      <TableCell>{a.school_name ?? "—"}</TableCell>
                      <TableCell>{a.ticket_type}</TableCell>
                      <TableCell className="tabular-nums">{formatPrice(a.amount_cents)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.ticket_status === "used" ? (
                          <Badge variant="secondary">Entré</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(a.order_status === "paid" || a.order_status === "free") && (
                          <form action={cancelAttendeeOrder}>
                            <input type="hidden" name="order_id" value={a.order_id} />
                            <input type="hidden" name="event_id" value={event.id} />
                            <Button
                              size="icon"
                              variant="ghost"
                              type="submit"
                              aria-label="Annuler ce billet"
                            >
                              <X />
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
