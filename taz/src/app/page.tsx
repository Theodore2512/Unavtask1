import Link from "next/link";
import { Flame, ShieldCheck, Ticket } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { CountUp } from "@/components/motion/count-up";
import { HeroGradient } from "@/components/motion/hero-gradient";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { ville } = await searchParams;
  const citySlug = typeof ville === "string" ? ville : null;

  const supabase = await createClient();
  const [
    profile,
    { data: cities },
    { count: eventCount },
    { count: assoCount },
    { count: schoolCount },
  ] = await Promise.all([
    getCurrentProfile(),
    supabase.from("cities").select("id, name, slug").order("name"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("associations").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }),
  ]);
  const stats = [
    { label: "événements publiés", value: eventCount ?? 0 },
    { label: "assos & BDE", value: assoCount ?? 0 },
    { label: "écoles & campus", value: schoolCount ?? 0 },
  ];
  const city = cities?.find((c) => c.slug === citySlug) ?? null;

  let query = supabase
    .from("events")
    .select(
      `slug, title, venue, starts_at, shotgun_opens_at, cover_url, status,
       association:associations!inner (name, logo_url, school:schools!inner (city_id)),
       ticket_types (price_cents)`,
    )
    .eq("status", "published")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(30);
  if (city) query = query.eq("association.school.city_id", city.id);
  const { data: events } = await query;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
      <section className="relative isolate grid gap-4 overflow-hidden rounded-3xl px-4 py-12 text-center sm:py-20">
        <HeroGradient />
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          Le shotgun, <span className="text-primary">sans le crash.</span>
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl sm:text-lg">
          TAZ, la billetterie des BDE, associations et listes : réservation équitable, paiement
          sécurisé et billet QR code en quelques secondes.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Magnetic>
            {profile ? (
              <Button size="lg" asChild>
                <Link href="/dashboard/associations/new">Créer mon asso</Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/signup">Je suis étudiant·e</Link>
              </Button>
            )}
          </Magnetic>
          <Magnetic>
            <Button size="lg" variant="outline" className="bg-background/60" asChild>
              <a href="#events">Voir les événements</a>
            </Button>
          </Magnetic>
        </div>
        <div className="text-muted-foreground mx-auto mt-4 grid max-w-3xl gap-3 text-sm sm:grid-cols-3">
          <span className="flex items-center justify-center gap-2">
            <Flame className="text-primary size-4" /> Shotgun équitable
          </span>
          <span className="flex items-center justify-center gap-2">
            <ShieldCheck className="text-primary size-4" /> 100 % étudiants vérifiés
          </span>
          <span className="flex items-center justify-center gap-2">
            <Ticket className="text-primary size-4" /> Billet QR instantané
          </span>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 90}
            className="bg-card rounded-2xl border p-4 text-center sm:p-6"
          >
            <CountUp value={s.value} className="text-3xl font-black sm:text-4xl" />
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{s.label}</p>
          </Reveal>
        ))}
      </section>

      <section id="events" className="grid scroll-mt-20 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Prochains événements</h2>
          <nav className="flex flex-wrap gap-1" aria-label="Filtrer par ville">
            <CityChip href="/#events" active={!city} label="Toutes" />
            {cities?.map((c) => (
              <CityChip
                key={c.id}
                href={`/?ville=${c.slug}#events`}
                active={city?.id === c.id}
                label={c.name}
              />
            ))}
          </nav>
        </div>

        {!events?.length ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center">
            Aucun événement à venir {city ? `à ${city.name}` : ""} pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Reveal key={e.slug} delay={(i % 3) * 90} className="h-full">
                <EventCard
                  event={{
                    ...e,
                    association: e.association,
                    min_price_cents: e.ticket_types.length
                      ? Math.min(...e.ticket_types.map((t) => t.price_cents))
                      : null,
                  }}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CityChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition",
        active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
      )}
    >
      {label}
    </Link>
  );
}
