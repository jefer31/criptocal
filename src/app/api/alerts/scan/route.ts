import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a server-role supabase client here because this will be called by an external CRON 
// and needs to bypass RLS to read all users' alerts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // IMPORTANT: You need to add this env var
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function fetchPrice(exchange: string, symbol: string): Promise<{ ask: number; bid: number } | null> {
  let ask = 0, bid = 0;

  // Step 1: Try the exchange API (each wrapped in try-catch so geo-blocks don't abort)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const opts = { signal: controller.signal };

    switch (exchange) {
      case 'binance': {
        try {
          // Usamos data-api para evitar el bloqueo de IP de EE.UU a los servidores de Vercel
          const res = await fetch(`https://data-api.binance.vision/api/v3/ticker/bookTicker?symbol=${symbol}`, opts).then(r => r.json());
          if (res.askPrice) { ask = parseFloat(res.askPrice); bid = parseFloat(res.bidPrice); }
        } catch (_) {}
        break;
      }
      case 'bybit': {
        try {
          const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`, opts).then(r => r.json());
          if (res.result?.list?.[0]) { ask = parseFloat(res.result.list[0].ask1Price); bid = parseFloat(res.result.list[0].bid1Price); }
        } catch (_) {}
        break;
      }
      case 'mexc': {
        try {
          const res = await fetch(`https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${symbol}`, opts).then(r => r.json());
          if (res.askPrice) { ask = parseFloat(res.askPrice); bid = parseFloat(res.bidPrice); }
        } catch (_) {}
        break;
      }
      case 'kucoin': {
        try {
          const kSym = symbol.replace('USDT', '-USDT');
          const res = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`, opts).then(r => r.json());
          if (res.data?.bestAsk) { ask = parseFloat(res.data.bestAsk); bid = parseFloat(res.data.bestBid); }
        } catch (_) {}
        break;
      }
      case 'okx': {
        try {
          const oSym = symbol.replace('USDT', '-USDT');
          const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${oSym}`, opts).then(r => r.json());
          if (res.data?.[0]?.askPx) { ask = parseFloat(res.data[0].askPx); bid = parseFloat(res.data[0].bidPx); }
        } catch (_) {}
        break;
      }
      case 'bitget': {
        try {
          const res = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`, opts).then(r => r.json());
          if (res.data?.[0]?.askPr) { ask = parseFloat(res.data[0].askPr); bid = parseFloat(res.data[0].bidPr); }
        } catch (_) {}
        break;
      }
      default:
        break;
    }
    clearTimeout(timeout);
  } catch (_) {
    // Outer catch — exchange step failed entirely, continue to fallback
  }

  // Fallback a CoinGecko eliminado para evitar falsos positivos con spreads inventados

  if (ask > 0 && bid > 0 && !isNaN(ask) && !isNaN(bid)) {
    return { ask, bid };
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debugMode = url.searchParams.get('debug') === 'true';
  const forceNotify = url.searchParams.get('force') === 'true';

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured', hasToken: false }, { status: 500 });
  }

  try {
    // 1. Fetch all active alerts
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts to process', alertCount: 0 });
    }

    let notificationsSent = 0;
    const debugInfo: any[] = [];

    // 2. Process each alert
    for (const alert of alerts) {
      const alertDebug: any = {
        alertId: alert.id,
        pair: alert.pair,
        chatId: alert.telegram_chat_id,
        exchangeBuy: alert.exchange_buy,
        exchangeSell: alert.exchange_sell,
        minSpread: alert.min_spread,
        isActive: alert.is_active,
      };

      const buyData: any = await fetchPrice(alert.exchange_buy, alert.pair);
      const sellData: any = await fetchPrice(alert.exchange_sell, alert.pair);

      alertDebug.buyDataRaw = buyData;
      alertDebug.sellDataRaw = sellData;

      if (buyData && sellData) {
        const buyPrice = buyData.ask;
        const sellPrice = sellData.bid;
        
        alertDebug.buyPrice = buyPrice;
        alertDebug.sellPrice = sellPrice;

        if (buyPrice > 0 && sellPrice > 0) {
          const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
          alertDebug.spread = spread;
          alertDebug.wouldNotify = spread >= alert.min_spread;

          if (spread >= alert.min_spread || forceNotify) {
            const message = `
🚨 *OPORTUNIDAD DE ARBITRAJE* 🚨

Par: *${alert.pair}*
Comprar en: *${alert.exchange_buy.toUpperCase()}* ($${buyPrice.toFixed(2)})
Vender en: *${alert.exchange_sell.toUpperCase()}* ($${sellPrice.toFixed(2)})

✅ *Spread Bruto: ${spread.toFixed(4)}%*

Calcula las comisiones y red en:
[CriptoCal](https://criptocal.vercel.app)
            `.trim();

            const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const tgRes = await fetch(tgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: alert.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown'
              })
            });
            const tgResult = await tgRes.json();
            alertDebug.telegramResponse = tgResult;
            if (tgResult.ok) {
              notificationsSent++;
            }
          }
        } else {
          alertDebug.error = 'Prices are zero or negative';
        }
      } else {
        alertDebug.error = `Failed to fetch prices: buy=${!!buyData}, sell=${!!sellData}`;
      }

      debugInfo.push(alertDebug);
    }

    const responseBody: any = { success: true, processed: alerts.length, notificationsSent };
    if (debugMode) responseBody.debug = debugInfo;
    return NextResponse.json(responseBody);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
