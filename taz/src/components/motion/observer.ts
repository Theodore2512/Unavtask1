"use client";

/**
 * Un seul IntersectionObserver partagé par toutes les animations au scroll
 * (moins coûteux qu'un observer par élément). Chaque élément n'est notifié
 * qu'une fois, puis désobservé.
 */
type Callback = () => void;

const callbacks = new WeakMap<Element, Callback>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callbacks.get(entry.target)?.();
        callbacks.delete(entry.target);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
  );
  return observer;
}

export function onceVisible(element: Element, callback: Callback): () => void {
  callbacks.set(element, callback);
  getObserver().observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
