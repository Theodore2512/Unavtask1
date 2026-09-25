const TIME_ZONE = "Europe/Paris";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number): string {
  return cents === 0 ? "Gratuit" : euro.format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** Valeur d'un <input type="datetime-local"> (heure de Paris) -> ISO UTC. */
export function parisLocalToIso(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  // Décalage de Paris à cet instant (gère l'heure d'été).
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(asUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const parisAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(asUtc - (parisAsUtc - asUtc)).toISOString();
}
