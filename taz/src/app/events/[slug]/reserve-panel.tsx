"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Magnetic } from "@/components/motion/magnetic";
import { formatPrice } from "@/lib/format";
import { HOLD_MINUTES } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { reserveTicket } from "./actions";
import { useFormAction } from "@/hooks/use-form-action";

export type TicketOption = {
  id: string;
  name: string;
  kind: "standard" | "member" | "free";
  price_cents: number;
  remaining: number;
};

export function ReservePanel({
  eventId,
  slug,
  options,
  disabledReason,
}: {
  eventId: string;
  slug: string;
  options: TicketOption[];
  disabledReason: string | null;
}) {
  const { state, onSubmit, pending } = useFormAction(reserveTicket);
  const firstAvailable = options.find((o) => o.remaining > 0)?.id ?? "";
  const [selected, setSelected] = useState(firstAvailable);
  const selectedOption = options.find((o) => o.id === selected);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />

      <fieldset className="grid gap-2" disabled={Boolean(disabledReason)}>
        <legend className="sr-only">Tarif</legend>
        {options.map((o) => {
          const soldOut = o.remaining <= 0;
          return (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition",
                selected === o.id && "border-primary ring-primary/30 ring-2",
                soldOut && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ticket_type_id"
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  disabled={soldOut}
                  className="accent-primary"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium">
                    {o.name}
                    {o.kind === "member" && <Lock className="text-muted-foreground size-3.5" />}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {soldOut
                      ? "Complet"
                      : `${o.remaining} place${o.remaining > 1 ? "s" : ""} restante${o.remaining > 1 ? "s" : ""}`}
                  </span>
                </span>
              </span>
              <span className="font-semibold">{formatPrice(o.price_cents)}</span>
            </label>
          );
        })}
      </fieldset>

      {selectedOption?.kind === "member" && (
        <div className="grid gap-2">
          <Label htmlFor="member_code">Code adhérent</Label>
          <Input id="member_code" name="member_code" autoComplete="off" required />
        </div>
      )}

      <FormMessage state={state} />

      <Magnetic strength={0.15} className="w-full">
        <SubmitButton
          pending={pending}
          size="lg"
          className="w-full"
          disabled={Boolean(disabledReason) || !selectedOption || selectedOption.remaining <= 0}
          pendingLabel="Réservation en cours…"
        >
          {disabledReason ??
            (selectedOption?.price_cents === 0 ? "Réserver ma place" : "SHOTGUN 🔥")}
        </SubmitButton>
      </Magnetic>
      {selectedOption && selectedOption.price_cents > 0 && !disabledReason && (
        <p className="text-muted-foreground text-center text-xs">
          Ta place est bloquée {HOLD_MINUTES} minutes le temps de payer.
        </p>
      )}
    </form>
  );
}
