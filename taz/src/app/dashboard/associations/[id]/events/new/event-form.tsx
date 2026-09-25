"use client";

import { useState } from "react";
import { Field } from "@/components/field";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createEvent } from "@/app/dashboard/events/actions";
import { PLATFORM_FEE_RATE, platformFeeCents } from "@/lib/pricing";
import { useFormAction } from "@/hooks/use-form-action";

type SchoolOption = { id: string; label: string };

export function EventForm({
  associationId,
  schools,
  ownSchoolId,
}: {
  associationId: string;
  schools: SchoolOption[];
  ownSchoolId: string;
}) {
  const { state, onSubmit, pending } = useFormAction(createEvent);
  const [isFree, setIsFree] = useState(false);
  const [withMember, setWithMember] = useState(false);
  const [accessMode, setAccessMode] = useState<"school_only" | "inter_school">("school_only");
  const [price, setPrice] = useState("");

  const priceCents = Math.round(Number(price.replace(",", ".")) * 100) || 0;
  const fee = platformFeeCents(priceCents);

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <input type="hidden" name="association_id" value={associationId} />

      <section className="grid gap-4">
        <h2 className="font-semibold">Infos</h2>
        <Field label="Titre" htmlFor="title">
          <Input id="title" name="title" required minLength={3} maxLength={120} placeholder="Soirée d'intégration" />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea id="description" name="description" rows={5} placeholder="Programme, dress code, navettes…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu" htmlFor="venue">
            <Input id="venue" name="venue" required placeholder="Le Network" />
          </Field>
          <Field label="Adresse" htmlFor="address">
            <Input id="address" name="address" placeholder="12 rue …, Lille" />
          </Field>
        </div>
        <Field label="Visuel" htmlFor="cover" hint="Format paysage conseillé — 4 Mo max.">
          <Input id="cover" name="cover" type="file" accept="image/png,image/jpeg,image/webp" />
        </Field>
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Dates (heure de Paris)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ouverture du shotgun" htmlFor="shotgun_opens_at">
            <Input id="shotgun_opens_at" name="shotgun_opens_at" type="datetime-local" required />
          </Field>
          <Field label="Début" htmlFor="starts_at">
            <Input id="starts_at" name="starts_at" type="datetime-local" required />
          </Field>
          <Field label="Fin (optionnel)" htmlFor="ends_at">
            <Input id="ends_at" name="ends_at" type="datetime-local" />
          </Field>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Places & accès</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quota total de places" htmlFor="capacity">
            <Input id="capacity" name="capacity" type="number" min={1} required placeholder="300" />
          </Field>
          <Field label="Qui peut réserver ?" htmlFor="access_mode">
            <NativeSelect
              id="access_mode"
              name="access_mode"
              value={accessMode}
              onChange={(e) => setAccessMode(e.target.value as typeof accessMode)}
            >
              <option value="school_only">Étudiants de mon école uniquement</option>
              <option value="inter_school">Inter-écoles</option>
            </NativeSelect>
          </Field>
        </div>

        {accessMode === "inter_school" && (
          <div className="grid gap-2 rounded-lg border p-4">
            <p className="text-sm font-medium">Quotas par école (optionnel)</p>
            <p className="text-muted-foreground text-xs">
              Laisse tout vide pour ouvrir à toutes les écoles. Si tu remplis au moins un quota,
              seules les écoles avec un quota pourront réserver.
            </p>
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {schools.map((s) => (
                <label key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className={s.id === ownSchoolId ? "font-semibold" : undefined}>{s.label}</span>
                  <Input name={`quota_${s.id}`} type="number" min={1} className="w-24" placeholder="—" />
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Billetterie</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_free"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="accent-primary size-4"
          />
          Événement gratuit (0 €)
        </label>

        {!isFree && (
          <>
            <Field
              label="Prix standard (€)"
              htmlFor="standard_price"
              hint={
                priceCents > 0
                  ? `Commission TAZ ${PLATFORM_FEE_RATE * 100} % : ${(fee / 100).toFixed(2)} € — vous recevez ${((priceCents - fee) / 100).toFixed(2)} € par billet.`
                  : undefined
              }
            >
              <Input
                id="standard_price"
                name="standard_price"
                inputMode="decimal"
                required
                placeholder="15"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withMember}
                onChange={(e) => setWithMember(e.target.checked)}
                className="accent-primary size-4"
              />
              Ajouter un tarif adhérent (débloqué par code)
            </label>
            {withMember && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prix adhérent (€)" htmlFor="member_price">
                  <Input id="member_price" name="member_price" inputMode="decimal" required placeholder="10" />
                </Field>
                <Field label="Code adhérent" htmlFor="member_code" hint="À communiquer à vos adhérents.">
                  <Input id="member_code" name="member_code" required minLength={4} placeholder="BDE2026" />
                </Field>
              </div>
            )}
          </>
        )}
      </section>

      <FormMessage state={state} />
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton pending={pending} variant="outline" name="intent" value="draft" pendingLabel="Enregistrement…">
          Enregistrer en brouillon
        </SubmitButton>
        <SubmitButton pending={pending} name="intent" value="publish" pendingLabel="Publication…">
          Publier l&apos;événement
        </SubmitButton>
      </div>
    </form>
  );
}
