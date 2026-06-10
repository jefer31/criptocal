import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verificamos si Telegram nos envió un mensaje de texto
    if (body.message && body.message.chat && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

      // Si el usuario presiona "Iniciar" (/start)
      if (text === '/start') {
        const welcomeMessage = `¡Hola, ${body.message.chat.first_name || 'Trader'}! Bienvenido a las alertas automáticas de CriptoCal 🚀\n\nTu Telegram Chat ID secreto es:\n\`${chatId}\`\n\n*(Toca el número para copiarlo)*\n\nRegresa a la página web de CriptoCal, pégalo en la configuración y dale a Guardar.`;
        
        const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'Markdown'
          })
        });
      }
    }

    // Siempre devolvemos 200 OK para que Telegram sepa que recibimos el mensaje
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Si hay error interno, igual retornamos 200 a Telegram para que no reintente en bucle
    return NextResponse.json({ ok: true });
  }
}
