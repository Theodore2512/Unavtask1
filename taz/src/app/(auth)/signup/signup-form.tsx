"use client";

import { useState } from "react";
import Link from "next/link";
import { Field } from "@/components/field";
import { FormMessage } from "@/components/form-message";
import { SchoolPicker, type CityOption, type SchoolOption } from "@/components/school-picker";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { signup } from "../actions";
import { useFormAction } from "@/hooks/use-form-action";

export function SignupForm({ cities, schools }: { cities: CityOption[]; schools: SchoolOption[] }) {
  const { state, onSubmit, pending } = useFormAction(signup);
  const [school, setSchool] = useState<SchoolOption | null>(null);

  if (state?.success) {
    return <FormMessage state={state} />;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="first_name">
          <Input id="first_name" name="first_name" autoComplete="given-name" required />
        </Field>
        <Field label="Nom" htmlFor="last_name">
          <Input id="last_name" name="last_name" autoComplete="family-name" required />
        </Field>
      </div>

      <SchoolPicker cities={cities} schools={schools} onSchoolChange={setSchool} />

      <Field
        label="Email étudiant"
        htmlFor="email"
        hint="Ton email d'école sert à vérifier ton statut étudiant."
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={school ? `prenom.nom@${school.email_domains[0]}` : "prenom.nom@ecole.fr"}
          required
        />
      </Field>
      <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Création…">Créer mon compte</SubmitButton>
      <p className="text-muted-foreground text-center text-sm">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
