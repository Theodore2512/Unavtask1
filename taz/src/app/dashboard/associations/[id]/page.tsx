import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { updateAssociation } from "../actions";
import { AssociationForm } from "../association-form";

export const metadata: Metadata = { title: "Mon association" };

const STATUS_LABEL = { draft: "Brouillon", published: "Publié", cancelled: "Annulé" } as const;

export default async function AssociationDashboardPage({
  params,
}: PageProps<"/dashboard/associations/[id]">) {
  const { id } = await params;
  const profile = await requireProfile(`/dashboard/associations/${id}`);
  const supabase = await createClient();

  const [{ data: association }, { data: membership }, { data: events }] = await Promise.all([
    supabase.from("associations").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("association_members")
      .select("role")
      .eq("association_id", id)
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, title, slug, starts_at, status, capacity")
      .eq("association_id", id)
      .order("starts_at", { ascending: false }),
  ]);
  if (!association || (!membership && profile.role !== "admin")) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_1fr]">
      <section className="grid content-start gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black">{association.name}</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/associations/${association.slug}`}>
              <ExternalLink /> Page publique
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Événements</h2>
          <Button size="sm" asChild>
            <Link href={`/dashboard/associations/${id}/events/new`}>
              <Plus /> Créer un événement
            </Link>
          </Button>
        </div>
        {!events?.length ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Aucun événement pour l&apos;instant.
          </p>
        ) : (
          <ul className="grid gap-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dashboard/events/${e.id}`}
                  className="bg-card flex items-center justify-between gap-3 rounded-lg border p-3 transition hover:shadow-sm"
                >
                  <span className="grid">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(e.starts_at)} · {e.capacity} places
                    </span>
                  </span>
                  <Badge
                    variant={
                      e.status === "published" ? "success" : e.status === "draft" ? "secondary" : "destructive"
                    }
                  >
                    {STATUS_LABEL[e.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Profil de l&apos;association</CardTitle>
        </CardHeader>
        <CardContent>
          <AssociationForm
            action={updateAssociation}
            association={association}
            submitLabel="Enregistrer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
