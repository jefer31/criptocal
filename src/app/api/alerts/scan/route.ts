import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a server-role supabase client here because this will be called by an external CRON 
// and needs to bypass RLS to read all users' alerts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // IMPORTANT: You need to add this env var
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function fetchPrice(exchange: string, symbol: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let url = '';
    
    // We only need the ask price for the BUY exchange and bid price for the SELL exchange,
    // but to keep it simple we'll fetch both and return them depending on the context.
    // Actually, we'll return an object { ask, bid }
    let ask = 0, bid = 0;

    switch (exchange) {
      case 'binance':
        url = `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`;
        const resBin = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resBin.askPrice); bid = parseFloat(resBin.bidPrice);
        break;
      case 'bybit':
        url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
        const resByb = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resByb.result.list[0].ask1Price); bid = parseFloat(resByb.result.list[0].bid1Price);
        break;
      case 'mexc':
        url = `https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${symbol}`;
        const resMexc = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resMexc.askPrice); bid = parseFloat(resMexc.bidPrice);
        break;
      case 'kucoin':
        const kSym = symbol.replace('USDT', '-USDT');
        url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`;
        const resKuc = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resKuc.data.bestAsk); bid = parseFloat(resKuc.data.bestBid);
        break;
      case 'okx':
        const oSym = symbol.replace('USDT', '-USDT');
        url = `https://www.okx.com/api/v5/market/ticker?instId=${oSym}`;
        const resOkx = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resOkx.data[0].askPx); bid = parseFloat(resOkx.data[0].bidPx);
        break;
      case 'bitget':
        url = `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`;
        const resBit = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resBit.data[0].askPr); bid = parseFloat(resBit.data[0].bidPr);
        break;
      default:
        return null;
    }
    clearTimeout(timeout);
    return { ask, bid } as any;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  // Protect this route so only the cron job can call it. 
  // Normally you check a custom header like Authorization: Bearer CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
  }

  try {
    // 1. Fetch all active alerts
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts to process' });
    }

    let notificationsSent = 0;

    // 2. Group by pair + exchanges to avoid fetching the same price multiple times
    // For simplicity, we will just iterate and fetch in this version
    for (const alert of alerts) {
      const buyData: any = await fetchPrice(alert.exchange_buy, alert.pair);
      const sellData: any = await fetchPrice(alert.exchange_sell, alert.pair);

      if (buyData && sellData) {
        const buyPrice = buyData.ask;
        const sellPrice = sellData.bid;
        
        if (buyPrice > 0 && sellPrice > 0) {
          const spread = ((sellPrice - buyPrice) / buyPrice) * 100;

          if (spread >= alert.min_spread) {
            // 3. Send Telegram Message
            const message = `
🚨 *OPORTUNIDAD DE ARBITRAJE* 🚨

Par: *${alert.pair}*
Comprar en: *${alert.exchange_buy.toUpperCase()}* ($${buyPrice})
Vender en: *${alert.exchange_sell.toUpperCase()}* ($${sellPrice})

✅ *Spread Bruto: ${spread.toFixed(2)}%*

Calcula las comisiones y red en:
[CriptoCal](https://criptocal.vercel.app)
            `;

            const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            await fetch(tgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: alert.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown'
              })
            });
            notificationsSent++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: alerts.length, notificationsSent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
