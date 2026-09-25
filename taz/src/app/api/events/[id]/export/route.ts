import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const STATUS_LABEL = {
  paid: "Payé",
  free: "Gratuit",
  pending: "En attente",
  cancelled: "Annulé",
  expired: "Expiré",
} as const;

function csvCell(value: string | number | null): string {
  let s = value === null ? "" : String(value);
  // Neutralise l'injection de formules dans Excel / Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Liste d'émargement : CSV séparé par « ; » (Excel FR), UTF-8 avec BOM. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/events/[id]/export">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("title").eq("id", id).maybeSingle();
  const { data: attendees, error } = await supabase.rpc("get_event_attendees", { p_event_id: id });
  if (!event || error) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const header = ["Nom", "Prénom", "Email", "École", "Tarif", "Montant (€)", "Statut paiement", "Code billet", "Émargement"];
  const lines = attendees
    .filter((a) => a.order_status !== "pending")
    .map((a) =>
      [
        a.last_name.toUpperCase(),
        a.first_name,
        a.email,
        a.school_name,
        a.ticket_type,
        (a.amount_cents / 100).toFixed(2).replace(".", ","),
        STATUS_LABEL[a.order_status],
        a.qr_token ? a.qr_token.slice(0, 8).toUpperCase() : "",
        a.checked_in_at ? "Présent" : "",
      ]
        .map(csvCell)
        .join(";"),
    );

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="emargement-${slugify(event.title)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
