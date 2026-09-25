import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes billets" };

export default async function TicketsPage() {
  const profile = await requireProfile("/tickets");
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      `id, status,
       ticket_type:ticket_types!inner (name),
       event:events!inner (title, slug, starts_at, venue, association:associations!inner (name))`,
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-black">Mes billets</h1>
      {!tickets?.length ? (
        <div className="text-muted-foreground grid justify-items-center gap-4 rounded-xl border border-dashed p-10 text-center">
          <Ticket className="size-10" />
          <p>Pas encore de billet. Le prochain shotgun t&apos;attend !</p>
          <Button asChild>
            <Link href="/">Voir les événements</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {tickets.map((t, i) => (
            <Reveal as="li" key={t.id} delay={Math.min(i, 5) * 60}>
              <Link
                href={`/tickets/${t.id}`}
                className="bg-card flex items-center justify-between gap-4 rounded-xl border p-4 transition hover:shadow-md"
              >
                <div className="grid gap-1">
                  <span className="text-muted-foreground text-xs uppercase">
                    {t.event.association.name}
                  </span>
                  <span className="font-semibold">{t.event.title}</span>
                  <span className="text-muted-foreground flex flex-wrap gap-x-3 text-sm">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> {formatDateTime(t.event.starts_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {t.event.venue}
                    </span>
                  </span>
                </div>
                <Badge
                  variant={
                    t.status === "valid"
                      ? "success"
                      : t.status === "used"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {t.status === "valid"
                    ? t.ticket_type.name
                    : t.status === "used"
                      ? "Utilisé"
                      : "Annulé"}
                </Badge>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
