"use client";

import Link from "next/link";
import { Field } from "@/components/field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { login } from "../actions";
import { useFormAction } from "@/hooks/use-form-action";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(login);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email étudiant" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Connexion…">Se connecter</SubmitButton>
      <p className="text-muted-foreground text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
