import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Scanner } from "./scanner";

export const metadata: Metadata = { title: "Contrôle d'entrée" };

export default async function ScanPage({ params }: PageProps<"/dashboard/events/[id]/scan">) {
  const { id } = await params;
  await requireProfile(`/dashboard/events/${id}/scan`);
  const supabase = await createClient();

  const [{ data: event }, { data: isOrganizer }] = await Promise.all([
    supabase.from("events").select("id, title").eq("id", id).maybeSingle(),
    supabase.rpc("is_event_organizer", { p_event_id: id }),
  ]);
  if (!event || !isOrganizer) notFound();

  const [{ count: used }, { count: total }] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", id).eq("status", "used"),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", id).neq("status", "cancelled"),
  ]);

  return (
    <div className="mx-auto grid max-w-md gap-4 px-4 py-6">
      <div>
        <Link href={`/dashboard/events/${id}`} className="text-muted-foreground text-sm hover:underline">
          ← Retour au suivi
        </Link>
        <h1 className="text-xl font-black">Contrôle d&apos;entrée · {event.title}</h1>
      </div>
      <Scanner eventId={event.id} initialCount={used ?? 0} total={total ?? 0} />
    </div>
  );
}
