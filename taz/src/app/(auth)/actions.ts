"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getString, type FormState } from "@/lib/form";
import { emailMatchesDomains } from "@/lib/students";

const signupSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(60),
  last_name: z.string().min(1, "Nom requis").max(60),
  email: z.email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  school_id: z.uuid("Choisis ton école"),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    first_name: getString(formData, "first_name"),
    last_name: getString(formData, "last_name"),
    email: getString(formData, "email").toLowerCase(),
    password: formData.get("password"),
    school_id: getString(formData, "school_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("id, name, campus, email_domains")
    .eq("id", input.school_id)
    .single();
  if (!school) return { error: "École introuvable" };

  if (!emailMatchesDomains(input.email, school.email_domains)) {
    return {
      error: `Utilise ton email étudiant ${school.name} (@${school.email_domains.join(", @")}).`,
    };
  }

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${env.siteUrl()}/auth/callback?next=/`,
      data: {
        first_name: input.first_name,
        last_name: input.last_name,
        school_id: input.school_id,
      },
    },
  });
  if (error) return { error: error.message };

  return {
    success: `Presque fini ! Clique sur le lien envoyé à ${input.email} pour activer ton compte.`,
  };
}

function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = getString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(getString(formData, "next") || "/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Email not confirmed"
          ? "Confirme d'abord ton email (regarde tes spams)."
          : "Email ou mot de passe incorrect.",
    };
  }
  redirect(next);
}
