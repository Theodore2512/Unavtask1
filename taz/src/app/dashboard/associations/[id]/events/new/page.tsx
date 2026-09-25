import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "./event-form";

export const metadata: Metadata = { title: "Nouvel événement" };

export default async function NewEventPage({
  params,
}: PageProps<"/dashboard/associations/[id]/events/new">) {
  const { id } = await params;
  await requireProfile(`/dashboard/associations/${id}/events/new`);
  const supabase = await createClient();

  const [{ data: association }, { data: isMember }, { data: schools }] = await Promise.all([
    supabase.from("associations").select("id, name, school_id").eq("id", id).maybeSingle(),
    supabase.rpc("is_association_member", { p_association_id: id }),
    supabase.from("schools").select("id, name, campus, city:cities!inner (name)").order("name"),
  ]);
  if (!association || !isMember) notFound();

  const schoolOptions = (schools ?? []).map((s) => ({
    id: s.id,
    label: `${s.name} — ${s.campus} (${s.city.name})`,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nouvel événement · {association.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            associationId={association.id}
            schools={schoolOptions}
            ownSchoolId={association.school_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
