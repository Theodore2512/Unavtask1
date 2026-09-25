/** Transforme une erreur Postgres/Supabase en message affichable. */
export function toUserMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "Une erreur est survenue.";
  if (error.code === "23505") return "Cet identifiant est déjà utilisé.";
  return error.message || "Une erreur est survenue.";
}
