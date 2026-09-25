"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toUserMessage } from "@/lib/errors";
import { getOptionalString, getString, type FormState } from "@/lib/form";
import { createConnectOnboardingUrl } from "@/lib/payments";
import { uploadAssociationImage } from "@/lib/storage";
import { randomSuffix, slugify } from "@/lib/utils";

const optionalUrl = z.url("Lien invalide (https://…)").nullable();

const associationSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(80),
  description: z.string().max(2000),
  instagram_url: optionalUrl,
  tiktok_url: optionalUrl,
  linkedin_url: optionalUrl,
  website_url: optionalUrl,
});

function parseAssociation(formData: FormData) {
  return associationSchema.safeParse({
    name: getString(formData, "name"),
    description: getString(formData, "description"),
    instagram_url: getOptionalString(formData, "instagram_url"),
    tiktok_url: getOptionalString(formData, "tiktok_url"),
    linkedin_url: getOptionalString(formData, "linkedin_url"),
    website_url: getOptionalString(formData, "website_url"),
  });
}

export async function createAssociation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseAssociation(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const input = parsed.data;

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("create_association", {
    p_name: input.name,
    p_slug: `${slugify(input.name)}-${randomSuffix()}`,
    p_description: input.description,
    p_instagram_url: input.instagram_url ?? undefined,
    p_tiktok_url: input.tiktok_url ?? undefined,
    p_linkedin_url: input.linkedin_url ?? undefined,
    p_website_url: input.website_url ?? undefined,
  });
  if (error || !id) return { error: toUserMessage(error) };

  const logo = await uploadAssociationImage(supabase, id, formData.get("logo"), "logo");
  if (logo.url) {
    await supabase.from("associations").update({ logo_url: logo.url }).eq("id", id);
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard/associations/${id}`);
}

export async function updateAssociation(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = getString(formData, "id");
  const parsed = parseAssociation(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const logo = await uploadAssociationImage(supabase, id, formData.get("logo"), "logo");
  if (logo.error) return { error: logo.error };

  const { error } = await supabase
    .from("associations")
    .update({
      ...parsed.data,
      ...(logo.url ? { logo_url: logo.url } : {}),
    })
    .eq("id", id);
  if (error) return { error: toUserMessage(error) };

  revalidatePath(`/dashboard/associations/${id}`);
  return { success: "Profil de l'association mis à jour." };
}

export async function startStripeOnboarding(formData: FormData): Promise<void> {
  const id = getString(formData, "id");
  const supabase = await createClient();
  const [{ data: isManager }, { data: userData }] = await Promise.all([
    supabase.rpc("is_association_manager", { p_association_id: id }),
    supabase.auth.getUser(),
  ]);
  if (!isManager) redirect(`/dashboard/associations/${id}`);

  const url = await createConnectOnboardingUrl(id, userData.user?.email);
  redirect(url);
}
