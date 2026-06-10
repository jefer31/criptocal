import { NextResponse } from 'next/server';

/**
 * GET /api/check-env
 * Returns a JSON object indicating whether each required environment variable
 * is defined (true/false). No secret values are exposed.
 */
export async function GET() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TELEGRAM_BOT_TOKEN',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'CRON_SECRET'
  ];

  const status: Record<string, boolean> = {};
  requiredVars.forEach((v) => {
    status[v] = !!process.env[v];
  });

  return NextResponse.json({ envStatus: status });
}
