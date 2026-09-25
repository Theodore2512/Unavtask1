"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toUserMessage } from "@/lib/errors";
import { parisLocalToIso } from "@/lib/format";
import { getCents, getInt, getOptionalString, getString, type FormState } from "@/lib/form";
import { uploadAssociationImage } from "@/lib/storage";
import { randomSuffix, slugify } from "@/lib/utils";
import type { TablesInsert } from "@/types/database";

const eventSchema = z
  .object({
    association_id: z.uuid(),
    title: z.string().min(3, "Titre trop court").max(120),
    description: z.string().max(5000),
    venue: z.string().min(2, "Lieu requis").max(120),
    address: z.string().max(200).nullable(),
    starts_at: z.string().min(1, "Date de début requise"),
    ends_at: z.string().nullable(),
    shotgun_opens_at: z.string().min(1, "Ouverture du shotgun requise"),
    capacity: z.number().int().positive("Quota de places invalide"),
    access_mode: z.enum(["school_only", "inter_school"]),
    status: z.enum(["draft", "published"]),
    is_free: z.boolean(),
    standard_price_cents: z.number().int().nonnegative().nullable(),
    member_price_cents: z.number().int().nonnegative().nullable(),
    member_code: z.string().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.is_free && !v.standard_price_cents) {
      ctx.addIssue({ code: "custom", message: "Indique un prix standard (ou coche « gratuit »)." });
    }
    if (!v.is_free && v.member_price_cents !== null) {
      if (!v.member_code || v.member_code.length < 4) {
        ctx.addIssue({ code: "custom", message: "Le code adhérent doit faire au moins 4 caractères." });
      }
      if (v.member_price_cents === 0) {
        ctx.addIssue({ code: "custom", message: "Le tarif adhérent doit être supérieur à 0 €." });
      }
    }
  });

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = eventSchema.safeParse({
    association_id: getString(formData, "association_id"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    venue: getString(formData, "venue"),
    address: getOptionalString(formData, "address"),
    starts_at: getString(formData, "starts_at"),
    ends_at: getOptionalString(formData, "ends_at"),
    shotgun_opens_at: getString(formData, "shotgun_opens_at"),
    capacity: getInt(formData, "capacity"),
    access_mode: getString(formData, "access_mode"),
    status: getString(formData, "intent") === "publish" ? "published" : "draft",
    is_free: formData.get("is_free") === "on",
    standard_price_cents: getCents(formData, "standard_price"),
    member_price_cents: getCents(formData, "member_price"),
    member_code: getOptionalString(formData, "member_code"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const startsAt = parisLocalToIso(v.starts_at);
  const endsAt = v.ends_at ? parisLocalToIso(v.ends_at) : null;
  const opensAt = parisLocalToIso(v.shotgun_opens_at);
  if (opensAt > startsAt) return { error: "Le shotgun doit ouvrir avant le début de l'événement." };
  if (endsAt && endsAt <= startsAt) return { error: "La fin doit être après le début." };

  // Quotas par école (inter-écoles) : champs quota_<school_id>.
  const quotas: { school_id: string; quota: number }[] = [];
  if (v.access_mode === "inter_school") {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("quota_") || typeof value !== "string" || value.trim() === "") continue;
      const quota = Number(value);
      if (!Number.isInteger(quota) || quota <= 0) return { error: "Quota d'école invalide." };
      quotas.push({ school_id: key.slice("quota_".length), quota });
    }
    const total = quotas.reduce((s, q) => s + q.quota, 0);
    if (total > v.capacity) {
      return { error: `La somme des quotas écoles (${total}) dépasse la capacité (${v.capacity}).` };
    }
  }

  const supabase = await createClient();
  const cover = await uploadAssociationImage(supabase, v.association_id, formData.get("cover"), "cover");
  if (cover.error) return { error: cover.error };

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      association_id: v.association_id,
      title: v.title,
      slug: `${slugify(v.title)}-${randomSuffix()}`,
      description: v.description,
      venue: v.venue,
      address: v.address,
      starts_at: startsAt,
      ends_at: endsAt,
      shotgun_opens_at: opensAt,
      capacity: v.capacity,
      access_mode: v.access_mode,
      status: "draft", // publié à la fin, une fois la billetterie complète
      cover_url: cover.url,
    })
    .select("id")
    .single();
  if (error || !event) return { error: toUserMessage(error) };

  const ticketTypes: TablesInsert<"ticket_types">[] = v.is_free
    ? [{ event_id: event.id, name: "Entrée gratuite", kind: "free", price_cents: 0, sort_order: 0 }]
    : [
        {
          event_id: event.id,
          name: "Standard",
          kind: "standard",
          price_cents: v.standard_price_cents!,
          sort_order: 0,
        },
        ...(v.member_price_cents !== null
          ? [
              {
                event_id: event.id,
                name: "Adhérent",
                kind: "member" as const,
                price_cents: v.member_price_cents,
                sort_order: 1,
              },
            ]
          : []),
      ];

  const steps = await Promise.all([
    supabase.from("ticket_types").insert(ticketTypes),
    !v.is_free && v.member_price_cents !== null && v.member_code
      ? supabase.from("event_secrets").insert({ event_id: event.id, member_code: v.member_code })
      : Promise.resolve({ error: null }),
    quotas.length
      ? supabase
          .from("event_school_quotas")
          .insert(quotas.map((q) => ({ ...q, event_id: event.id })))
      : Promise.resolve({ error: null }),
  ]);
  const failed = steps.find((s) => s.error);
  if (failed?.error) {
    await supabase.from("events").delete().eq("id", event.id); // brouillon => autorisé
    return { error: toUserMessage(failed.error) };
  }

  if (v.status === "published") {
    await supabase.from("events").update({ status: "published" }).eq("id", event.id);
  }

  revalidatePath("/");
  redirect(`/dashboard/events/${event.id}`);
}

export async function setEventStatus(formData: FormData): Promise<void> {
  const id = getString(formData, "id");
  const status = z.enum(["draft", "published", "cancelled"]).parse(getString(formData, "status"));
  const supabase = await createClient();
  await supabase.from("events").update({ status }).eq("id", id);
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath("/");
}

export async function cancelAttendeeOrder(formData: FormData): Promise<void> {
  const orderId = getString(formData, "order_id");
  const eventId = getString(formData, "event_id");
  const supabase = await createClient();
  await supabase.rpc("organizer_cancel_order", { p_order_id: orderId });
  revalidatePath(`/dashboard/events/${eventId}`);
}
