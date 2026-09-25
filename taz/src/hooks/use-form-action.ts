"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/form";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Comme useActionState, mais soumis via onSubmit : React ne vide pas le
 * formulaire après l'action, donc l'utilisateur garde sa saisie en cas d'erreur.
 * Le bouton cliqué (name/value, ex. "intent") est inclus dans le FormData.
 */
export function useFormAction(action: Action) {
  const [state, dispatch, pending] = useActionState(action, undefined);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };

  return { state, onSubmit, pending };
}
