/**
 * Whitelist de mails autorizados a usar el dashboard.
 * Comparación lowercase. Mantener acá la lista canónica.
 */
export const ALLOWED_EMAILS: readonly string[] = [
  'torresfacundo.lt@gmail.com',
  'peecoulter7@gmail.com',
  'francisco.yorlano.arg@gmail.com',
];

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
