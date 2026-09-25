import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile("/dashboard");
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("association_members")
    .select("role, association:associations!inner (id, name, logo_url, verified, events (count))")
    .eq("user_id", profile.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Espace organisateur</h1>
          <p className="text-muted-foreground text-sm">Tes associations, BDE et listes.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/associations/new">
            <Plus /> Nouvelle asso
          </Link>
        </Button>
      </div>

      {!memberships?.length ? (
        <div className="text-muted-foreground grid justify-items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Users className="size-10" />
          <p>Tu ne gères encore aucune association.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memberships.map(({ role, association }) => (
            <li key={association.id}>
              <Link
                href={`/dashboard/associations/${association.id}`}
                className="bg-card flex items-center gap-4 rounded-xl border p-4 transition hover:shadow-md"
              >
                {association.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={association.logo_url} alt="" className="size-12 rounded-full object-cover" />
                ) : (
                  <div className="bg-primary/15 text-primary grid size-12 place-items-center rounded-full font-bold">
                    {association.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="grid gap-1">
                  <span className="font-semibold">{association.name}</span>
                  <span className="flex gap-2">
                    <Badge variant="secondary">{role}</Badge>
                    <Badge variant="outline">{association.events[0]?.count ?? 0} événements</Badge>
                    {association.verified && <Badge variant="success">Vérifiée</Badge>}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
