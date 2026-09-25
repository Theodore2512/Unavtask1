"use client";

import { useEffect, useRef } from "react";
import { onceVisible, prefersReducedMotion } from "./observer";

const FORMATS = {
  integer: new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
  currency: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }),
};

/** easeOutExpo : démarre vite, se pose en douceur. */
const ease = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Chiffre qui défile de 0 à `value` quand il entre dans l'écran.
 * La valeur finale est rendue côté serveur (SEO, sans JS, reduced-motion) ;
 * le texte est mis à jour directement dans le DOM pendant l'animation pour
 * éviter un re-render React à chaque frame.
 */
export function CountUp({
  value,
  format = "integer",
  durationMs = 1400,
  className,
}: {
  value: number;
  /** "currency" attend des centimes. */
  format?: keyof typeof FORMATS;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const display = (n: number) =>
    format === "currency" ? FORMATS.currency.format(n / 100) : FORMATS.integer.format(n);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt =
      format === "currency"
        ? (n: number) => FORMATS.currency.format(n / 100)
        : (n: number) => FORMATS.integer.format(n);

    if (prefersReducedMotion() || value === 0) {
      el.textContent = fmt(value);
      el.dataset.counted = "";
      return;
    }

    let frame = 0;
    const stop = onceVisible(el, () => {
      const start = performance.now();
      el.dataset.counted = "";
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);
        el.textContent = fmt(Math.round(value * ease(progress)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      el.textContent = fmt(0);
      frame = requestAnimationFrame(tick);
    });
    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
  }, [value, format, durationMs]);

  return (
    <span
      ref={ref}
      data-countup=""
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display(value)}
    </span>
  );
}
