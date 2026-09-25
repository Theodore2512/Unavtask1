import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Briefcase, Camera, Globe, Music2 } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requestTime } from "@/lib/time";

async function load(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("associations")
    .select(
      `*, school:schools!inner (name, campus),
       events (slug, title, venue, starts_at, shotgun_opens_at, cover_url, status, ticket_types (price_cents))`,
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/associations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const asso = await load(slug);
  return asso ? { title: asso.name, description: asso.description.slice(0, 160) } : {};
}

export default async function AssociationPage({ params }: PageProps<"/associations/[slug]">) {
  const { slug } = await params;
  const asso = await load(slug);
  if (!asso) notFound();

  const now = requestTime();
  const upcoming = asso.events
    .filter((e) => e.status === "published" && new Date(e.starts_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const socials = [
    { href: asso.instagram_url, label: "Instagram", icon: Camera },
    { href: asso.tiktok_url, label: "TikTok", icon: Music2 },
    { href: asso.linkedin_url, label: "LinkedIn", icon: Briefcase },
    { href: asso.website_url, label: "Site web", icon: Globe },
  ].filter((s) => s.href);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {asso.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asso.logo_url} alt="" className="size-20 rounded-full border object-cover" />
        ) : (
          <div className="bg-primary/15 text-primary grid size-20 place-items-center rounded-full text-2xl font-black">
            {asso.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="grid gap-2">
          <h1 className="text-3xl font-black">{asso.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {asso.school.name} {asso.school.campus}
            </Badge>
            {asso.verified && <Badge variant="success">Asso vérifiée</Badge>}
          </div>
        </div>
      </div>

      {asso.description && <p className="max-w-2xl whitespace-pre-line">{asso.description}</p>}

      {socials.length > 0 && (
        <div className="flex gap-2">
          {socials.map(({ href, label, icon: Icon }) => (
            <Button key={label} variant="outline" size="icon" asChild>
              <a href={href!} target="_blank" rel="noreferrer" aria-label={label}>
                <Icon />
              </a>
            </Button>
          ))}
        </div>
      )}

      <section className="grid gap-4">
        <h2 className="text-xl font-bold">Prochains événements</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun événement à venir.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard
                key={e.slug}
                event={{
                  ...e,
                  association: { name: asso.name, logo_url: asso.logo_url },
                  min_price_cents: e.ticket_types.length
                    ? Math.min(...e.ticket_types.map((t) => t.price_cents))
                    : null,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
