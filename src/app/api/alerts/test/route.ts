import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/alerts/test?chat_id=12345678
 * Envía un mensaje de prueba a Telegram para validar que la integración funciona.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get('chat_id');

  if (!chatId) {
    return NextResponse.json({ error: 'chat_id missing' }, { status: 400 });
  }
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram token not configured' }, { status: 500 });
  }

  const testMessage = `✅ <b>Todo funciona</b>\n\nEste es un mensaje de prueba enviado desde CriptoCal.\nSi lo ves, la comunicación con Telegram está operativa.`;
  const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: testMessage, parse_mode: 'HTML' })
    });
    return NextResponse.json({ success: true, chatId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
