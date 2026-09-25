import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

/** Utilisateur + profil courant (mémoïsé pour la requête). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
});

export async function requireProfile(next?: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile("/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
