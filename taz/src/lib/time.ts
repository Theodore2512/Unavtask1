/**
 * Heure de la requête, pour les Server Components (rendus à chaque requête).
 * Centralisé ici pour pouvoir être remplacé dans les tests.
 */
export function requestTime(): number {
  return Date.now();
}
