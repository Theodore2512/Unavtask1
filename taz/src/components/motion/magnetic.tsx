"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "./observer";

/**
 * Effet magnétique : l'élément suit légèrement le pointeur au survol.
 * Uniquement avec une souris (pas sur mobile), jamais en reduced-motion.
 * Les positions sont appliquées dans un requestAnimationFrame (1 écriture
 * de style max par frame) et seulement via transform.
 */
export function Magnetic({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode;
  /** Part du décalage pointeur/centre appliquée (0.25 = 25 %). */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let frame = 0;
    let target = { x: 0, y: 0 };
    const apply = () => {
      frame = 0;
      el.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target = {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength,
      };
      el.dataset.magnetActive = "";
      schedule();
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
      delete el.dataset.magnetActive;
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [strength]);

  return (
    <span ref={ref} data-magnetic="" className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
