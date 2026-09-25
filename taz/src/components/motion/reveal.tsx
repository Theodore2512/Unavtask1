"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { onceVisible, prefersReducedMotion } from "./observer";

/**
 * Apparition au scroll : fondu + translation (transform/opacity uniquement,
 * donc composité par le GPU). Le contenu reste visible sans JavaScript et
 * quand prefers-reduced-motion est actif (cf. globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Décalage en ms, pour échelonner les éléments d'une grille. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.dataset.revealed = "";
      return;
    }
    return onceVisible(el, () => {
      el.dataset.revealed = "";
    });
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      className={cn(className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
