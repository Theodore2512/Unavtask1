"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getString } from "@/lib/form";

export async function toggleAssociationVerified(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getString(formData, "id");
  const verified = getString(formData, "verified") === "true";
  const supabase = await createClient();
  await supabase.from("associations").update({ verified }).eq("id", id);
  revalidatePath("/admin");
}
