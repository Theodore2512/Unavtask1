import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const PUBLIC_BUCKET = "public-assets";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Upload d'une image dans "<associationId>/<prefix>-<timestamp>.<ext>".
 * La policy Storage vérifie que l'utilisateur est membre de l'asso.
 * Renvoie null si aucun fichier n'a été fourni.
 */
export async function uploadAssociationImage(
  supabase: SupabaseClient<Database>,
  associationId: string,
  file: FormDataEntryValue | null,
  prefix: string,
): Promise<{ url: string | null; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { url: null };
  if (!ALLOWED.includes(file.type)) return { url: null, error: "Format d'image non supporté." };
  if (file.size > MAX_BYTES) return { url: null, error: "Image trop lourde (4 Mo max)." };

  const ext = file.type.split("/")[1];
  const path = `${associationId}/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { url: null, error: error.message };

  return { url: supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl };
}
