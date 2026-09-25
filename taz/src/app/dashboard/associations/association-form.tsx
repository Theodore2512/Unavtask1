"use client";

import { Field } from "@/components/field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form";
import type { Tables } from "@/types/database";
import { useFormAction } from "@/hooks/use-form-action";

type Association = Pick<
  Tables<"associations">,
  | "id"
  | "name"
  | "description"
  | "logo_url"
  | "instagram_url"
  | "tiktok_url"
  | "linkedin_url"
  | "website_url"
>;

export function AssociationForm({
  action,
  association,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  association?: Association;
  submitLabel: string;
}) {
  const { state, onSubmit, pending } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {association && <input type="hidden" name="id" value={association.id} />}

      <Field label="Nom de l'asso / BDE / liste" htmlFor="name">
        <Input id="name" name="name" defaultValue={association?.name} required />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={association?.description}
          placeholder="Qui êtes-vous, que proposez-vous ?"
        />
      </Field>
      <Field label="Logo" htmlFor="logo" hint="PNG, JPG ou WebP — 4 Mo max.">
        <div className="flex items-center gap-3">
          {association?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={association.logo_url} alt="" className="size-12 rounded-full border object-cover" />
          )}
          <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram" htmlFor="instagram_url">
          <Input id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/…" defaultValue={association?.instagram_url ?? ""} />
        </Field>
        <Field label="TikTok" htmlFor="tiktok_url">
          <Input id="tiktok_url" name="tiktok_url" type="url" placeholder="https://tiktok.com/@…" defaultValue={association?.tiktok_url ?? ""} />
        </Field>
        <Field label="LinkedIn" htmlFor="linkedin_url">
          <Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/company/…" defaultValue={association?.linkedin_url ?? ""} />
        </Field>
        <Field label="Site web" htmlFor="website_url">
          <Input id="website_url" name="website_url" type="url" placeholder="https://…" defaultValue={association?.website_url ?? ""} />
        </Field>
      </div>

      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Enregistrement…">{submitLabel}</SubmitButton>
    </form>
  );
}
