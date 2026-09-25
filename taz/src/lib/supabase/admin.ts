import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

/**
 * Client service_role : contourne la RLS. À n'utiliser que côté serveur, pour
 * les opérations de confiance (confirmation de paiement, webhooks).
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
