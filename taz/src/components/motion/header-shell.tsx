"use client";

import { useEffect, useRef } from "react";

/**
 * Header qui se compacte au scroll. La hauteur de mise en page ne change pas
 * (aucun décalage du contenu) : seuls le fond (scaleY), le logo (scale) et la
 * barre (translateY) sont animés en transform -> 60 fps.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const compact = window.scrollY > 24;
      if (compact !== el.hasAttribute("data-compact")) el.toggleAttribute("data-compact", compact);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header ref={ref} data-header="" className="sticky top-0 z-40 h-16">
      <div
        data-header-bg=""
        aria-hidden
        className="bg-background/80 absolute inset-x-0 top-0 h-16 border-b backdrop-blur"
      />
      <div
        data-header-bar=""
        className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4"
      >
        {children}
      </div>
    </header>
  );
}
