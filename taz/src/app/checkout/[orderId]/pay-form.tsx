"use client";

import { CreditCard } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { payOrder } from "./actions";
import { useFormAction } from "@/hooks/use-form-action";

export function PayForm({ orderId, label }: { orderId: string; label: string }) {
  const { state, onSubmit, pending } = useFormAction(payOrder);
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input type="hidden" name="order_id" value={orderId} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} size="lg" pendingLabel="Redirection…">
        <CreditCard /> {label}
      </SubmitButton>
    </form>
  );
}
