export type FormState = { error?: string; success?: string } | undefined;

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value === "" ? null : value;
}

export function getInt(formData: FormData, key: string): number | null {
  const raw = getString(formData, key);
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

/** "12,50" ou "12.5" -> 1250 centimes. */
export function getCents(formData: FormData, key: string): number | null {
  const raw = getString(formData, key).replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
