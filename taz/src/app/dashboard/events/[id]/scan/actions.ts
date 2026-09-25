"use server";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type CheckInOutcome = {
  result: Enums<"check_in_result"> | "error";
  name: string | null;
  detail: string | null;
  checkedInAt: string | null;
  checkedInCount: number | null;
};

export async function checkInTicket(eventId: string, code: string): Promise<CheckInOutcome> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("check_in_ticket", { p_event_id: eventId, p_code: code })
    .single();

  if (error || !data) {
    return {
      result: "error",
      name: null,
      detail: error?.message ?? "Erreur inconnue",
      checkedInAt: null,
      checkedInCount: null,
    };
  }

  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "used");

  return {
    result: data.result,
    name: data.first_name ? `${data.first_name} ${data.last_name?.toUpperCase() ?? ""}`.trim() : null,
    detail: [data.ticket_type, data.school_name].filter(Boolean).join(" · ") || null,
    checkedInAt: data.checked_in_at,
    checkedInCount: count,
  };
}
