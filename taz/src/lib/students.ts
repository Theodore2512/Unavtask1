/**
 * Vrai si l'email appartient à l'un des domaines (ou sous-domaines) de l'école.
 * Miroir de public.email_matches_school() côté SQL.
 */
export function emailMatchesDomains(email: string, domains: string[]): boolean {
  const host = email.split("@")[1]?.toLowerCase() ?? "";
  return domains.some((d) => {
    const domain = d.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  });
}
