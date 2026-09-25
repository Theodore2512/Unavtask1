/** Commission TAZ sur les billets payants (doit rester alignée avec reserve_ticket en SQL). */
export const PLATFORM_FEE_RATE = 0.03;

/** Durée du panier pendant le shotgun (doit rester alignée avec reserve_ticket en SQL). */
export const HOLD_MINUTES = 5;

export function platformFeeCents(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE_RATE);
}
