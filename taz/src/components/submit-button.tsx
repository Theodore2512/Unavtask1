"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
  /** À fournir avec useFormAction (useFormStatus ne voit pas les soumissions onSubmit). */
  pending?: boolean;
};

export function SubmitButton({ children, pendingLabel, disabled, pending, ...props }: Props) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button type="submit" disabled={isPending || disabled} {...props}>
      {isPending && <Loader2 className="animate-spin" />}
      {isPending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
