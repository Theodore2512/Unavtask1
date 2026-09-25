import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CalendarDays, Camera, Globe, MapPin, School, Users } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReservePanel, type TicketOption } from "./reserve-panel";
import { requestTime } from "@/lib/time";

async function loadEvent(slug: string) {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      `*,
       association:associations!inner (id, name, slug, logo_url, description, instagram_url, linkedin_url, website_url, school_id,
         school:schools!inner (name, campus)),
       ticket_types (id, name, kind, price_cents, sort_order),
       event_school_quotas (quota, school:schools!inner (id, name, campus))`,
    )
    .eq("slug", slug)
    .maybeSingle();
  return event;
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  return event ? { title: event.title, description: event.description.slice(0, 160) } : {};
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();

  const supabase = await createClient();
  const [profile, { data: availability }] = await Promise.all([
    getCurrentProfile(),
    supabase.rpc("get_event_availability", { p_event_id: event.id }),
  ]);

  const { data: myOrder } = profile
    ? await supabase
        .from("orders")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("user_id", profile.id)
        .in("status", ["pending", "paid", "free"])
        .maybeSingle()
    : { data: null };
  const { data: myTicket } =
    myOrder && myOrder.status !== "pending"
      ? await supabase.from("tickets").select("id").eq("order_id", myOrder.id).maybeSingle()
      : { data: null };

  const remainingByType = new Map((availability ?? []).map((a) => [a.ticket_type_id, a.remaining]));
  const eventRemaining = availability?.[0]?.event_remaining ?? event.capacity;
  const options: TicketOption[] = [...event.ticket_types]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({ ...t, remaining: remainingByType.get(t.id) ?? 0 }));

  const now = requestTime();
  const shotgunOpen = new Date(event.shotgun_opens_at).getTime() <= now;
  const ended = new Date(event.starts_at).getTime() <= now;
  const asso = event.association;

  let disabledReason: string | null = null;
  if (event.status === "cancelled") disabledReason = "Événement annulé";
  else if (event.status === "draft") disabledReason = "Brouillon (non publié)";
  else if (ended) disabledReason = "Billetterie fermée";
  else if (!shotgunOpen) disabledReason = "Shotgun verrouillé";
  else if (eventRemaining <= 0) disabledReason = "Complet";
  else if (profile && !profile.student_verified) disabledReason = "Statut étudiant non vérifié";
  else if (
    profile &&
    event.access_mode === "school_only" &&
    profile.school_id !== asso.school_id
  )
    disabledReason = `Réservé à ${asso.school.name} ${asso.school.campus}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="from-primary/80 to-primary/30 relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-gradient-to-br">
        {event.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <div className="grid gap-3">
            <Link href={`/associations/${asso.slug}`} className="flex items-center gap-2 text-sm font-medium hover:underline">
              {asso.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asso.logo_url} alt="" className="size-6 rounded-full object-cover" />
              )}
              {asso.name}
            </Link>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <CalendarDays /> {formatDateTime(event.starts_at)}
              </Badge>
              <Badge variant="outline">
                <MapPin /> {event.venue}
              </Badge>
              <Badge variant="outline">
                {event.access_mode === "school_only" ? <School /> : <Users />}
                {event.access_mode === "school_only"
                  ? `${asso.school.name} ${asso.school.campus} uniquement`
                  : "Inter-écoles"}
              </Badge>
            </div>
          </div>

          {event.status === "cancelled" && (
            <Alert variant="destructive">
              <AlertDescription>Cet événement a été annulé par l&apos;organisateur.</AlertDescription>
            </Alert>
          )}

          <div className="prose max-w-none whitespace-pre-line">{event.description}</div>

          {event.address && (
            <p className="text-muted-foreground text-sm">
              <MapPin className="mr-1 inline size-4" />
              {event.address}
            </p>
          )}

          {event.access_mode === "inter_school" && event.event_school_quotas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Écoles invitées</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {event.event_school_quotas.map((q) => (
                  <Badge key={q.school.id} variant="secondary">
                    {q.school.name} {q.school.campus} · {q.quota} places
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            {asso.instagram_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={asso.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Camera />
                </a>
              </Button>
            )}
            {asso.linkedin_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={asso.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <Briefcase />
                </a>
              </Button>
            )}
            {asso.website_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={asso.website_url} target="_blank" rel="noreferrer" aria-label="Site web">
                  <Globe />
                </a>
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>{shotgunOpen ? "Billetterie" : "Ouverture du shotgun"}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {shotgunOpen
                  ? `${Math.max(0, eventRemaining)} / ${event.capacity} places disponibles`
                  : formatDateTime(event.shotgun_opens_at)}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              {!shotgunOpen && event.status === "published" && (
                <Countdown target={event.shotgun_opens_at} />
              )}

              {myOrder ? (
                myOrder.status === "pending" ? (
                  <Button size="lg" asChild>
                    <Link href={`/checkout/${myOrder.id}`}>Finaliser mon paiement</Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild>
                    <Link href={myTicket ? `/tickets/${myTicket.id}` : "/tickets"}>
                      🎟️ Voir mon billet
                    </Link>
                  </Button>
                )
              ) : profile ? (
                <ReservePanel
                  eventId={event.id}
                  slug={event.slug}
                  options={options}
                  disabledReason={disabledReason}
                />
              ) : (
                <Button size="lg" asChild>
                  <Link href={`/login?next=/events/${event.slug}`}>Se connecter pour réserver</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
