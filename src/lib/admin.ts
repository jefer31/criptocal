// Admin emails loaded from environment variable
// In Vercel, set ADMIN_EMAILS="email1@example.com,email2@example.com"
// Falls back to empty list if not set (no one gets VIP access by default)

const ADMIN_EMAILS: string[] = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);

export function isVipAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
