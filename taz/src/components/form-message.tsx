import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/form";

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.success) return null;
  const isError = Boolean(state.error);
  return (
    <Alert variant={isError ? "destructive" : "default"}>
      {isError ? <AlertCircle /> : <CheckCircle2 />}
      <AlertDescription>{state.error ?? state.success}</AlertDescription>
    </Alert>
  );
}
