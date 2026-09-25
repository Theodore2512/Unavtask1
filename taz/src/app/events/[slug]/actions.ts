"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOptionalString, getString, type FormState } from "@/lib/form";
import { toUserMessage } from "@/lib/errors";

export async function reserveTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const eventId = getString(formData, "event_id");
  const ticketTypeId = getString(formData, "ticket_type_id");
  const slug = getString(formData, "slug");
  const memberCode = getOptionalString(formData, "member_code");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${slug}`);

  const { data: order, error } = await supabase.rpc("reserve_ticket", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_member_code: memberCode ?? undefined,
  });
  if (error || !order) return { error: toUserMessage(error) };

  if (order.status === "free" || order.status === "paid") {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id")
      .eq("order_id", order.id)
      .single();
    redirect(ticket ? `/tickets/${ticket.id}` : "/tickets");
  }

  redirect(`/checkout/${order.id}`);
}
