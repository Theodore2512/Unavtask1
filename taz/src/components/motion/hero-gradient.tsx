/**
 * Dégradé animé du hero : trois halos (radial-gradient) qui dérivent
 * lentement. Seul `transform` est animé, sur des calques dédiés -> aucun
 * repaint pendant l'animation. Figé en reduced-motion (globals.css).
 */
export function HeroGradient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div data-hero-blob="1" />
      <div data-hero-blob="2" />
      <div data-hero-blob="3" />
    </div>
  );
}
